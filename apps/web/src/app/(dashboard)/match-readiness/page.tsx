import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { ReadinessClient } from "@/components/match-readiness/readiness-client";

function computeReadinessScore(
  loadHistory: any[],
  wearableMetrics: any[],
  cvMetrics: any[],
  allSessions: Map<string, any>
): {
  score: number;
  status: "ready" | "caution" | "fatigued";
  factors: {
    loadTrend: number;
    recoveryQuality: number;
    daysSinceHighIntensity: number;
    acwrProximity: number;
    performanceTrend: number;
  };
  latestAcwr: number | null;
  latestRecovery: number | null;
} {
  let loadTrend = 12; // default mid-range
  let recoveryQuality = 12;
  let daysSinceHighIntensity = 10;
  let acwrProximity = 10;
  let performanceTrend = 5;

  const latestAcwr = loadHistory[0]?.acwr_ratio ?? null;
  const latestRecovery = wearableMetrics[0]?.hr_recovery_60s ?? null;

  // 1. Load Trend (0-25): Is load appropriately managed? Not spiking, not crashing.
  if (loadHistory.length >= 3) {
    const recent3 = loadHistory.slice(0, 3);
    const avgAcwr = recent3.reduce((s: number, l: any) => s + (l.acwr_ratio ?? 1), 0) / 3;
    // Perfect load trend = stable around 1.0-1.2
    if (avgAcwr >= 0.8 && avgAcwr <= 1.2) loadTrend = 23;
    else if (avgAcwr >= 0.7 && avgAcwr <= 1.3) loadTrend = 18;
    else if (avgAcwr >= 0.5 && avgAcwr <= 1.5) loadTrend = 12;
    else loadTrend = 5;

    // Check for spikes
    const loads = recent3.map((l: any) => l.daily_load ?? 0);
    const maxL = Math.max(...loads);
    const avgL = loads.reduce((s: number, v: number) => s + v, 0) / loads.length;
    if (maxL > avgL * 1.6 && avgL > 30) loadTrend = Math.max(3, loadTrend - 8);
  }

  // 2. Recovery Quality (0-25): HR recovery values and trend
  const recoveryVals = wearableMetrics
    .filter((m: any) => m.hr_recovery_60s !== null)
    .map((m: any) => m.hr_recovery_60s as number)
    .slice(0, 8);
  if (recoveryVals.length >= 2) {
    const avgRecovery = recoveryVals.reduce((s: number, v: number) => s + v, 0) / recoveryVals.length;
    if (avgRecovery > 35) recoveryQuality = 25;
    else if (avgRecovery > 28) recoveryQuality = 20;
    else if (avgRecovery > 20) recoveryQuality = 15;
    else if (avgRecovery > 12) recoveryQuality = 10;
    else recoveryQuality = 5;

    // Trend bonus: improving recovery
    if (recoveryVals.length >= 4) {
      const recentAvg = recoveryVals.slice(0, 2).reduce((s: number, v: number) => s + v, 0) / 2;
      const olderAvg = recoveryVals.slice(-2).reduce((s: number, v: number) => s + v, 0) / 2;
      if (recentAvg > olderAvg + 3) recoveryQuality = Math.min(25, recoveryQuality + 3);
      if (olderAvg > recentAvg + 3) recoveryQuality = Math.max(0, recoveryQuality - 3);
    }
  }

  // 3. Days since last high-intensity session (0-20): 2-3 days ideal
  const highIntensitySessions = wearableMetrics
    .filter((m: any) => {
      const z45 = (m.hr_zone_4_pct ?? 0) + (m.hr_zone_5_pct ?? 0);
      return z45 > 25 || (m.trimp_score ?? 0) > 120;
    });
  if (highIntensitySessions.length > 0 && highIntensitySessions[0].session_id) {
    const session = allSessions.get(highIntensitySessions[0].session_id);
    if (session?.date) {
      const daysSince = Math.floor(
        (Date.now() - new Date(session.date).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSince >= 2 && daysSince <= 3) daysSinceHighIntensity = 20;
      else if (daysSince === 1 || daysSince === 4) daysSinceHighIntensity = 15;
      else if (daysSince === 0) daysSinceHighIntensity = 8; // trained today
      else if (daysSince >= 5 && daysSince <= 7) daysSinceHighIntensity = 12;
      else daysSinceHighIntensity = 6; // too long ago
    }
  }

  // 4. ACWR sweet spot proximity (0-20): 0.8-1.3 is ideal
  if (latestAcwr !== null) {
    if (latestAcwr >= 0.9 && latestAcwr <= 1.2) acwrProximity = 20;
    else if (latestAcwr >= 0.8 && latestAcwr <= 1.3) acwrProximity = 16;
    else if (latestAcwr >= 0.6 && latestAcwr <= 1.5) acwrProximity = 10;
    else acwrProximity = 3;
  }

  // 5. Performance trend (0-10): recent sprint count, speed trending up?
  if (cvMetrics.length >= 3) {
    const recentSprints = cvMetrics.slice(0, 3).map((m: any) => m.sprint_count ?? 0);
    const recentSpeed = cvMetrics.slice(0, 3).map((m: any) => m.max_speed_kmh ?? 0);
    const avgSprints = recentSprints.reduce((s: number, v: number) => s + v, 0) / 3;
    const avgSpeed = recentSpeed.reduce((s: number, v: number) => s + v, 0) / 3;
    if (avgSprints > 10 && avgSpeed > 20) performanceTrend = 10;
    else if (avgSprints > 6 || avgSpeed > 16) performanceTrend = 7;
    else performanceTrend = 4;
  }

  const score = Math.min(100, Math.max(0, loadTrend + recoveryQuality + daysSinceHighIntensity + acwrProximity + performanceTrend));
  const status: "ready" | "caution" | "fatigued" =
    score >= 70 ? "ready" : score >= 45 ? "caution" : "fatigued";

  return {
    score,
    status,
    factors: { loadTrend, recoveryQuality, daysSinceHighIntensity, acwrProximity, performanceTrend },
    latestAcwr,
    latestRecovery,
  };
}

export default async function MatchReadinessPage() {
  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("users")
    .select("academy_id")
    .eq("auth_user_id", user.id)
    .single();

  if (!profile) redirect("/login");

  // Fetch all active players
  const { data: playersRaw } = await admin
    .from("players")
    .select("id, name, jersey_number, position, age_group, status")
    .eq("academy_id", profile.academy_id)
    .eq("status", "active")
    .order("jersey_number", { ascending: true });

  const players = playersRaw ?? [];

  if (players.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">Match Readiness</h1>
        <div
          className="rounded-xl border p-8 text-center"
          style={{ background: "rgba(10,14,26,0.8)", borderColor: "rgba(255,255,255,0.06)" }}
        >
          <p className="text-white/40">No active players found. Add players to see match readiness.</p>
        </div>
      </div>
    );
  }

  const playerIds = players.map((p: any) => p.id);

  // Fetch all load records for these players (last 14 days worth)
  const { data: allLoadRecords } = await admin
    .from("load_records")
    .select("player_id, acwr_ratio, daily_load, acute_load_7d, chronic_load_28d, risk_flag, date")
    .in("player_id", playerIds)
    .order("date", { ascending: false })
    .limit(500);

  // Fetch wearable metrics
  const { data: allWearableMetrics } = await admin
    .from("wearable_metrics")
    .select("player_id, session_id, trimp_score, hr_recovery_60s, hr_zone_4_pct, hr_zone_5_pct, hr_avg, hr_max, created_at")
    .in("player_id", playerIds)
    .order("created_at", { ascending: false })
    .limit(1000);

  // Fetch CV metrics
  const { data: allCvMetrics } = await admin
    .from("cv_metrics")
    .select("player_id, session_id, sprint_count, max_speed_kmh, high_speed_run_count")
    .in("player_id", playerIds)
    .order("created_at", { ascending: false })
    .limit(500);

  // Fetch sessions for date lookup
  const sessionIds = [
    ...new Set([
      ...(allWearableMetrics ?? []).map((m: any) => m.session_id),
      ...(allCvMetrics ?? []).map((m: any) => m.session_id),
    ]),
  ].filter(Boolean);

  const { data: sessionsRaw } = sessionIds.length > 0
    ? await admin.from("sessions").select("id, date, type").in("id", sessionIds)
    : { data: [] };
  const sessionMap = new Map((sessionsRaw ?? []).map((s: any) => [s.id, s]));

  // Group data by player
  const loadByPlayer = new Map<string, any[]>();
  const wearableByPlayer = new Map<string, any[]>();
  const cvByPlayer = new Map<string, any[]>();

  for (const lr of allLoadRecords ?? []) {
    const arr = loadByPlayer.get(lr.player_id) ?? [];
    arr.push(lr);
    loadByPlayer.set(lr.player_id, arr);
  }
  for (const wm of allWearableMetrics ?? []) {
    const arr = wearableByPlayer.get(wm.player_id) ?? [];
    arr.push(wm);
    wearableByPlayer.set(wm.player_id, arr);
  }
  for (const cm of allCvMetrics ?? []) {
    const arr = cvByPlayer.get(cm.player_id) ?? [];
    arr.push(cm);
    cvByPlayer.set(cm.player_id, arr);
  }

  // Compute readiness for each player
  const playerReadiness = players.map((p: any) => {
    const loadHist = loadByPlayer.get(p.id) ?? [];
    const wearable = wearableByPlayer.get(p.id) ?? [];
    const cv = cvByPlayer.get(p.id) ?? [];

    const { score, status, factors, latestAcwr, latestRecovery } = computeReadinessScore(
      loadHist,
      wearable,
      cv,
      sessionMap
    );

    return {
      id: p.id,
      name: p.name,
      jerseyNumber: p.jersey_number,
      position: p.position,
      ageGroup: p.age_group,
      readinessScore: score,
      status,
      factors,
      latestAcwr,
      latestRecovery,
    };
  });

  return <ReadinessClient players={playerReadiness} academyId={profile.academy_id} />;
}
