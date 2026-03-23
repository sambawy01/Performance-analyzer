import { createAdminClient } from "@/lib/supabase/server";

export async function getSessions(
  academyId: string,
  filters?: { ageGroup?: string; type?: string }
) {
  const supabase = createAdminClient();
  let query = supabase
    .from("sessions")
    .select("*")
    .eq("academy_id", academyId)
    .order("date", { ascending: false });

  if (filters?.ageGroup) query = query.eq("age_group", filters.ageGroup);
  if (filters?.type) query = query.eq("type", filters.type);

  const { data, error } = await query;
  if (error) console.error("getSessions error:", error.message);
  return data ?? [];
}

export async function getSessionById(sessionId: string) {
  const supabase = createAdminClient();

  const { data: session, error: sessError } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (sessError) {
    console.error("getSessionById error:", sessError.message);
    return null;
  }
  if (!session) return null;

  // Fetch videos
  const { data: videos } = await supabase
    .from("videos")
    .select("*")
    .eq("session_id", sessionId);

  // Fetch wearable metrics WITHOUT player join (FK not in Supabase Cloud schema cache)
  const { data: wearableMetrics } = await supabase
    .from("wearable_metrics")
    .select("*")
    .eq("session_id", sessionId);

  // Fetch video tags from videos
  const videoIds = (videos ?? []).map((v: any) => v.id);
  let tags: any[] = [];
  if (videoIds.length > 0) {
    const { data: tagsData } = await supabase
      .from("video_tags")
      .select("*")
      .in("video_id", videoIds);
    tags = tagsData ?? [];
  }

  // Fetch ALL players for the academy to resolve player names
  const { data: allPlayers } = await supabase
    .from("players")
    .select("id, name, jersey_number, position, photo_url, age_group")
    .eq("academy_id", session.academy_id);

  const playerMap = new Map((allPlayers ?? []).map((p: any) => [p.id, p]));

  // Enrich wearable metrics with player data
  const enrichedMetrics = (wearableMetrics ?? []).map((m: any) => ({
    ...m,
    players: playerMap.get(m.player_id) ?? null,
  }));

  // Enrich video tags with player data
  const enrichedTags = tags.map((t: any) => ({
    ...t,
    players: playerMap.get(t.player_id) ?? null,
  }));

  return {
    ...session,
    videos: videos ?? [],
    video_tags: enrichedTags,
    wearable_metrics: enrichedMetrics,
  };
}

export async function getSessionLoadRecords(sessionId: string) {
  const supabase = createAdminClient();

  const { data: records } = await supabase
    .from("load_records")
    .select("*")
    .eq("session_id", sessionId);

  if (!records || records.length === 0) return [];

  // Get player names separately
  const playerIds = records.map((r: any) => r.player_id);
  const { data: players } = await supabase
    .from("players")
    .select("id, name, jersey_number, position")
    .in("id", playerIds);

  const playerMap = new Map((players ?? []).map((p: any) => [p.id, p]));

  return records.map((r: any) => ({
    ...r,
    players: playerMap.get(r.player_id) ?? null,
  }));
}

export async function createSession(sessionData: {
  academy_id: string;
  date: string;
  type: string;
  location: string;
  age_group: string;
  duration_minutes?: number;
  weather_conditions?: string;
  coach_id?: string;
  notes?: string;
}) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("sessions")
    .insert(sessionData)
    .select()
    .single();

  if (error) throw error;
  return data;
}
