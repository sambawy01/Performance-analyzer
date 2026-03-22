import { createClient } from "@/lib/supabase/server";

export async function getSessions(
  academyId: string,
  filters?: {
    ageGroup?: string;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
  }
) {
  const supabase = await createClient();

  let query = supabase
    .from("sessions")
    .select(
      `
      *,
      users!sessions_coach_id_fkey(name),
      wearable_sessions(count),
      videos(count)
    `
    )
    .eq("academy_id", academyId)
    .order("date", { ascending: false });

  if (filters?.ageGroup) {
    query = query.eq("age_group", filters.ageGroup);
  }
  if (filters?.type) {
    query = query.eq("type", filters.type);
  }
  if (filters?.dateFrom) {
    query = query.gte("date", filters.dateFrom);
  }
  if (filters?.dateTo) {
    query = query.lte("date", filters.dateTo);
  }

  const { data } = await query;
  return data ?? [];
}

export async function getSessionById(sessionId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("sessions")
    .select(
      `
      *,
      users!sessions_coach_id_fkey(name),
      videos(*),
      video_tags(*, players(name, jersey_number)),
      wearable_sessions(
        *,
        players(name, jersey_number, position, age_group, photo_url, hr_max_measured, dob)
      ),
      wearable_metrics(
        *,
        players(name, jersey_number, position, photo_url)
      )
    `
    )
    .eq("id", sessionId)
    .single();

  return data;
}

export async function getSessionLoadRecords(sessionId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("load_records")
    .select(
      `
      *,
      players(name, jersey_number, position)
    `
    )
    .eq("session_id", sessionId);

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
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sessions")
    .insert(sessionData)
    .select()
    .single();

  if (error) throw error;
  return data;
}
