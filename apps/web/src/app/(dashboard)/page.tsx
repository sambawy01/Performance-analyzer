import { createClient } from "@/lib/supabase/server";
import { LatestSessionCard } from "@/components/dashboard/latest-session-card";
import { AlertPanel } from "@/components/dashboard/alert-panel";
import { RecentSessionsTable } from "@/components/dashboard/recent-sessions-table";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";

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
    .select("*, players!inner(name, jersey_number, age_group, academy_id, position)")
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
    .select("risk_flag, player_id, date, players!inner(academy_id, age_group)")
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome, {profile.name}.
          {profile.role === "coach" &&
            ` Viewing: ${(ageGroups ?? []).join(", ")}`}
        </p>
      </div>

      {/* Top row: Latest session (left) + Alerts (right, height-limited) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <LatestSessionCard session={latestSession} />
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          <AlertPanel alerts={alerts as any} />
        </div>
      </div>

      {/* Charts row */}
      <DashboardCharts
        trendData={JSON.parse(JSON.stringify(trendData))}
        riskDistribution={riskDist}
      />

      {/* Recent sessions table */}
      <RecentSessionsTable sessions={sessions} />
    </div>
  );
}
