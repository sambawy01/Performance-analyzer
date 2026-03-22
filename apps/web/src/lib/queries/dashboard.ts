import { createClient } from "@/lib/supabase/server";

export async function getLatestSession(
  academyId: string,
  ageGroups?: string[]
) {
  const supabase = await createClient();

  let query = supabase
    .from("sessions")
    .select(
      `
      *,
      wearable_sessions(count),
      videos(count)
    `
    )
    .eq("academy_id", academyId)
    .order("date", { ascending: false })
    .limit(1);

  if (ageGroups && ageGroups.length > 0) {
    query = query.in("age_group", ageGroups);
  }

  const { data } = await query.single();
  return data;
}

export async function getAlerts(
  academyId: string,
  ageGroups?: string[]
) {
  const supabase = await createClient();

  // Get recent load records with amber/red flags
  let query = supabase
    .from("load_records")
    .select(
      `
      *,
      players!inner(name, jersey_number, age_group, academy_id, position)
    `
    )
    .eq("players.academy_id", academyId)
    .in("risk_flag", ["amber", "red"])
    .order("created_at", { ascending: false })
    .limit(20);

  if (ageGroups && ageGroups.length > 0) {
    query = query.in("players.age_group", ageGroups);
  }

  const { data } = await query;
  return data ?? [];
}

export async function getRecentSessions(
  academyId: string,
  ageGroups?: string[],
  limit = 10
) {
  const supabase = await createClient();

  let query = supabase
    .from("sessions")
    .select(
      `
      *,
      wearable_sessions(count),
      videos(count)
    `
    )
    .eq("academy_id", academyId)
    .order("date", { ascending: false })
    .limit(limit);

  if (ageGroups && ageGroups.length > 0) {
    query = query.in("age_group", ageGroups);
  }

  const { data } = await query;
  return data ?? [];
}

export async function getTrendData(
  academyId: string,
  ageGroups?: string[],
  days = 14
) {
  const supabase = await createClient();
  const since = new Date();
  since.setDate(since.getDate() - days);

  let query = supabase
    .from("sessions")
    .select(
      `
      id, date, age_group, type,
      wearable_metrics(hr_avg, hr_max, trimp_score)
    `
    )
    .eq("academy_id", academyId)
    .gte("date", since.toISOString().split("T")[0])
    .order("date", { ascending: true });

  if (ageGroups && ageGroups.length > 0) {
    query = query.in("age_group", ageGroups);
  }

  const { data } = await query;
  return data ?? [];
}

export async function getRiskDistribution(
  academyId: string,
  ageGroups?: string[]
) {
  const supabase = await createClient();

  // Get latest load record per player
  let query = supabase
    .from("load_records")
    .select(
      `
      risk_flag,
      players!inner(academy_id, age_group)
    `
    )
    .eq("players.academy_id", academyId)
    .order("date", { ascending: false });

  if (ageGroups && ageGroups.length > 0) {
    query = query.in("players.age_group", ageGroups);
  }

  const { data } = await query;

  // Deduplicate to latest per player (the query orders by date desc)
  const seen = new Set<string>();
  const distribution = { blue: 0, green: 0, amber: 0, red: 0 };

  for (const record of data ?? []) {
    const key = `${record.risk_flag}`;
    if (!seen.has(key)) {
      seen.add(key);
      distribution[record.risk_flag as keyof typeof distribution]++;
    }
  }

  return distribution;
}
