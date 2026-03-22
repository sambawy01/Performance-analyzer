import { createClient } from "@/lib/supabase/server";

export async function getPlayers(
  academyId: string,
  filters?: {
    ageGroup?: string;
    position?: string;
    status?: string;
  }
) {
  const supabase = await createClient();

  let query = supabase
    .from("players")
    .select("*")
    .eq("academy_id", academyId)
    .order("jersey_number", { ascending: true });

  if (filters?.ageGroup) {
    query = query.eq("age_group", filters.ageGroup);
  }
  if (filters?.position) {
    query = query.eq("position", filters.position);
  }
  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  const { data } = await query;
  return data ?? [];
}

export async function getPlayerById(playerId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("players")
    .select("*")
    .eq("id", playerId)
    .single();

  return data;
}

export async function getPlayerSessions(
  playerId: string,
  limit = 20
) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("wearable_metrics")
    .select(
      `
      *,
      sessions!inner(id, date, type, age_group, location)
    `
    )
    .eq("player_id", playerId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return data ?? [];
}

export async function getPlayerLoadHistory(
  playerId: string,
  limit = 30
) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("load_records")
    .select("*")
    .eq("player_id", playerId)
    .order("date", { ascending: false })
    .limit(limit);

  return data ?? [];
}

export async function getPlayerDevelopmentSnapshots(
  playerId: string
) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("development_snapshots")
    .select("*")
    .eq("player_id", playerId)
    .order("month", { ascending: true });

  return data ?? [];
}
