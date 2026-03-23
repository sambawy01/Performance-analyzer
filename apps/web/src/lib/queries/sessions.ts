import { createAdminClient } from "@/lib/supabase/server";

export async function getSessions(
  academyId: string,
  filters?: {
    ageGroup?: string;
    type?: string;
  }
) {
  const supabase = createAdminClient();

  let query = supabase
    .from("sessions")
    .select("*")
    .eq("academy_id", academyId)
    .order("date", { ascending: false });

  if (filters?.ageGroup) {
    query = query.eq("age_group", filters.ageGroup);
  }
  if (filters?.type) {
    query = query.eq("type", filters.type);
  }

  const { data, error } = await query;
  if (error) console.error("getSessions error:", error.message);
  return data ?? [];
}

export async function getSessionById(sessionId: string) {
  const supabase = createAdminClient();

  // Fetch session separately — no complex joins that break with RLS
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

  // Fetch related data separately
  const [videosRes, tagsRes, wearableMetricsRes] = await Promise.all([
    supabase.from("videos").select("*").eq("session_id", sessionId),
    supabase.from("video_tags").select("*, players(name, jersey_number)").eq("video_id", sessionId),
    supabase.from("wearable_metrics").select("*, players(name, jersey_number, position, photo_url)").eq("session_id", sessionId),
  ]);

  return {
    ...session,
    videos: videosRes.data ?? [],
    video_tags: tagsRes.data ?? [],
    wearable_metrics: wearableMetricsRes.data ?? [],
  };
}

export async function getSessionLoadRecords(sessionId: string) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("load_records")
    .select("*, players(name, jersey_number, position)")
    .eq("session_id", sessionId);

  if (error) console.error("getSessionLoadRecords error:", error.message);
  return data ?? [];
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
