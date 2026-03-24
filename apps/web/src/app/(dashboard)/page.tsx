import { createClient, createAdminClient } from "@/lib/supabase/server";
import { StatCards } from "@/components/dashboard/stat-cards";
import { IntensityChartWrapper } from "@/components/dashboard/intensity-chart-wrapper";
import { RiskDonutWrapper } from "@/components/dashboard/risk-donut-wrapper";
import { RecentSessionsTable } from "@/components/dashboard/recent-sessions-table";
import { AlertPanel } from "@/components/dashboard/alert-panel";
import { SessionSummaryCard } from "@/components/dashboard/session-summary-card";
import { DailyBriefing } from "@/components/planner/daily-briefing";
import { LoadHeatmap } from "@/components/dashboard/load-heatmap";
import { EmptyState } from "@/components/ui/empty-state";
import { Sparkles } from "lucide-react";

import type { Metadata } from "next";
export const metadata: Metadata = { title: "Dashboard -- Coach M8" };

export default async function DashboardPage() {
  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  // Use admin client for all data queries (bypasses RLS, works on Vercel)
  const supabase = createAdminClient();

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

  // Fetch alerts — no FK join (breaks on Supabase Cloud)
  const { data: alertsRaw } = await supabase
    .from("load_records")
    .select("*")
    .in("risk_flag", ["amber", "red"])
    .order("created_at", { ascending: false })
    .limit(40);

  // Enrich with player data
  const alertPlayerIds = [...new Set((alertsRaw ?? []).map((a: any) => a.player_id))];
  const { data: alertPlayers } = alertPlayerIds.length > 0
    ? await supabase.from("players").select("id, name, jersey_number, age_group, academy_id, position").in("id", alertPlayerIds)
    : { data: [] };
  const alertPlayerMap = new Map((alertPlayers ?? []).map((p: any) => [p.id, p]));
  const alerts = (alertsRaw ?? [])
    .map((a: any) => ({ ...a, players: alertPlayerMap.get(a.player_id) }))
    .filter((a: any) => a.players?.academy_id === profile.academy_id)
    .slice(0, 20);

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

  // Risk distribution — no FK join
  const { data: loadData } = await supabase
    .from("load_records")
    .select("risk_flag, player_id, date")
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

  // Fetch CV pipeline averages from latest session with data
  let avgCvDistance: number | null = null;
  let avgCvSpeed: number | null = null;
  let avgCvSprints: number | null = null;

  if (sessionsWithMetrics) {
    const { data: cvData } = await supabase
      .from("cv_metrics")
      .select("total_distance_m, max_speed_kmh, sprint_count")
      .eq("session_id", sessionsWithMetrics.id);

    if (cvData && cvData.length > 0) {
      avgCvDistance = Math.round(cvData.reduce((s: number, m: any) => s + m.total_distance_m, 0) / cvData.length);
      avgCvSpeed = cvData.reduce((s: number, m: any) => s + m.max_speed_kmh, 0) / cvData.length;
      avgCvSprints = Math.round(cvData.reduce((s: number, m: any) => s + m.sprint_count, 0) / cvData.length);
    }
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

  // ── Load Heatmap: last 30 days ──────────────────────────────────────
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

  const { data: heatmapSessions } = await supabase
    .from("sessions")
    .select("id, date, type")
    .eq("academy_id", profile.academy_id)
    .gte("date", thirtyDaysAgo.toISOString().split("T")[0])
    .order("date", { ascending: true });

  let heatmapMetrics: { session_id: string; trimp_score: number }[] = [];
  if (heatmapSessions && heatmapSessions.length > 0) {
    const ids = heatmapSessions.map((s) => s.id);
    const { data: hm } = await supabase
      .from("wearable_metrics")
      .select("session_id, trimp_score")
      .in("session_id", ids);
    heatmapMetrics = hm ?? [];
  }

  // Build day-by-day data
  const heatmapDays: {
    date: string;
    label: string;
    avgTrimp: number | null;
    sessionType: string | null;
    isRestDay: boolean;
  }[] = [];

  const heatmapSessionMap = new Map<string, { type: string }>();
  for (const s of heatmapSessions ?? []) {
    heatmapSessionMap.set(s.date, { type: s.type });
  }

  const heatmapMetricsMap = new Map<string, number[]>();
  for (const m of heatmapMetrics) {
    // Find which date this session is
    const sessionDate = heatmapSessions?.find((s) => s.id === m.session_id)?.date;
    if (!sessionDate) continue;
    const arr = heatmapMetricsMap.get(sessionDate) ?? [];
    arr.push(m.trimp_score);
    heatmapMetricsMap.set(sessionDate, arr);
  }

  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateKey = d.toISOString().split("T")[0];
    const label = d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    const sessInfo = heatmapSessionMap.get(dateKey);
    const trimpArr = heatmapMetricsMap.get(dateKey);
    const avgTrimp =
      trimpArr && trimpArr.length > 0
        ? Math.round(trimpArr.reduce((s, v) => s + v, 0) / trimpArr.length)
        : null;

    heatmapDays.push({
      date: dateKey,
      label,
      avgTrimp,
      sessionType: sessInfo?.type ?? null,
      isRestDay: !sessInfo && avgTrimp === null,
    });
  }

  // Simple AI insight for heatmap (heuristic, no API call to keep SSR fast)
  const recentHighDays = heatmapDays.slice(-7).filter((d) => d.avgTrimp !== null && d.avgTrimp > 150).length;
  const recentSessions = heatmapDays.slice(-7).filter((d) => d.avgTrimp !== null).length;
  let heatmapInsight: string | null = null;
  if (recentHighDays >= 3) {
    heatmapInsight = `**High load alert:** ${recentHighDays} high-intensity sessions in the last 7 days. Consider a recovery or low-intensity session to prevent overtraining.`;
  } else if (recentSessions === 0) {
    heatmapInsight = `No sessions recorded in the last 7 days. Schedule training to maintain fitness.`;
  } else if (recentSessions <= 2) {
    heatmapInsight = `Low training frequency this week (${recentSessions} session${recentSessions === 1 ? "" : "s"}). Consider increasing volume if players are well-recovered.`;
  } else {
    heatmapInsight = `Training load is well-distributed over the last 7 days (${recentSessions} sessions). Good periodization.`;
  }

  // Today's session for Daily Briefing
  const todayStr = new Date().toISOString().split("T")[0];
  const { data: todaySessions } = await supabase
    .from("sessions")
    .select("*")
    .eq("academy_id", profile.academy_id)
    .eq("date", todayStr)
    .limit(1);

  const todaySession = todaySessions?.[0] ?? null;

  // Build players at risk list for Daily Briefing
  const seenRiskPlayers = new Set<string>();
  const briefingPlayersAtRisk: Array<{
    jerseyNumber: number;
    name: string;
    acwr: number;
    riskFlag: string;
  }> = [];

  for (const a of alerts) {
    const alert = a as any;
    if (!seenRiskPlayers.has(alert.player_id)) {
      seenRiskPlayers.add(alert.player_id);
      briefingPlayersAtRisk.push({
        jerseyNumber: alert.players.jersey_number,
        name: alert.players.name,
        acwr: alert.acwr_ratio ?? 0,
        riskFlag: alert.risk_flag,
      });
    }
  }

  // Team readiness — smarter heuristic
  const teamReadiness = Math.max(
    30,
    100 - briefingPlayersAtRisk.filter(p => p.riskFlag === "red").length * 15
        - briefingPlayersAtRisk.filter(p => p.riskFlag === "amber").length * 8
  );

  // Additional briefing stats
  const totalSessionsMonth = sessions.length;
  const matchesThisMonth = sessions.filter((s: any) => s.type === "match" || s.type === "friendly").length;
  const nextMatch = sessions.find((s: any) => (s.type === "match" || s.type === "friendly") && s.date >= todayStr);

  // Weekly load trend
  const last7 = heatmapDays.slice(-7).filter(d => d.avgTrimp != null);
  const prev7 = heatmapDays.slice(-14, -7).filter(d => d.avgTrimp != null);
  const weekAvgTrimp = last7.length > 0 ? Math.round(last7.reduce((s, d) => s + (d.avgTrimp ?? 0), 0) / last7.length) : null;
  const prevWeekAvgTrimp = prev7.length > 0 ? Math.round(prev7.reduce((s, d) => s + (d.avgTrimp ?? 0), 0) / prev7.length) : null;
  const loadTrend = weekAvgTrimp && prevWeekAvgTrimp
    ? Math.round(((weekAvgTrimp - prevWeekAvgTrimp) / prevWeekAvgTrimp) * 100)
    : null;

  // Upcoming sessions (next 3 days)
  const upcoming: { date: string; type: string; notes: string | null }[] = [];
  for (let i = 1; i <= 3; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    const sess = sessions.find((s: any) => s.date === dateStr);
    if (sess) {
      upcoming.push({ date: dateStr, type: (sess as any).type, notes: (sess as any).notes });
    }
  }

  // Top performer from latest session
  const latestMetricsForBriefing = sessionsWithMetrics?.wearable_metrics ?? [];
  const topPerformer = latestMetricsForBriefing.length > 0
    ? [...latestMetricsForBriefing].sort((a: any, b: any) => b.trimp_score - a.trimp_score)[0] as any
    : null;

  // Chart data: daily candlestick (merge multiple sessions per day, fill all 14 days)
  // 1. Group all metrics by date
  const dailyMap = new Map<string, any[]>();
  for (const s of trendData) {
    const dateKey = s.date; // YYYY-MM-DD
    const existing = dailyMap.get(dateKey) ?? [];
    existing.push(...(s.wearable_metrics ?? []));
    dailyMap.set(dateKey, existing);
  }

  // 2. Generate all 14 days
  const chartData = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateKey = d.toISOString().split("T")[0];
    const label = d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    const wm = dailyMap.get(dateKey) ?? [];

    if (wm.length === 0) {
      chartData.push({ date: label, avgHr: 0, hrLow: 0, hrHigh: 0, avgTrimp: 0, trimpLow: 0, trimpHigh: 0, players: 0 });
    } else {
      chartData.push({
        date: label,
        avgHr: Math.round(wm.reduce((s: number, m: any) => s + m.hr_avg, 0) / wm.length),
        hrLow: Math.round(Math.min(...wm.map((m: any) => m.hr_avg))),
        hrHigh: Math.round(Math.max(...wm.map((m: any) => m.hr_max))),
        avgTrimp: Math.round(wm.reduce((s: number, m: any) => s + m.trimp_score, 0) / wm.length),
        trimpLow: Math.round(Math.min(...wm.map((m: any) => m.trimp_score))),
        trimpHigh: Math.round(Math.max(...wm.map((m: any) => m.trimp_score))),
        players: wm.length,
      });
    }
  }

  // Check if this is a brand new academy with no data
  const hasNoData = sessions.length === 0 && (totalPlayers ?? 0) === 0;

  if (hasNoData) {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-bold">Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Welcome, {profile.name}.
          </p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl">
          <EmptyState
            icon={Sparkles}
            title="Welcome to Coach M8!"
            description="Get started by adding players and logging your first session. Your AI-powered coaching dashboard will come alive with data."
            action={{ label: "Add Players", href: "/players" }}
            accentColor="#a855f7"
          />
        </div>
      </div>
    );
  }

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

      {/* AI Daily Briefing — HERO position, first thing coach sees */}
      <DailyBriefing
        todaySession={todaySession}
        playersAtRisk={briefingPlayersAtRisk}
        teamReadiness={teamReadiness}
        totalPlayers={totalPlayers ?? 0}
        totalSessions={totalSessionsMonth}
        matchesThisMonth={matchesThisMonth}
        nextMatch={nextMatch ? { date: (nextMatch as any).date, notes: (nextMatch as any).notes } : null}
        weekAvgTrimp={weekAvgTrimp}
        loadTrend={loadTrend}
        upcoming={upcoming}
        topPerformer={topPerformer ? { name: topPerformer.players?.name ?? "Unknown", jersey: topPerformer.players?.jersey_number ?? 0, trimp: Math.round(topPerformer.trimp_score) } : null}
      />

      {/* Stat Cards */}
      <StatCards
        totalPlayers={totalPlayers ?? 0}
        activeSessions={activeSessions}
        avgTeamHR={avgTeamHR}
        playersAtRisk={playersAtRisk}
        avgTrimp={avgTrimp}
        avgDistance={avgCvDistance}
        avgSpeed={avgCvSpeed}
        avgSprints={avgCvSprints}
      />

      {/* Row 2: Charts - Session Intensity + Risk Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-card shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold">Session Intensity</h3>
              <p className="text-xs text-muted-foreground mt-0.5">HR range per session (candlestick) + TRIMP trend</p>
            </div>
            <div className="flex gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded bg-green-500 inline-block" />
                Low
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded bg-blue-500 inline-block" />
                Moderate
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded bg-orange-500 inline-block" />
                High
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded bg-red-500 inline-block" />
                Extreme
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-6 border-t-2 border-dashed border-orange-500 inline-block" />
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

      {/* Row 2.5: Load Heatmap */}
      <LoadHeatmap days={heatmapDays} aiInsight={heatmapInsight} />

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
