import type { Metadata } from "next";
export const metadata: Metadata = { title: "Injury Prevention -- Coach M8" };

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { PreventionDashboard } from "@/components/injury-prevention/prevention-dashboard";
import type {
  PlayerRiskData,
  WeeklyLoadDay,
} from "@/components/injury-prevention/prevention-dashboard";
import { Shield } from "lucide-react";
import {
  computeMonotony,
  computeCumulativeLoad,
  computeEWMA_ACWR,
  computeAsymmetryScore,
  computeRecoveryScore,
  computeMultiFactorRisk,
} from "@/lib/injury/risk-engine";
import type { CvSessionData } from "@/lib/injury/risk-engine";

/* ────────────────────────────────────────────
   Server-side data fetching + risk computation
   Uses the pure functions from risk-engine.ts
   ──────────────────────────────────────────── */

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

  // ── Date boundaries ──
  const today = new Date();
  const twentyEightDaysAgo = new Date();
  twentyEightDaysAgo.setDate(today.getDate() - 28);
  const eightWeeksAgo = new Date();
  eightWeeksAgo.setDate(today.getDate() - 56);
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(today.getDate() - 14);

  // ── Fetch load records (last 8 weeks) ──
  const { data: loadRecordsRaw } = await supabase
    .from("load_records")
    .select("player_id, acwr_ratio, risk_flag, date")
    .in("player_id", playerIds)
    .gte("date", eightWeeksAgo.toISOString().split("T")[0])
    .order("date", { ascending: false });

  const loadRecords = loadRecordsRaw ?? [];
  const playerLoadMap = new Map<string, typeof loadRecords>();
  for (const lr of loadRecords) {
    const arr = playerLoadMap.get(lr.player_id) ?? [];
    arr.push(lr);
    playerLoadMap.set(lr.player_id, arr);
  }

  // ── Fetch wearable metrics (last 28 days, all players) ──
  const { data: wearableRaw } = await supabase
    .from("wearable_metrics")
    .select(
      "player_id, trimp_score, hr_recovery_60s, hr_zone_4_pct, hr_zone_5_pct, session_id, created_at"
    )
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

  // ── Fetch CV metrics (last 14 days) for asymmetry computation ──
  const { data: cvMetricsRaw } = await supabase
    .from("cv_metrics")
    .select(
      "player_id, session_id, sprint_count, accel_events, decel_events, avg_position_x, avg_position_y"
    )
    .in("player_id", playerIds)
    .order("created_at", { ascending: false })
    .limit(playerIds.length * 14);

  const cvMetrics = cvMetricsRaw ?? [];
  const playerCvMap = new Map<string, typeof cvMetrics>();
  for (const cv of cvMetrics) {
    const arr = playerCvMap.get(cv.player_id) ?? [];
    arr.push(cv);
    playerCvMap.set(cv.player_id, arr);
  }

  // ── Fetch wellness check-ins (graceful — table may not exist yet) ──
  let wellnessMap = new Map<string, Array<{ soreness: number | null; energy: number | null; sleep_quality: number | null; sleep_hours: number | null; hrv_rmssd: number | null; resting_hr: number | null; date: string }>>();
  try {
    const { data: wellnessRaw, error } = await supabase
      .from("wellness_checkins")
      .select("player_id, date, soreness, energy, sleep_quality, sleep_hours, hrv_rmssd, resting_hr")
      .in("player_id", playerIds)
      .order("date", { ascending: false })
      .limit(playerIds.length * 7);

    if (!error && wellnessRaw) {
      for (const w of wellnessRaw) {
        const arr = wellnessMap.get(w.player_id) ?? [];
        arr.push(w);
        wellnessMap.set(w.player_id, arr);
      }
    }
  } catch {
    // Table doesn't exist yet — that's fine
  }

  // ── Fetch sessions (for daily load aggregation + weekly chart) ──
  const { data: sessionsRaw } = await supabase
    .from("sessions")
    .select("id, date, type")
    .eq("academy_id", profile.academy_id)
    .gte("date", eightWeeksAgo.toISOString().split("T")[0])
    .order("date", { ascending: false });

  const sessions = sessionsRaw ?? [];
  const sessionDateMap = new Map<string, string>();
  const sessionTypeMap = new Map<string, string>();
  for (const s of sessions) {
    sessionDateMap.set(s.id, s.date);
    sessionTypeMap.set(s.id, s.type);
  }

  // ── Build per-session TRIMP averages for weekly load chart ──
  const sessionTrimpMap = new Map<string, number[]>();
  for (const wm of wearable) {
    const arr = sessionTrimpMap.get(wm.session_id) ?? [];
    arr.push(wm.trimp_score);
    sessionTrimpMap.set(wm.session_id, arr);
  }

  const dateTrimps = new Map<string, number[]>();
  for (const [sessId, trimps] of sessionTrimpMap) {
    const date = sessionDateMap.get(sessId);
    if (!date) continue;
    const arr = dateTrimps.get(date) ?? [];
    arr.push(...trimps);
    dateTrimps.set(date, arr);
  }

  // ── Build daily load for the current week (Mon-Sun) ──
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weeklyLoad: WeeklyLoadDay[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    const trimps = dateTrimps.get(dateStr);
    const avgTrimp =
      trimps && trimps.length > 0
        ? Math.round(trimps.reduce((s, v) => s + v, 0) / trimps.length)
        : 0;
    const sessForDay = sessions.find((s) => s.date === dateStr);
    weeklyLoad.push({
      day: dayNames[i],
      date: dateStr,
      load: avgTrimp,
      type: sessForDay?.type ?? null,
    });
  }

  // ── Helper: build daily TRIMP array for a player (last N days) ──
  function buildDailyLoads(playerId: string, days: number): number[] {
    const playerWearables = playerWearableMap.get(playerId) ?? [];
    const dailyLoads: number[] = [];

    for (let i = 0; i < days; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];

      // Find all wearable entries for this player on this date
      const dayTrimp = playerWearables
        .filter((w) => {
          const sessDate = sessionDateMap.get(w.session_id);
          return sessDate === dateStr;
        })
        .reduce((s, w) => s + w.trimp_score, 0);

      dailyLoads.push(dayTrimp);
    }

    return dailyLoads;
  }

  // ── Compute risk data for each player ──
  const playerRiskData: PlayerRiskData[] = playerList.map((p) => {
    const loads = playerLoadMap.get(p.id) ?? [];
    const wearables = playerWearableMap.get(p.id) ?? [];
    const cvData = playerCvMap.get(p.id) ?? [];
    const wellnessData = wellnessMap.get(p.id) ?? [];

    // ── Build daily loads for various windows ──
    const dailyLoads28d = buildDailyLoads(p.id, 28);
    const dailyLoads14d = dailyLoads28d.slice(0, 14);
    const dailyLoads7d = dailyLoads28d.slice(0, 7);

    // ── Monotony (7-day) ──
    const monotonyResult = computeMonotony(dailyLoads7d);

    // ── Cumulative 14-day load ──
    const cumulativeResult = computeCumulativeLoad(dailyLoads14d, p.age_group);

    // ── EWMA ACWR ──
    const ewmaResult = computeEWMA_ACWR(dailyLoads28d);

    // ── Asymmetry (from CV data) ──
    const cvSessionData: CvSessionData[] = cvData
      .filter(
        (c: Record<string, unknown>) =>
          c.avg_position_x != null && c.avg_position_y != null
      )
      .map((c) => ({
        avg_position_x: (c as Record<string, number>).avg_position_x ?? 50,
        avg_position_y: (c as Record<string, number>).avg_position_y ?? 50,
        sprint_count: c.sprint_count ?? 0,
        accel_events: c.accel_events ?? 0,
        decel_events: c.decel_events ?? 0,
      }));
    const asymmetryResult = computeAsymmetryScore(cvSessionData);

    // ── Recovery/Wellness Score ──
    const latestWellness = wellnessData[0] ?? null;
    const recoveryResult = latestWellness
      ? computeRecoveryScore({
          hrv_rmssd: latestWellness.hrv_rmssd ?? undefined,
          hrv_baseline: undefined, // Would need 30-day avg — compute if enough data
          resting_hr: latestWellness.resting_hr ?? undefined,
          resting_hr_baseline: undefined,
          sleep_hours: latestWellness.sleep_hours ?? undefined,
          soreness: latestWellness.soreness ?? undefined,
          energy: latestWellness.energy ?? undefined,
          sleep_quality: latestWellness.sleep_quality ?? undefined,
        })
      : null;

    // ── ACWR history (last 4 weeks, one entry per week) ──
    const acwrValues = loads
      .map((l) => l.acwr_ratio)
      .filter((v): v is number => v != null);
    const acwrHistory: { week: string; acwr: number }[] = [];
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
    const sortedWeeks = [...weekMap.entries()].sort((a, b) =>
      a[0].localeCompare(b[0])
    );
    for (const [weekKey, vals] of sortedWeeks.slice(-4)) {
      const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
      const label = new Date(weekKey).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      });
      acwrHistory.push({ week: label, acwr: Number(avg.toFixed(2)) });
    }

    const currentAcwr = acwrValues[0] ?? ewmaResult.acwr;

    // ── HR Recovery ──
    const recoveryVals = wearables
      .filter((w) => w.hr_recovery_60s != null)
      .map((w) => w.hr_recovery_60s as number)
      .slice(0, 10);
    const currentHrRecovery = recoveryVals[0] ?? null;

    // HR Recovery trend
    let hrRecoveryTrend: "improving" | "stable" | "declining" | null = null;
    if (recoveryVals.length >= 4) {
      const recent = recoveryVals.slice(0, 3).reduce((s, v) => s + v, 0) / 3;
      const older =
        recoveryVals.slice(-3).reduce((s, v) => s + v, 0) /
        Math.min(3, recoveryVals.slice(-3).length);
      const diff = recent - older;
      if (diff > 3) hrRecoveryTrend = "improving";
      else if (diff < -3) hrRecoveryTrend = "declining";
      else hrRecoveryTrend = "stable";
    }

    // ── Weekly TRIMP ──
    const trimpVals = wearables.map((w) => w.trimp_score).slice(0, 15);
    const weeklyTrimp = trimpVals.slice(0, 7).reduce((s, v) => s + v, 0);

    // ── High intensity % ──
    const highIntPcts = wearables
      .slice(0, 5)
      .map((w) => (w.hr_zone_4_pct ?? 0) + (w.hr_zone_5_pct ?? 0));
    const highIntensityPct =
      highIntPcts.length > 0
        ? highIntPcts.reduce((s, v) => s + v, 0) / highIntPcts.length
        : 0;

    // ── Days since last rest ──
    let daysSinceRest = 0;
    if (wearables.length > 0) {
      const sessionDates = new Set(
        wearables
          .map((w) => sessionDateMap.get(w.session_id))
          .filter(Boolean)
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

    // ── ACWR trend ──
    let acwrTrend: "rising" | "stable" | "falling" = "stable";
    if (acwrValues.length >= 3) {
      const diff = acwrValues[0] - acwrValues[2];
      if (diff > 0.15) acwrTrend = "rising";
      else if (diff < -0.15) acwrTrend = "falling";
    }

    // ── Amber+ count in last 30d ──
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const amberPlusCount30d = loads.filter(
      (l) =>
        (l.risk_flag === "amber" || l.risk_flag === "red") &&
        new Date(l.date) >= thirtyDaysAgo
    ).length;

    // ── Multi-Factor Risk Model ──
    const multiFactorResult = computeMultiFactorRisk({
      acwr: currentAcwr ?? 1.0,
      acwr_trend: acwrTrend,
      hr_recovery: currentHrRecovery,
      hr_recovery_trend: hrRecoveryTrend,
      monotony: monotonyResult.monotony,
      strain: monotonyResult.strain,
      cumulative_14d: cumulativeResult.total,
      cumulative_threshold: cumulativeResult.threshold,
      asymmetry_score: asymmetryResult.score,
      recovery_score: recoveryResult?.score ?? null,
      high_intensity_ratio: highIntensityPct,
      days_since_rest: daysSinceRest,
      age_group: p.age_group,
    });

    // Map multi-factor risk level to severity
    const severity: "green" | "amber" | "red" =
      multiFactorResult.risk_level === "critical" || multiFactorResult.risk_level === "high"
        ? "red"
        : multiFactorResult.risk_level === "moderate"
        ? "amber"
        : "green";

    return {
      id: p.id,
      name: p.name,
      jerseyNumber: p.jersey_number,
      position: p.position,
      ageGroup: p.age_group,
      riskPct: multiFactorResult.risk_score,
      severity,
      acwrHistory,
      currentAcwr,
      hrRecoveryTrend: recoveryVals.slice(0, 5),
      currentHrRecovery,
      weeklyTrimp,
      highIntensityPct,
      daysSinceRest,
      amberPlusCount30d,
      riskForecast: multiFactorResult.predicted_risk_7d,
      // New enhanced fields
      monotony: monotonyResult.monotony,
      strain: monotonyResult.strain,
      monotonyRisk: monotonyResult.risk,
      cumulativeLoad14d: cumulativeResult.total,
      cumulativeThreshold: cumulativeResult.threshold,
      cumulativeRisk: cumulativeResult.risk,
      ewmaAcwr: ewmaResult.acwr,
      ewmaAcute: ewmaResult.acute,
      ewmaChronic: ewmaResult.chronic,
      asymmetryScore: asymmetryResult.score,
      asymmetryDirection: asymmetryResult.direction,
      asymmetryRisk: asymmetryResult.risk,
      recoveryScore: recoveryResult?.score ?? null,
      recoveryFactors: recoveryResult?.factors ?? [],
      recoveryRisk: recoveryResult?.risk ?? "low",
      multiFactorRiskLevel: multiFactorResult.risk_level,
      multiFactorRiskColor: multiFactorResult.risk_color,
      contributingFactors: multiFactorResult.contributing_factors,
      overallRecommendation: multiFactorResult.overall_recommendation,
      hasWellnessData: wellnessData.length > 0,
      acwrTrend,
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
          Multi-factor risk modeling, training monotony, load periodization, and
          AI-generated prevention protocols
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
