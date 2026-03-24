import { createClient, createAdminClient } from "@/lib/supabase/server";
import { PreventionDashboard } from "@/components/injury-prevention/prevention-dashboard";
import type { PlayerRiskData, WeeklyLoadDay } from "@/components/injury-prevention/prevention-dashboard";
import { Shield } from "lucide-react";

/* ────────────────────────────────────────────
   Server-side risk computation
   (mirrors the logic from /api/ai/injury-risk but for all players)
   ──────────────────────────────────────────── */

function computeRisk(
  acwrHistory: number[],
  recoveryVals: number[],
  trimpVals: number[],
  highIntPcts: number[]
): { riskPct: number; severity: "green" | "amber" | "red" } {
  let total = 0;

  // ACWR factor (max 30)
  const latestAcwr = acwrHistory[0] ?? 1.0;
  if (latestAcwr > 1.5) total += 30;
  else if (latestAcwr > 1.3) total += 20;
  else if (latestAcwr >= 0.8) total += 5;
  else if (latestAcwr >= 0.5) total += 15;
  else total += 10;

  // HR Recovery decline (max 25)
  if (recoveryVals.length >= 4) {
    const recent = recoveryVals.slice(0, 3).reduce((s, v) => s + v, 0) / 3;
    const older = recoveryVals.slice(-3).reduce((s, v) => s + v, 0) / Math.min(3, recoveryVals.slice(-3).length);
    const decline = older - recent;
    if (decline > 8) total += 25;
    else if (decline > 4) total += 15;
    else if (decline > 0) total += 5;
  }

  // Cumulative load (max 25)
  const weekTrimp = trimpVals.slice(0, 7).reduce((s, v) => s + v, 0);
  if (weekTrimp > 900) total += 25;
  else if (weekTrimp > 650) total += 15;
  else total += 5;

  // High intensity (max 20)
  if (highIntPcts.length >= 2) {
    const avg = highIntPcts.reduce((s, v) => s + v, 0) / highIntPcts.length;
    if (avg > 35) total += 20;
    else if (avg > 25) total += 12;
    else total += 3;
  }

  const riskPct = Math.min(100, Math.max(0, total));
  const severity: "green" | "amber" | "red" =
    riskPct > 60 ? "red" : riskPct > 35 ? "amber" : "green";
  return { riskPct, severity };
}

export default async function InjuryPreventionPage() {
  const authClient = await createClient();
  const supabase = createAdminClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("auth_user_id", user!.id)
    .single();

  if (!profile) return null;

  // Fetch all active players
  const { data: playersRaw } = await supabase
    .from("players")
    .select("id, name, jersey_number, position, age_group, status")
    .eq("academy_id", profile.academy_id)
    .eq("status", "active")
    .order("jersey_number", { ascending: true });

  const playerList = playersRaw ?? [];
  const playerIds = playerList.map((p) => p.id);

  if (playerIds.length === 0) {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-[#ff3355]" />
            Injury Prevention
          </h2>
          <p className="text-sm text-white/50 mt-1">No active players found.</p>
        </div>
      </div>
    );
  }

  // Fetch load records (last 8 weeks)
  const eightWeeksAgo = new Date();
  eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

  const { data: loadRecordsRaw } = await supabase
    .from("load_records")
    .select("player_id, acwr_ratio, risk_flag, date")
    .in("player_id", playerIds)
    .gte("date", eightWeeksAgo.toISOString().split("T")[0])
    .order("date", { ascending: false });

  const loadRecords = loadRecordsRaw ?? [];

  // Build per-player load maps
  const playerLoadMap = new Map<string, typeof loadRecords>();
  for (const lr of loadRecords) {
    const arr = playerLoadMap.get(lr.player_id) ?? [];
    arr.push(lr);
    playerLoadMap.set(lr.player_id, arr);
  }

  // Fetch wearable metrics (last 30 sessions per player — ordered desc)
  const { data: wearableRaw } = await supabase
    .from("wearable_metrics")
    .select("player_id, trimp_score, hr_recovery_60s, hr_zone_4_pct, hr_zone_5_pct, session_id, created_at")
    .in("player_id", playerIds)
    .order("created_at", { ascending: false })
    .limit(playerIds.length * 30);

  const wearable = wearableRaw ?? [];
  const playerWearableMap = new Map<string, typeof wearable>();
  for (const wm of wearable) {
    const arr = playerWearableMap.get(wm.player_id) ?? [];
    arr.push(wm);
    playerWearableMap.set(wm.player_id, arr);
  }

  // Fetch sessions for the last 8 weeks (to compute daily load for the weekly chart)
  const { data: sessionsRaw } = await supabase
    .from("sessions")
    .select("id, date, type")
    .eq("academy_id", profile.academy_id)
    .gte("date", eightWeeksAgo.toISOString().split("T")[0])
    .order("date", { ascending: false });

  const sessions = sessionsRaw ?? [];

  // Build per-session TRIMP averages for weekly load chart
  const sessionTrimpMap = new Map<string, number[]>();
  for (const wm of wearable) {
    const arr = sessionTrimpMap.get(wm.session_id) ?? [];
    arr.push(wm.trimp_score);
    sessionTrimpMap.set(wm.session_id, arr);
  }

  const sessionDateMap = new Map<string, string>();
  const sessionTypeMap = new Map<string, string>();
  for (const s of sessions) {
    sessionDateMap.set(s.id, s.date);
    sessionTypeMap.set(s.id, s.type);
  }

  // Build daily load for the current week (Mon-Sun)
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon...
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weeklyLoad: WeeklyLoadDay[] = [];

  // Build date -> avg TRIMP map
  const dateTrimps = new Map<string, number[]>();
  for (const [sessId, trimps] of sessionTrimpMap) {
    const date = sessionDateMap.get(sessId);
    if (!date) continue;
    const arr = dateTrimps.get(date) ?? [];
    arr.push(...trimps);
    dateTrimps.set(date, arr);
  }

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    const trimps = dateTrimps.get(dateStr);
    const avgTrimp =
      trimps && trimps.length > 0
        ? Math.round(trimps.reduce((s, v) => s + v, 0) / trimps.length)
        : 0;

    // Find session type for this date
    const sessForDay = sessions.find((s) => s.date === dateStr);

    weeklyLoad.push({
      day: dayNames[i],
      date: dateStr,
      load: avgTrimp,
      type: sessForDay?.type ?? null,
    });
  }

  // Build PlayerRiskData for each player
  const playerRiskData: PlayerRiskData[] = playerList.map((p) => {
    const loads = playerLoadMap.get(p.id) ?? [];
    const wearables = playerWearableMap.get(p.id) ?? [];

    // ACWR history (last 4 weeks — one entry per week)
    const acwrValues = loads.map((l) => l.acwr_ratio).filter((v): v is number => v != null);
    const acwrHistory: { week: string; acwr: number }[] = [];
    // Group by week
    const weekMap = new Map<string, number[]>();
    for (const l of loads) {
      if (l.acwr_ratio == null) continue;
      const d = new Date(l.date);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay() + 1);
      const key = weekStart.toISOString().split("T")[0];
      const arr = weekMap.get(key) ?? [];
      arr.push(l.acwr_ratio);
      weekMap.set(key, arr);
    }
    const sortedWeeks = [...weekMap.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    for (const [weekKey, vals] of sortedWeeks.slice(-4)) {
      const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
      const label = new Date(weekKey).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
      acwrHistory.push({ week: label, acwr: Number(avg.toFixed(2)) });
    }

    const currentAcwr = acwrValues[0] ?? null;

    // HR Recovery values
    const recoveryVals = wearables
      .filter((w) => w.hr_recovery_60s != null)
      .map((w) => w.hr_recovery_60s as number)
      .slice(0, 10);
    const currentHrRecovery = recoveryVals[0] ?? null;

    // Weekly TRIMP (sum of last 7 sessions)
    const trimpVals = wearables.map((w) => w.trimp_score).slice(0, 15);
    const weeklyTrimp = trimpVals.slice(0, 7).reduce((s, v) => s + v, 0);

    // High intensity %
    const highIntPcts = wearables
      .slice(0, 5)
      .map((w) => (w.hr_zone_4_pct ?? 0) + (w.hr_zone_5_pct ?? 0));
    const highIntensityPct =
      highIntPcts.length > 0
        ? highIntPcts.reduce((s, v) => s + v, 0) / highIntPcts.length
        : 0;

    // Days since last rest — find the most recent day without a session
    // Use the player's wearable data timestamps
    let daysSinceRest = 0;
    if (wearables.length > 0) {
      const sessionDates = new Set(
        wearables.map((w) => {
          const sDate = sessionDateMap.get(w.session_id);
          return sDate;
        }).filter(Boolean)
      );
      const todayStr = today.toISOString().split("T")[0];
      for (let i = 0; i < 14; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const ds = d.toISOString().split("T")[0];
        if (!sessionDates.has(ds) && ds !== todayStr) break;
        daysSinceRest++;
      }
    }

    // Amber+ count in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const amberPlusCount30d = loads.filter(
      (l) =>
        (l.risk_flag === "amber" || l.risk_flag === "red") &&
        new Date(l.date) >= thirtyDaysAgo
    ).length;

    // Compute risk
    const { riskPct, severity } = computeRisk(
      acwrValues,
      recoveryVals,
      trimpVals,
      highIntPcts
    );

    // Generate baseline 7-day forecast (simple heuristic)
    const riskForecast: number[] = [];
    let projectedRisk = riskPct;
    for (let i = 0; i < 7; i++) {
      // Each day of continued training at current intensity adds ~3-5% risk
      if (i > 0) {
        const dailyIncrease = severity === "red" ? 5 : severity === "amber" ? 3 : 1;
        projectedRisk = Math.min(100, projectedRisk + dailyIncrease);
      }
      riskForecast.push(Math.round(projectedRisk));
    }

    return {
      id: p.id,
      name: p.name,
      jerseyNumber: p.jersey_number,
      position: p.position,
      ageGroup: p.age_group,
      riskPct,
      severity,
      acwrHistory,
      currentAcwr,
      hrRecoveryTrend: recoveryVals.slice(0, 5),
      currentHrRecovery,
      weeklyTrimp,
      highIntensityPct,
      daysSinceRest,
      amberPlusCount30d,
      riskForecast,
    };
  });

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6 text-[#ff3355]" />
          Injury Prevention
        </h2>
        <p className="text-sm text-white/50 mt-1">
          Proactive risk monitoring, load periodization, and AI-generated prevention protocols
        </p>
      </div>
      <PreventionDashboard
        players={playerRiskData}
        weeklyLoad={weeklyLoad}
        academyId={profile.academy_id}
      />
    </div>
  );
}
