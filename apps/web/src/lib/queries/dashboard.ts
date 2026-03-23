import { createAdminClient } from "@/lib/supabase/server";

export async function getLatestSession(
  academyId: string,
  ageGroups?: string[]
) {
  const supabase = createAdminClient();

  let query = supabase
    .from("sessions")
    .select("*")
    .eq("academy_id", academyId)
    .order("date", { ascending: false })
    .limit(1);

  if (ageGroups && ageGroups.length > 0) {
    query = query.in("age_group", ageGroups);
  }

  const { data, error } = await query.single();
  if (error) {
    console.error("getLatestSession error:", error.message);
  }
  return data;
}

export async function getAlerts(
  academyId: string,
  ageGroups?: string[]
) {
  const supabase = createAdminClient();

  let query = supabase
    .from("load_records")
    .select(
      `
      *,
      *
    `
    )
    
    .in("risk_flag", ["amber", "red"])
    .order("created_at", { ascending: false })
    .limit(20);

  if (ageGroups && ageGroups.length > 0) {
    query = query;
  }

  const { data, error } = await query;
  if (error) {
    console.error("getAlerts error:", error.message);
  }
  return data ?? [];
}

export async function getRecentSessions(
  academyId: string,
  ageGroups?: string[],
  limit = 10
) {
  const supabase = createAdminClient();

  // Simple query without cross-table joins to avoid RLS complications
  let query = supabase
    .from("sessions")
    .select("*")
    .eq("academy_id", academyId)
    .order("date", { ascending: false })
    .limit(limit);

  if (ageGroups && ageGroups.length > 0) {
    query = query.in("age_group", ageGroups);
  }

  const { data, error } = await query;
  if (error) {
    console.error("getRecentSessions error:", error.message);
  }
  return data ?? [];
}

export async function getTrendData(
  academyId: string,
  ageGroups?: string[],
  days = 14
) {
  const supabase = createAdminClient();
  const since = new Date();
  since.setDate(since.getDate() - days);

  let query = supabase
    .from("sessions")
    .select("id, date, age_group, type")
    .eq("academy_id", academyId)
    .gte("date", since.toISOString().split("T")[0])
    .order("date", { ascending: true });

  if (ageGroups && ageGroups.length > 0) {
    query = query.in("age_group", ageGroups);
  }

  const { data: sessions, error: sessError } = await query;
  if (sessError) {
    console.error("getTrendData sessions error:", sessError.message);
    return [];
  }

  if (!sessions || sessions.length === 0) return [];

  // Fetch wearable metrics for these sessions separately
  const sessionIds = sessions.map((s) => s.id);
  const { data: metrics, error: metError } = await supabase
    .from("wearable_metrics")
    .select("session_id, hr_avg, hr_max, trimp_score")
    .in("session_id", sessionIds);

  if (metError) {
    console.error("getTrendData metrics error:", metError.message);
  }

  // Merge metrics into sessions
  const metricsMap = new Map<string, Array<{ hr_avg: number; hr_max: number; trimp_score: number }>>();
  for (const m of metrics ?? []) {
    const existing = metricsMap.get(m.session_id) ?? [];
    existing.push({ hr_avg: m.hr_avg, hr_max: m.hr_max, trimp_score: m.trimp_score });
    metricsMap.set(m.session_id, existing);
  }

  return sessions.map((s) => ({
    ...s,
    wearable_metrics: metricsMap.get(s.id) ?? [],
  }));
}

export async function getRiskDistribution(
  academyId: string,
  ageGroups?: string[]
) {
  const supabase = createAdminClient();

  let query = supabase
    .from("load_records")
    .select(
      `
      risk_flag,
      player_id,
      date,
      *
    `
    )
    
    .order("date", { ascending: false });

  if (ageGroups && ageGroups.length > 0) {
    query = query;
  }

  const { data, error } = await query;
  if (error) {
    console.error("getRiskDistribution error:", error.message);
  }

  // Deduplicate to latest per player
  const seen = new Set<string>();
  const distribution = { blue: 0, green: 0, amber: 0, red: 0 };

  for (const record of data ?? []) {
    if (!seen.has(record.player_id)) {
      seen.add(record.player_id);
      const flag = record.risk_flag as keyof typeof distribution;
      if (flag in distribution) {
        distribution[flag]++;
      }
    }
  }

  return distribution;
}
