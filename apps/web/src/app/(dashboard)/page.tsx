import { createClient } from "@/lib/supabase/server";
import { StatCards } from "@/components/dashboard/stat-cards";
import { IntensityChartWrapper } from "@/components/dashboard/intensity-chart-wrapper";
import { RiskDonutWrapper } from "@/components/dashboard/risk-donut-wrapper";
import { RecentSessionsTable } from "@/components/dashboard/recent-sessions-table";
import { AlertPanel } from "@/components/dashboard/alert-panel";
import { SessionSummaryCard } from "@/components/dashboard/session-summary-card";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("auth_user_id", user!.id)
    .single();

  if (!profile) return null;

  const ageGroups =
    profile.role === "coach" ? profile.age_groups_visible : undefined;

  // Fetch all data
  const { data: sessionsRaw } = await supabase
    .from("sessions")
    .select("*")
    .eq("academy_id", profile.academy_id)
    .order("date", { ascending: false })
    .limit(10);

  const sessions = sessionsRaw ?? [];
  const latestSession = sessions[0] ?? null;

  const { data: alertsRaw } = await supabase
    .from("load_records")
    .select(
      "*, players!inner(name, jersey_number, age_group, academy_id, position)"
    )
    .eq("players.academy_id", profile.academy_id)
    .in("risk_flag", ["amber", "red"])
    .order("created_at", { ascending: false })
    .limit(20);

  const alerts = alertsRaw ?? [];

  // Trend data
  const since = new Date();
  since.setDate(since.getDate() - 14);

  const { data: trendSessions } = await supabase
    .from("sessions")
    .select("id, date, age_group, type")
    .eq("academy_id", profile.academy_id)
    .gte("date", since.toISOString().split("T")[0])
    .order("date", { ascending: true });

  let trendData: any[] = [];
  if (trendSessions && trendSessions.length > 0) {
    const sessionIds = trendSessions.map((s) => s.id);
    const { data: metrics } = await supabase
      .from("wearable_metrics")
      .select("session_id, hr_avg, hr_max, trimp_score")
      .in("session_id", sessionIds);

    const metricsMap = new Map<string, any[]>();
    for (const m of metrics ?? []) {
      const arr = metricsMap.get(m.session_id) ?? [];
      arr.push(m);
      metricsMap.set(m.session_id, arr);
    }

    trendData = trendSessions.map((s) => ({
      ...s,
      wearable_metrics: metricsMap.get(s.id) ?? [],
    }));
  }

  // Risk distribution
  const { data: loadData } = await supabase
    .from("load_records")
    .select(
      "risk_flag, player_id, date, players!inner(academy_id, age_group)"
    )
    .eq("players.academy_id", profile.academy_id)
    .order("date", { ascending: false });

  const seen = new Set<string>();
  const riskDist = { blue: 0, green: 0, amber: 0, red: 0 };
  for (const r of loadData ?? []) {
    if (!seen.has(r.player_id)) {
      seen.add(r.player_id);
      const flag = r.risk_flag as keyof typeof riskDist;
      if (flag in riskDist) riskDist[flag]++;
    }
  }

  // Total players count
  const { count: totalPlayers } = await supabase
    .from("players")
    .select("*", { count: "exact", head: true })
    .eq("academy_id", profile.academy_id);

  // Compute stat card values
  const activeSessions = trendSessions?.length ?? 0;
  const playersAtRisk = riskDist.amber + riskDist.red;

  // Compute avg HR and TRIMP from the latest session with wearable data
  let avgTeamHR: number | null = null;
  let avgTrimp: number | null = null;
  let latestSessionMetrics: {
    avgHr: number;
    peakHr: number;
    avgTrimp: number;
    playersTracked: number;
  } | null = null;

  // Find the latest trend session that has wearable metrics
  const sessionsWithMetrics = [...trendData]
    .reverse()
    .find((s) => s.wearable_metrics.length > 0);

  if (sessionsWithMetrics) {
    const wm = sessionsWithMetrics.wearable_metrics;
    avgTeamHR = Math.round(
      wm.reduce((sum: number, m: any) => sum + m.hr_avg, 0) / wm.length
    );
    avgTrimp = Math.round(
      wm.reduce((sum: number, m: any) => sum + m.trimp_score, 0) / wm.length
    );
  }

  // Compute latest session wearable metrics
  if (latestSession) {
    const { data: latestMetrics } = await supabase
      .from("wearable_metrics")
      .select("hr_avg, hr_max, trimp_score")
      .eq("session_id", latestSession.id);

    if (latestMetrics && latestMetrics.length > 0) {
      latestSessionMetrics = {
        avgHr: Math.round(
          latestMetrics.reduce((s: number, m: any) => s + m.hr_avg, 0) /
            latestMetrics.length
        ),
        peakHr: Math.round(
          Math.max(...latestMetrics.map((m: any) => m.hr_max))
        ),
        avgTrimp: Math.round(
          latestMetrics.reduce(
            (s: number, m: any) => s + m.trimp_score,
            0
          ) / latestMetrics.length
        ),
        playersTracked: latestMetrics.length,
      };
    }
  }

  // Chart data: aggregate per-session averages
  const chartData = trendData.map((s) => {
    const wm = s.wearable_metrics ?? [];
    const avgHr =
      wm.length > 0
        ? Math.round(wm.reduce((sum: number, m: any) => sum + m.hr_avg, 0) / wm.length)
        : 0;
    const avgTr =
      wm.length > 0
        ? Math.round(
            wm.reduce((sum: number, m: any) => sum + m.trimp_score, 0) /
              wm.length
          )
        : 0;
    return {
      date: new Date(s.date).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      }),
      avgHr,
      avgTrimp: avgTr,
    };
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold">Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          Welcome back, {profile.name}.
          {profile.role === "coach" &&
            ` Viewing: ${(ageGroups ?? []).join(", ")}`}
        </p>
      </div>

      {/* Row 1: Stat Cards */}
      <StatCards
        totalPlayers={totalPlayers ?? 0}
        activeSessions={activeSessions}
        avgTeamHR={avgTeamHR}
        playersAtRisk={playersAtRisk}
        avgTrimp={avgTrimp}
      />

      {/* Row 2: Charts - Session Intensity + Risk Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-card shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Session Intensity</h3>
            <div className="flex gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-blue-500 inline-block" />
                Avg HR
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-orange-500 inline-block" />
                TRIMP
              </span>
            </div>
          </div>
          <IntensityChartWrapper data={chartData} />
        </div>

        <div className="rounded-xl border bg-card shadow-sm p-4">
          <div className="mb-3">
            <h3 className="text-sm font-semibold">Risk Distribution</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Player load status overview
            </p>
          </div>
          <RiskDonutWrapper distribution={riskDist} />
        </div>
      </div>

      {/* Row 3: Recent Sessions + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <RecentSessionsTable sessions={sessions} />
        </div>
        <div className="lg:col-span-2 max-h-[420px] overflow-y-auto rounded-xl">
          <AlertPanel alerts={alerts as any} />
        </div>
      </div>

      {/* Row 4: Latest Session Summary */}
      <SessionSummaryCard
        session={latestSession}
        wearableMetrics={latestSessionMetrics}
      />
    </div>
  );
}
