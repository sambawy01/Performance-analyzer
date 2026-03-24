import { createAdminClient } from "@/lib/supabase/server";

/**
 * Get all players for the demo selector.
 */
export async function getAllPlayersForSelector() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("players")
    .select("id, name, jersey_number, position, age_group, status")
    .eq("status", "active")
    .order("jersey_number", { ascending: true });
  return data ?? [];
}

/**
 * Get full player profile data for the player portal home page.
 */
export async function getPlayerPortalData(playerId: string) {
  const supabase = createAdminClient();

  // Player info
  const { data: player } = await supabase
    .from("players")
    .select("*")
    .eq("id", playerId)
    .single();

  if (!player) return null;

  // Recent wearable metrics (last 20 sessions)
  const { data: wearableMetrics } = await supabase
    .from("wearable_metrics")
    .select(
      "session_id, hr_avg, hr_max, trimp_score, hr_zone_4_pct, hr_zone_5_pct, hr_recovery_60s, created_at"
    )
    .eq("player_id", playerId)
    .order("created_at", { ascending: false })
    .limit(20);

  // Recent CV metrics
  const { data: cvMetrics } = await supabase
    .from("cv_metrics")
    .select(
      "session_id, total_distance_m, max_speed_kmh, avg_speed_kmh, sprint_count, high_speed_run_count, accel_events, decel_events, off_ball_movement_score, avg_position_x, avg_position_y, created_at"
    )
    .eq("player_id", playerId)
    .order("created_at", { ascending: false })
    .limit(20);

  // Load records
  const { data: loadRecords } = await supabase
    .from("load_records")
    .select("*")
    .eq("player_id", playerId)
    .order("date", { ascending: false })
    .limit(20);

  // Get session details for all metrics
  const allSessionIds = [
    ...new Set([
      ...(wearableMetrics ?? []).map((m) => m.session_id),
      ...(cvMetrics ?? []).map((m) => m.session_id),
    ]),
  ];

  const { data: sessions } =
    allSessionIds.length > 0
      ? await supabase
          .from("sessions")
          .select("id, date, type, duration_minutes, age_group, location")
          .in("id", allSessionIds)
          .order("date", { ascending: false })
      : { data: [] };

  const sessionMap = new Map(
    (sessions ?? []).map((s: any) => [s.id, s])
  );

  // Enrich metrics with session data
  const enrichedWearable = (wearableMetrics ?? []).map((m: any) => ({
    ...m,
    session: sessionMap.get(m.session_id) ?? null,
  }));

  const enrichedCv = (cvMetrics ?? []).map((m: any) => ({
    ...m,
    session: sessionMap.get(m.session_id) ?? null,
  }));

  // Get upcoming sessions from planner (next 7 days)
  const today = new Date().toISOString().split("T")[0];
  const nextWeek = new Date(Date.now() + 7 * 86400000)
    .toISOString()
    .split("T")[0];
  const { data: upcomingSessions } = await supabase
    .from("sessions")
    .select("id, date, type, duration_minutes, location")
    .gte("date", today)
    .lte("date", nextWeek)
    .order("date", { ascending: true })
    .limit(3);

  return {
    player,
    wearableMetrics: enrichedWearable,
    cvMetrics: enrichedCv,
    loadRecords: loadRecords ?? [],
    upcomingSessions: upcomingSessions ?? [],
    sessions: sessions ?? [],
  };
}
