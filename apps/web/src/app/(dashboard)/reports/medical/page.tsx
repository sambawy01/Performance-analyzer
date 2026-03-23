import { HeartPulse } from "lucide-react";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { MedicalReport } from "@/components/reports/medical-report";
import { redirect } from "next/navigation";

export default async function MedicalReportPage() {
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

  // Fetch all active players separately
  const { data: players } = await supabase
    .from("players")
    .select("id, name, position, jersey_number, age_group")
    .eq("academy_id", academyId)
    .eq("status", "active")
    .order("jersey_number");

  const playerIds = (players ?? []).map((p) => p.id);

  // Fetch latest load record per player (no FK joins)
  const { data: loadRecords } = playerIds.length
    ? await supabase
        .from("load_records")
        .select("player_id, date, acwr_ratio, risk_flag, daily_load, acute_load_7d, chronic_load_28d")
        .in("player_id", playerIds)
        .order("date", { ascending: false })
    : { data: [] };

  type LoadRecord = { player_id: string; date: string; acwr_ratio: number; risk_flag: string; daily_load: number; acute_load_7d: number; chronic_load_28d: number };
  // Get latest load per player
  const latestLoad: Record<string, LoadRecord> = {};
  for (const lr of loadRecords ?? []) {
    if (!latestLoad[lr.player_id]) {
      latestLoad[lr.player_id] = lr;
    }
  }

  // Fetch recent wearable metrics (last 28 days) for HR data
  const twentyEightDaysAgo = new Date();
  twentyEightDaysAgo.setDate(twentyEightDaysAgo.getDate() - 28);
  const cutoff = twentyEightDaysAgo.toISOString().split("T")[0];

  // Fetch sessions in last 28 days
  const { data: recentSessions } = await supabase
    .from("sessions")
    .select("id, date")
    .eq("academy_id", academyId)
    .gte("date", cutoff)
    .order("date", { ascending: false });

  const recentSessionIds = (recentSessions ?? []).map((s) => s.id);

  const { data: metrics } = playerIds.length && recentSessionIds.length
    ? await supabase
        .from("wearable_metrics")
        .select("player_id, session_id, hr_avg, hr_recovery_60s, trimp_score, created_at")
        .in("player_id", playerIds)
        .in("session_id", recentSessionIds)
        .order("created_at", { ascending: false })
    : { data: [] };

  // Compute per-player HR avg and recovery
  const hrByPlayer: Record<string, { hr: number[]; recovery: (number | null)[]; sessions: string[] }> = {};
  for (const m of metrics ?? []) {
    if (!hrByPlayer[m.player_id]) hrByPlayer[m.player_id] = { hr: [], recovery: [], sessions: [] };
    hrByPlayer[m.player_id].hr.push(m.hr_avg);
    hrByPlayer[m.player_id].recovery.push(m.hr_recovery_60s);
    hrByPlayer[m.player_id].sessions.push(m.session_id);
  }

  // All session ids attended by player this period
  const playerAttended = new Set(
    Object.entries(hrByPlayer).flatMap(([pid, v]) => v.sessions.map(() => pid))
  );

  // Build playerRisk list
  const RISK_ORDER: Record<string, number> = { red: 0, amber: 1, green: 2, blue: 3 };

  const playerRiskList = (players ?? [])
    .map((p) => {
      const load = latestLoad[p.id];
      const hrData = hrByPlayer[p.id];
      const avgHr = hrData?.hr.length
        ? Math.round(hrData.hr.reduce((a, b) => a + b, 0) / hrData.hr.length)
        : 0;
      const validRecoveries = (hrData?.recovery ?? []).filter(
        (r): r is number => r !== null
      );
      const avgRecovery = validRecoveries.length
        ? Math.round(validRecoveries.reduce((a, b) => a + b, 0) / validRecoveries.length)
        : null;

      // Load trend: compare first half vs second half of recent load records
      const playerLoadRecs = (loadRecords ?? []).filter((lr) => lr.player_id === p.id);
      let loadTrend: "up" | "down" | "stable" = "stable";
      if (playerLoadRecs.length >= 4) {
        const half = Math.floor(playerLoadRecs.length / 2);
        const recentAvg =
          playerLoadRecs.slice(0, half).reduce((s, lr) => s + lr.daily_load, 0) / half;
        const olderAvg =
          playerLoadRecs.slice(half).reduce((s, lr) => s + lr.daily_load, 0) / half;
        if (recentAvg > olderAvg * 1.1) loadTrend = "up";
        else if (recentAvg < olderAvg * 0.9) loadTrend = "down";
      }

      // Sessions missed = total recent sessions - sessions attended by player
      const playerSessionCount = hrData?.sessions.length ?? 0;
      const totalRecentSessions = recentSessions?.length ?? 0;
      const sessionsMissed = Math.max(0, totalRecentSessions - playerSessionCount);

      return {
        id: p.id,
        name: p.name,
        jerseyNumber: p.jersey_number,
        position: p.position,
        acwr: load?.acwr_ratio ?? null,
        riskFlag: load?.risk_flag ?? "green",
        avgHr,
        hrRecovery: avgRecovery,
        sessionsMissed,
        loadTrend,
      };
    })
    .sort(
      (a, b) =>
        (RISK_ORDER[a.riskFlag] ?? 99) - (RISK_ORDER[b.riskFlag] ?? 99)
    );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <HeartPulse className="h-6 w-6 text-[#ff3355]" />
          Medical / Injury Report
        </h2>
        <p className="text-sm text-white/50 mt-1">
          All players ranked by injury risk — ACWR flags, recovery trends, and AI load modification plan
        </p>
      </div>
      <MedicalReport players={playerRiskList} />
    </div>
  );
}
