import { createClient, createAdminClient } from "@/lib/supabase/server";
import { TacticBoard } from "@/components/tactic-board/tactic-board";
import type { EnrichedPlayer } from "@/components/tactic-board/tactic-board";
import { Waypoints } from "lucide-react";

export default async function TacticBoardPage() {
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

  // Fetch latest load records (no FK join)
  const loadMap = new Map<string, { acwr_ratio: number; risk_flag: string }>();
  if (playerIds.length > 0) {
    const { data: loadRecords } = await supabase
      .from("load_records")
      .select("player_id, acwr_ratio, risk_flag, date")
      .in("player_id", playerIds)
      .order("date", { ascending: false });

    if (loadRecords) {
      for (const lr of loadRecords) {
        if (!loadMap.has(lr.player_id)) {
          loadMap.set(lr.player_id, {
            acwr_ratio: lr.acwr_ratio,
            risk_flag: lr.risk_flag,
          });
        }
      }
    }
  }

  // Fetch latest wearable metrics
  const wearableMap = new Map<
    string,
    { hr_avg: number; trimp_score: number; hr_recovery_60s: number | null }
  >();
  if (playerIds.length > 0) {
    const { data: wearable } = await supabase
      .from("wearable_metrics")
      .select("player_id, hr_avg, trimp_score, hr_recovery_60s")
      .in("player_id", playerIds)
      .order("created_at", { ascending: false });

    if (wearable) {
      for (const wm of wearable) {
        if (!wearableMap.has(wm.player_id)) {
          wearableMap.set(wm.player_id, {
            hr_avg: wm.hr_avg,
            trimp_score: wm.trimp_score,
            hr_recovery_60s: wm.hr_recovery_60s,
          });
        }
      }
    }
  }

  // Fetch latest CV metrics
  const cvMap = new Map<
    string,
    { sprint_count: number; total_distance_m: number; max_speed_kmh: number }
  >();
  if (playerIds.length > 0) {
    const { data: cv } = await supabase
      .from("cv_metrics")
      .select("player_id, sprint_count, total_distance_m, max_speed_kmh")
      .in("player_id", playerIds)
      .order("created_at", { ascending: false });

    if (cv) {
      for (const c of cv) {
        if (!cvMap.has(c.player_id)) {
          cvMap.set(c.player_id, {
            sprint_count: c.sprint_count,
            total_distance_m: c.total_distance_m,
            max_speed_kmh: c.max_speed_kmh,
          });
        }
      }
    }
  }

  // Build enriched players
  const enrichedPlayers: EnrichedPlayer[] = playerList.map((p) => {
    const load = loadMap.get(p.id);
    const wm = wearableMap.get(p.id);
    const cv = cvMap.get(p.id);
    return {
      id: p.id,
      name: p.name,
      jersey_number: p.jersey_number,
      position: p.position,
      age_group: p.age_group,
      status: p.status,
      acwr_ratio: load?.acwr_ratio ?? null,
      risk_flag: load?.risk_flag ?? null,
      hr_avg: wm?.hr_avg ?? null,
      trimp_score: wm?.trimp_score ?? null,
      hr_recovery_60s: wm?.hr_recovery_60s ?? null,
      sprint_count: cv?.sprint_count ?? null,
      total_distance_m: cv?.total_distance_m ?? null,
      max_speed_kmh: cv?.max_speed_kmh ?? null,
    };
  });

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Waypoints className="h-6 w-6 text-[#22d3ee]" />
          Tactic Board
        </h2>
        <p className="text-sm text-white/50 mt-1">
          Build formations, assign players, and get AI tactical feedback
        </p>
      </div>
      <TacticBoard players={enrichedPlayers} />
    </div>
  );
}
