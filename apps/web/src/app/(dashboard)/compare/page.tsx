import { createClient, createAdminClient } from "@/lib/supabase/server";
import { PlayerComparison } from "@/components/compare/player-comparison";

export default async function ComparePage() {
  const authClient = await createClient();
  const supabase = createAdminClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("academy_id, name, role")
    .eq("auth_user_id", user!.id)
    .single();

  if (!profile) return null;

  // Fetch all active players
  const { data: players } = await supabase
    .from("players")
    .select("id, name, jersey_number, position, age_group")
    .eq("academy_id", profile.academy_id)
    .eq("status", "active")
    .order("jersey_number");

  // Latest load records
  const { data: loadRecords } = await supabase
    .from("load_records")
    .select("player_id, acwr_ratio, risk_flag")
    .order("date", { ascending: false });

  // Latest wearable metrics
  const { data: latestMetrics } = await supabase
    .from("wearable_metrics")
    .select("player_id, hr_avg, hr_max, trimp_score, hr_recovery_60s")
    .order("created_at", { ascending: false });

  // Latest CV metrics
  const { data: cvMetrics } = await supabase
    .from("cv_metrics")
    .select("player_id, total_distance_m, max_speed_kmh, sprint_count, high_speed_run_count, accel_events, decel_events, off_ball_movement_score")
    .order("created_at", { ascending: false });

  // Build lookup maps (latest per player)
  const loadMap = new Map<string, { acwr_ratio: number; risk_flag: string }>();
  for (const l of loadRecords ?? []) {
    if (!loadMap.has(l.player_id)) loadMap.set(l.player_id, l);
  }

  const metricsMap = new Map<string, { hr_avg: number; hr_max: number; trimp_score: number; hr_recovery_60s: number | null }>();
  for (const m of latestMetrics ?? []) {
    if (!metricsMap.has(m.player_id)) metricsMap.set(m.player_id, m);
  }

  const cvMap = new Map<string, {
    total_distance_m: number;
    max_speed_kmh: number;
    sprint_count: number;
    high_speed_run_count: number;
    accel_events: number;
    decel_events: number;
    off_ball_movement_score: number | null;
  }>();
  for (const c of cvMetrics ?? []) {
    if (!cvMap.has(c.player_id)) cvMap.set(c.player_id, c);
  }

  const enrichedPlayers = (players ?? []).map((p) => ({
    ...p,
    acwr: loadMap.get(p.id)?.acwr_ratio ?? null,
    riskFlag: loadMap.get(p.id)?.risk_flag ?? null,
    hrAvg: metricsMap.get(p.id)?.hr_avg ?? null,
    hrMax: metricsMap.get(p.id)?.hr_max ?? null,
    trimp: metricsMap.get(p.id)?.trimp_score ?? null,
    recovery: metricsMap.get(p.id)?.hr_recovery_60s ?? null,
    maxSpeedKmh: cvMap.get(p.id)?.max_speed_kmh ?? null,
    sprintCount: cvMap.get(p.id)?.sprint_count ?? null,
    distanceKm: cvMap.get(p.id) ? cvMap.get(p.id)!.total_distance_m / 1000 : null,
    hsrCount: cvMap.get(p.id)?.high_speed_run_count ?? null,
    accelEvents: cvMap.get(p.id)?.accel_events ?? null,
    decelEvents: cvMap.get(p.id)?.decel_events ?? null,
    movementScore: cvMap.get(p.id)?.off_ball_movement_score ?? null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Player Comparison</h2>
        <p className="text-sm text-white/50 mt-1">
          Compare up to 4 players side by side · Latest metrics · AI-powered analysis
        </p>
      </div>

      {enrichedPlayers.length < 2 ? (
        <div className="rounded-xl border border-white/[0.08] p-12 text-center">
          <p className="text-white/40">Need at least 2 players with data to compare.</p>
        </div>
      ) : (
        <PlayerComparison players={enrichedPlayers as any} />
      )}
    </div>
  );
}
