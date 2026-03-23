import { CalendarDays } from "lucide-react";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { WeeklyReport } from "@/components/reports/weekly-report";
import { redirect } from "next/navigation";

export default async function WeeklyReportPage() {
  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) redirect("/login");

  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from("users")
    .select("academy_id")
    .eq("auth_user_id", user.id)
    .single();

  if (!profile) redirect("/login");

  const academyId = profile.academy_id;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const weekStart = sevenDaysAgo.toISOString().split("T")[0];
  const today = new Date().toISOString().split("T")[0];

  // Fetch sessions last 7 days
  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, date, type, duration_minutes, location, age_group")
    .eq("academy_id", academyId)
    .gte("date", weekStart)
    .lte("date", today)
    .order("date", { ascending: true });

  const sessionIds = (sessions ?? []).map((s) => s.id);

  // Fetch wearable metrics for these sessions
  const { data: metrics } = sessionIds.length
    ? await supabase
        .from("wearable_metrics")
        .select("session_id, player_id, hr_avg, trimp_score")
        .in("session_id", sessionIds)
    : { data: [] };

  // Fetch latest load records per player this week
  const { data: allPlayers } = await supabase
    .from("players")
    .select("id")
    .eq("academy_id", academyId)
    .eq("status", "active");

  const playerIds = (allPlayers ?? []).map((p) => p.id);

  const { data: loadRecords } = playerIds.length
    ? await supabase
        .from("load_records")
        .select("player_id, acwr_ratio, risk_flag")
        .in("player_id", playerIds)
        .gte("date", weekStart)
        .order("date", { ascending: false })
    : { data: [] };

  // Get latest risk per player
  const latestRisk: Record<string, string> = {};
  for (const lr of loadRecords ?? []) {
    if (!latestRisk[lr.player_id]) {
      latestRisk[lr.player_id] = lr.risk_flag;
    }
  }
  const playersAtRisk = Object.values(latestRisk).filter(
    (f) => f === "red" || f === "amber"
  ).length;

  // Group metrics by session
  const metricsBySession: Record<string, { hr: number[]; trimp: number[]; players: Set<string> }> = {};
  for (const m of metrics ?? []) {
    if (!metricsBySession[m.session_id]) {
      metricsBySession[m.session_id] = { hr: [], trimp: [], players: new Set() };
    }
    metricsBySession[m.session_id].hr.push(m.hr_avg);
    metricsBySession[m.session_id].trimp.push(m.trimp_score);
    metricsBySession[m.session_id].players.add(m.player_id);
  }

  const daySessions = (sessions ?? []).map((s) => {
    const sm = metricsBySession[s.id];
    const avgHr = sm?.hr.length
      ? Math.round(sm.hr.reduce((a, b) => a + b, 0) / sm.hr.length)
      : 0;
    const avgTrimp = sm?.trimp.length
      ? Math.round(sm.trimp.reduce((a, b) => a + b, 0) / sm.trimp.length)
      : 0;
    return {
      date: s.date,
      type: s.type,
      durationMinutes: s.duration_minutes,
      playerCount: sm?.players.size ?? 0,
      avgHr,
      avgTrimp,
      location: s.location,
    };
  });

  const totalTrimp = daySessions.reduce((s, d) => s + d.avgTrimp, 0);
  const avgLoad =
    daySessions.filter((d) => d.avgTrimp > 0).length > 0
      ? Math.round(totalTrimp / daySessions.filter((d) => d.avgTrimp > 0).length)
      : 0;

  const allPlayerIds = new Set(
    (metrics ?? []).map((m) => m.player_id)
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <CalendarDays className="h-6 w-6 text-[#00ff88]" />
          Weekly Training Summary
        </h2>
        <p className="text-sm text-white/50 mt-1">
          Last 7 days of sessions with load distribution and AI recommendations
        </p>
      </div>
      <WeeklyReport
        daySessions={daySessions}
        weekStats={{
          totalSessions: daySessions.length,
          avgLoad,
          playersTracked: allPlayerIds.size,
          playersAtRisk,
        }}
        academyId={academyId}
      />
    </div>
  );
}
