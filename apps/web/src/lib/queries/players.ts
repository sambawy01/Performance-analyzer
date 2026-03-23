import { createAdminClient } from "@/lib/supabase/server";

export async function getPlayers(
  academyId: string,
  filters?: { ageGroup?: string; position?: string; status?: string }
) {
  const supabase = createAdminClient();
  let query = supabase
    .from("players")
    .select("*")
    .eq("academy_id", academyId)
    .order("jersey_number", { ascending: true });

  if (filters?.ageGroup) query = query.eq("age_group", filters.ageGroup);
  if (filters?.position) query = query.eq("position", filters.position);
  if (filters?.status) query = query.eq("status", filters.status);

  const { data } = await query;
  return data ?? [];
}

export async function getPlayerById(playerId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase.from("players").select("*").eq("id", playerId).single();
  return data;
}

export async function getPlayerSessions(playerId: string, limit = 20) {
  const supabase = createAdminClient();

  // No FK join — fetch separately
  const { data: metrics } = await supabase
    .from("wearable_metrics")
    .select("*")
    .eq("player_id", playerId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!metrics || metrics.length === 0) return [];

  // Get session details
  const sessionIds = [...new Set(metrics.map((m: any) => m.session_id))];
  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, date, type, age_group, location")
    .in("id", sessionIds);

  const sessionMap = new Map((sessions ?? []).map((s: any) => [s.id, s]));

  return metrics.map((m: any) => ({
    ...m,
    sessions: sessionMap.get(m.session_id) ?? null,
  }));
}

export async function getPlayerLoadHistory(playerId: string, limit = 30) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("load_records")
    .select("*")
    .eq("player_id", playerId)
    .order("date", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getPlayerDevelopmentSnapshots(playerId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("development_snapshots")
    .select("*")
    .eq("player_id", playerId)
    .order("month", { ascending: true });
  return data ?? [];
}
