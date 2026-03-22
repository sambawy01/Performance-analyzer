import { createClient } from "@/lib/supabase/server";

/**
 * Builds a comprehensive data context string for AI conversations.
 * Includes all sessions, all players, all load records, tactical data,
 * and team-level trends. This gives Claude full awareness of the academy's data.
 */
export async function buildFullContext(academyId: string): Promise<string> {
  const supabase = await createClient();

  // Fetch everything in parallel
  const [
    playersRes,
    sessionsRes,
    metricsRes,
    loadRes,
    tacticalRes,
    baselinesRes,
  ] = await Promise.all([
    supabase
      .from("players")
      .select("id, name, jersey_number, position, age_group, dob, status, hr_max_measured, dominant_foot, height_cm, weight_kg")
      .eq("academy_id", academyId)
      .eq("status", "active")
      .order("jersey_number"),
    supabase
      .from("sessions")
      .select("id, date, type, location, duration_minutes, age_group, notes")
      .eq("academy_id", academyId)
      .order("date", { ascending: false })
      .limit(20),
    supabase
      .from("wearable_metrics")
      .select("player_id, session_id, hr_avg, hr_max, hr_min, hr_zone_1_pct, hr_zone_2_pct, hr_zone_3_pct, hr_zone_4_pct, hr_zone_5_pct, trimp_score, hr_recovery_60s, session_rpe")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("load_records")
      .select("player_id, session_id, date, daily_load, acute_load_7d, chronic_load_28d, acwr_ratio, risk_flag")
      .order("date", { ascending: false })
      .limit(200),
    supabase
      .from("tactical_metrics")
      .select("session_id, avg_formation, compactness_avg, defensive_line_height_avg, team_width_avg, team_length_avg, pressing_intensity, transition_speed_atk_s, transition_speed_def_s, possession_pct")
      .limit(20),
    supabase
      .from("player_baselines")
      .select("player_id, period, avg_distance_m, avg_max_speed_kmh, avg_sprint_count, avg_hr, avg_trimp, avg_decel_events")
      .limit(50),
  ]);

  const players = playersRes.data ?? [];
  const sessions = sessionsRes.data ?? [];
  const metrics = metricsRes.data ?? [];
  const loadRecords = loadRes.data ?? [];
  const tactical = tacticalRes.data ?? [];
  const baselines = baselinesRes.data ?? [];

  // Build player name lookup
  const playerMap = new Map(players.map(p => [p.id, p]));

  // Build context string
  let ctx = `=== ACADEMY DATA SNAPSHOT ===
Academy: The Maker Football Incubator, Cairo, Egypt
Total Active Players: ${players.length}
Recent Sessions: ${sessions.length}
Date: ${new Date().toISOString().split("T")[0]}

`;

  // Players roster
  ctx += `=== PLAYER ROSTER ===\n`;
  const grouped = new Map<string, typeof players>();
  for (const p of players) {
    const arr = grouped.get(p.age_group) ?? [];
    arr.push(p);
    grouped.set(p.age_group, arr);
  }
  for (const [ageGroup, groupPlayers] of grouped) {
    const age = 2026 - parseInt(ageGroup);
    ctx += `\nU${age} (${ageGroup}) — ${groupPlayers.length} players:\n`;
    for (const p of groupPlayers) {
      const playerAge = Math.floor((Date.now() - new Date(p.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      ctx += `  #${p.jersey_number} ${p.name} | ${p.position} | Age ${playerAge} | ${p.dominant_foot} foot`;
      if (p.height_cm) ctx += ` | ${p.height_cm}cm`;
      if (p.weight_kg) ctx += ` | ${p.weight_kg}kg`;
      if (p.hr_max_measured) ctx += ` | HRmax ${p.hr_max_measured}`;
      ctx += `\n`;
    }
  }

  // Sessions history
  ctx += `\n=== SESSION HISTORY (last ${sessions.length}) ===\n`;
  for (const s of sessions) {
    const sessionMetrics = metrics.filter(m => m.session_id === s.id);
    const sessionTactical = tactical.find(t => t.session_id === s.id);
    const avgHr = sessionMetrics.length > 0
      ? Math.round(sessionMetrics.reduce((sum, m) => sum + m.hr_avg, 0) / sessionMetrics.length)
      : null;
    const avgTrimp = sessionMetrics.length > 0
      ? Math.round(sessionMetrics.reduce((sum, m) => sum + m.trimp_score, 0) / sessionMetrics.length)
      : null;

    ctx += `\n${s.date} | ${s.type} | ${s.location} | ${s.duration_minutes ?? '?'} min | ${s.age_group}`;
    if (avgHr) ctx += ` | Avg HR: ${avgHr} bpm`;
    if (avgTrimp) ctx += ` | Avg TRIMP: ${avgTrimp}`;
    ctx += ` | ${sessionMetrics.length} players tracked`;
    if (s.notes) ctx += `\n  Notes: ${s.notes}`;
    if (sessionTactical) {
      ctx += `\n  Tactical: ${sessionTactical.avg_formation} formation`;
      if (sessionTactical.possession_pct) ctx += ` | ${sessionTactical.possession_pct}% possession`;
      if (sessionTactical.pressing_intensity) ctx += ` | PPDA ${sessionTactical.pressing_intensity}`;
      if (sessionTactical.transition_speed_atk_s) ctx += ` | Transition ATK ${sessionTactical.transition_speed_atk_s}s DEF ${sessionTactical.transition_speed_def_s}s`;
    }

    // Per-player metrics for this session
    if (sessionMetrics.length > 0) {
      ctx += `\n  Per-player:`;
      for (const m of sessionMetrics) {
        const p = playerMap.get(m.player_id);
        if (!p) continue;
        ctx += `\n    #${p.jersey_number} ${p.name}: HR avg ${m.hr_avg}, max ${m.hr_max}, TRIMP ${Math.round(m.trimp_score)}, Z4+Z5 ${Math.round(m.hr_zone_4_pct + m.hr_zone_5_pct)}%`;
        if (m.hr_recovery_60s) ctx += `, Recovery ${m.hr_recovery_60s}bpm`;
      }
    }
  }

  // Current load status for every player
  ctx += `\n\n=== CURRENT LOAD STATUS (latest per player) ===\n`;
  const latestLoads = new Map<string, typeof loadRecords[0]>();
  for (const l of loadRecords) {
    if (!latestLoads.has(l.player_id)) {
      latestLoads.set(l.player_id, l);
    }
  }
  const redPlayers: string[] = [];
  const amberPlayers: string[] = [];

  for (const [playerId, load] of latestLoads) {
    const p = playerMap.get(playerId);
    if (!p) continue;
    ctx += `#${p.jersey_number} ${p.name}: ACWR ${load.acwr_ratio} (${load.risk_flag}) | 7d load: ${Math.round(load.acute_load_7d)} | 28d avg: ${Math.round(load.chronic_load_28d)} | Last: ${load.date}\n`;
    if (load.risk_flag === "red") redPlayers.push(`#${p.jersey_number} ${p.name} (ACWR ${load.acwr_ratio})`);
    if (load.risk_flag === "amber") amberPlayers.push(`#${p.jersey_number} ${p.name} (ACWR ${load.acwr_ratio})`);
  }

  // Risk summary
  ctx += `\n=== INJURY RISK SUMMARY ===\n`;
  ctx += `RED (danger, >1.5): ${redPlayers.length > 0 ? redPlayers.join(", ") : "None"}\n`;
  ctx += `AMBER (caution, 1.3-1.5): ${amberPlayers.length > 0 ? amberPlayers.join(", ") : "None"}\n`;
  ctx += `GREEN (optimal): ${latestLoads.size - redPlayers.length - amberPlayers.length} players\n`;

  // Baselines
  if (baselines.length > 0) {
    ctx += `\n=== PLAYER BASELINES (28-day averages) ===\n`;
    for (const b of baselines.filter(b => b.period === "28d")) {
      const p = playerMap.get(b.player_id);
      if (!p) continue;
      ctx += `#${p.jersey_number} ${p.name}: Avg HR ${b.avg_hr ? Math.round(Number(b.avg_hr)) : '?'}, Avg TRIMP ${b.avg_trimp ? Math.round(Number(b.avg_trimp)) : '?'}`;
      if (b.avg_sprint_count) ctx += `, Sprints ${Math.round(Number(b.avg_sprint_count))}`;
      ctx += `\n`;
    }
  }

  return ctx;
}
