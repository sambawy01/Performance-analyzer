import { Suspense } from "react";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { PlayerFilters } from "@/components/players/player-filters";
import { PlayerCard } from "@/components/players/player-card";

interface PlayersPageProps {
  searchParams: Promise<{
    age_group?: string;
    position?: string;
    status?: string;
  }>;
}

export default async function PlayersPage({ searchParams }: PlayersPageProps) {
  const params = await searchParams;
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

  // Fetch players
  let playersQuery = supabase
    .from("players")
    .select("*")
    .eq("academy_id", profile.academy_id)
    .order("age_group")
    .order("jersey_number");

  if (params.age_group) playersQuery = playersQuery.eq("age_group", params.age_group);
  if (params.position) playersQuery = playersQuery.eq("position", params.position);
  if (params.status) playersQuery = playersQuery.eq("status", params.status);

  const { data: players } = await playersQuery;

  // Fetch latest load record per player for ACWR
  const { data: loadRecords } = await supabase
    .from("load_records")
    .select("player_id, acwr_ratio, risk_flag, daily_load, date")
    .order("date", { ascending: false });

  // Fetch latest wearable metrics per player
  const { data: latestMetrics } = await supabase
    .from("wearable_metrics")
    .select("player_id, hr_avg, hr_max, trimp_score, hr_recovery_60s")
    .order("created_at", { ascending: false });

  // Fetch latest CV metrics per player
  const { data: cvData } = await supabase
    .from("cv_metrics")
    .select("player_id, total_distance_m, max_speed_kmh, sprint_count")
    .order("created_at", { ascending: false });

  // Fetch session count per player (last 28 days)
  const since28d = new Date();
  since28d.setDate(since28d.getDate() - 28);
  const { data: sessionCounts } = await supabase
    .from("wearable_metrics")
    .select("player_id")
    .gte("created_at", since28d.toISOString());

  // Build lookup maps (latest per player)
  const loadMap = new Map<string, any>();
  for (const l of loadRecords ?? []) {
    if (!loadMap.has(l.player_id)) loadMap.set(l.player_id, l);
  }

  const metricsMap = new Map<string, any>();
  for (const m of latestMetrics ?? []) {
    if (!metricsMap.has(m.player_id)) metricsMap.set(m.player_id, m);
  }

  const sessionCountMap = new Map<string, number>();
  for (const s of sessionCounts ?? []) {
    sessionCountMap.set(s.player_id, (sessionCountMap.get(s.player_id) ?? 0) + 1);
  }

  // Build CV metrics map (latest per player)
  const cvMap = new Map<string, any>();
  for (const c of cvData ?? []) {
    if (!cvMap.has(c.player_id)) cvMap.set(c.player_id, c);
  }

  // Enrich players
  const enrichedPlayers = (players ?? []).map((p) => ({
    ...p,
    acwr: loadMap.get(p.id)?.acwr_ratio ?? null,
    riskFlag: loadMap.get(p.id)?.risk_flag ?? null,
    hrAvg: metricsMap.get(p.id)?.hr_avg ?? null,
    trimp: metricsMap.get(p.id)?.trimp_score ?? null,
    recovery: metricsMap.get(p.id)?.hr_recovery_60s ?? null,
    sessions28d: sessionCountMap.get(p.id) ?? 0,
    distance: cvMap.get(p.id)?.total_distance_m ?? null,
    maxSpeed: cvMap.get(p.id)?.max_speed_kmh ?? null,
    sprintCount: cvMap.get(p.id)?.sprint_count ?? null,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Squad ({enrichedPlayers.length})</h2>
          <p className="text-sm text-white/50">
            {loadMap.size} with load data | {metricsMap.size} with wearable data | {cvMap.size} with CV data
          </p>
        </div>
      </div>

      <Suspense fallback={<div className="h-10" />}>
        <PlayerFilters />
      </Suspense>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {enrichedPlayers.map((player) => (
          <PlayerCard key={player.id} player={player as any} />
        ))}
      </div>

      {enrichedPlayers.length === 0 && (
        <p className="text-center text-white/40 py-12">
          No players found matching the current filters.
        </p>
      )}
    </div>
  );
}
