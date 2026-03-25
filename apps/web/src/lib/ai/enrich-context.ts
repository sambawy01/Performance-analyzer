/**
 * Coach M8 — Context Enrichment Engine
 *
 * Pre-computes derived metrics, percentile ranks, trends, and risk assessments
 * before sending to Claude. This is the "data preparation" layer that turns raw
 * database rows into rich, analyst-ready context strings.
 */

// ---------------------------------------------------------------------------
// Types (loose — we work with Supabase `any` rows throughout)
// ---------------------------------------------------------------------------
interface PlayerRow {
  id: string;
  name: string;
  jersey_number: number;
  position: string;
  age_group: string;
  dob?: string;
  status?: string;
  hr_max_measured?: number;
  dominant_foot?: string;
  height_cm?: number;
  weight_kg?: number;
}

interface WearableMetricRow {
  player_id: string;
  session_id: string;
  hr_avg: number;
  hr_max: number;
  hr_min?: number;
  trimp_score: number;
  hr_zone_1_pct: number;
  hr_zone_2_pct: number;
  hr_zone_3_pct: number;
  hr_zone_4_pct: number;
  hr_zone_5_pct: number;
  hr_recovery_60s: number | null;
  session_rpe?: number | null;
  created_at?: string;
}

interface CvMetricRow {
  player_id: string;
  session_id: string;
  total_distance_m: number;
  max_speed_kmh: number;
  avg_speed_kmh: number;
  sprint_count: number;
  high_speed_run_count: number;
  accel_events: number;
  decel_events: number;
  off_ball_movement_score?: number;
}

interface LoadRecordRow {
  player_id: string;
  session_id?: string;
  date: string;
  daily_load: number;
  acute_load_7d: number;
  chronic_load_28d: number;
  acwr_ratio: number;
  risk_flag: string;
}

interface SessionRow {
  id: string;
  date: string;
  type: string;
  location?: string;
  duration_minutes?: number;
  age_group?: string;
  notes?: string;
}

interface TacticalRow {
  session_id: string;
  avg_formation?: string;
  possession_pct?: number;
  pressing_intensity?: number;
  compactness_avg?: number;
  defensive_line_height_avg?: number;
  team_width_avg?: number;
  team_length_avg?: number;
  transition_speed_atk_s?: number;
  transition_speed_def_s?: number;
}

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------

/** Percentile rank of `value` within `arr` (0-100). */
function percentileRank(value: number, arr: number[]): number {
  if (arr.length === 0) return 50;
  const sorted = [...arr].sort((a, b) => a - b);
  let count = 0;
  for (const v of sorted) {
    if (v < value) count++;
    else if (v === value) count += 0.5;
  }
  return Math.round((count / sorted.length) * 100);
}

/** Compute % change between old and new averages. Positive = increase. */
function pctChange(oldVal: number, newVal: number): number {
  if (oldVal === 0) return 0;
  return Math.round(((newVal - oldVal) / Math.abs(oldVal)) * 100);
}

/** Direction arrow for a trend. */
function trendArrow(change: number): string {
  if (change > 5) return "UP";
  if (change < -5) return "DOWN";
  return "STABLE";
}

/** Map position to position group. */
function positionGroup(position: string): string {
  const pos = position?.toUpperCase() ?? "";
  if (pos.includes("GK")) return "GK";
  if (pos.includes("CB") || pos.includes("LB") || pos.includes("RB") || pos.includes("FB")) return "DEF";
  if (pos.includes("CM") || pos.includes("CDM") || pos.includes("DM") || pos.includes("CAM") || pos.includes("AM")) return "MID";
  if (pos.includes("ST") || pos.includes("CF") || pos.includes("LW") || pos.includes("RW") || pos.includes("W")) return "ATT";
  return "MID"; // default
}

/** Classify session intensity from avg TRIMP. */
function classifyIntensity(avgTrimp: number): string {
  if (avgTrimp < 40) return "Recovery";
  if (avgTrimp < 80) return "Low";
  if (avgTrimp < 120) return "Moderate";
  if (avgTrimp < 180) return "High";
  return "Maximal";
}

/** Compute a composite recovery score 0-100. */
function recoveryScore(
  hrr60: number | null,
  daysSinceHighIntensity: number,
  acwr: number
): number {
  let score = 0;

  // HRR60 component (0-40 points)
  if (hrr60 !== null) {
    if (hrr60 >= 40) score += 40;
    else if (hrr60 >= 30) score += 30;
    else if (hrr60 >= 20) score += 20;
    else score += 10;
  } else {
    score += 20; // no data — assume moderate
  }

  // Days since high intensity (0-30 points)
  if (daysSinceHighIntensity >= 3) score += 30;
  else if (daysSinceHighIntensity >= 2) score += 25;
  else if (daysSinceHighIntensity >= 1) score += 15;
  else score += 5;

  // ACWR proximity to 1.0 (0-30 points)
  const acwrDist = Math.abs(acwr - 1.0);
  if (acwrDist <= 0.2) score += 30;
  else if (acwrDist <= 0.4) score += 20;
  else if (acwrDist <= 0.6) score += 10;
  else score += 0;

  return Math.min(100, score);
}

// ---------------------------------------------------------------------------
// ENRICH PLAYER CONTEXT
// ---------------------------------------------------------------------------

/**
 * Takes raw player data and returns a richly formatted context string with
 * percentile ranks, trends, benchmarks, risk factors, and development velocity.
 */
export function enrichPlayerContext(
  player: PlayerRow,
  metrics: WearableMetricRow[],
  cvMetrics: CvMetricRow[],
  loadHistory: LoadRecordRow[],
  squadMetrics: WearableMetricRow[],
  squadCvMetrics: CvMetricRow[],
  squadLoadRecords: LoadRecordRow[]
): string {
  const lines: string[] = [];
  const posGroup = positionGroup(player.position);

  // --- Basic player info ---
  const age = player.dob
    ? Math.floor((Date.now() - new Date(player.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  lines.push(`=== ENRICHED PLAYER CONTEXT: #${player.jersey_number} ${player.name} ===`);
  lines.push(`Position: ${player.position} (Group: ${posGroup}) | Age Group: U${2026 - parseInt(player.age_group)}${age ? ` | Age: ${age}` : ""}`);
  if (player.height_cm) lines.push(`Height: ${player.height_cm}cm | Weight: ${player.weight_kg ?? "?"}kg | Foot: ${player.dominant_foot ?? "?"}`);
  if (player.hr_max_measured) lines.push(`Measured HRmax: ${player.hr_max_measured} bpm`);

  // --- Squad percentile values (all players) ---
  const squadTrimpValues = squadMetrics.map(m => m.trimp_score);
  const squadHrAvgValues = squadMetrics.map(m => m.hr_avg);
  const squadHrMaxValues = squadMetrics.map(m => m.hr_max);
  const squadHrr60Values = squadMetrics.filter(m => m.hr_recovery_60s !== null).map(m => m.hr_recovery_60s as number);
  const squadZ45Values = squadMetrics.map(m => m.hr_zone_4_pct + m.hr_zone_5_pct);

  // --- Player averages ---
  if (metrics.length > 0) {
    const avgTrimp = Math.round(metrics.reduce((s, m) => s + m.trimp_score, 0) / metrics.length);
    const avgHr = Math.round(metrics.reduce((s, m) => s + m.hr_avg, 0) / metrics.length);
    const avgHrMax = Math.round(metrics.reduce((s, m) => s + m.hr_max, 0) / metrics.length);
    const avgZ45 = Math.round(metrics.reduce((s, m) => s + m.hr_zone_4_pct + m.hr_zone_5_pct, 0) / metrics.length);
    const hrr60Vals = metrics.filter(m => m.hr_recovery_60s !== null).map(m => m.hr_recovery_60s as number);
    const avgHrr60 = hrr60Vals.length > 0 ? Math.round(hrr60Vals.reduce((s, v) => s + v, 0) / hrr60Vals.length) : null;

    lines.push("");
    lines.push(`--- WEARABLE METRICS (${metrics.length} sessions) ---`);
    lines.push(`Avg TRIMP: ${avgTrimp} — ${percentileRank(avgTrimp, squadTrimpValues)}th percentile in squad`);
    lines.push(`Avg HR: ${avgHr} bpm — ${percentileRank(avgHr, squadHrAvgValues)}th percentile`);
    lines.push(`Avg HR Max: ${avgHrMax} bpm — ${percentileRank(avgHrMax, squadHrMaxValues)}th percentile`);
    lines.push(`Avg Z4+Z5 time: ${avgZ45}% — ${percentileRank(avgZ45, squadZ45Values)}th percentile`);
    if (avgHrr60 !== null) {
      lines.push(`Avg HR Recovery (60s): ${avgHrr60} bpm — ${percentileRank(avgHrr60, squadHrr60Values)}th percentile`);
    }

    // Zone distribution
    const avgZ1 = Math.round(metrics.reduce((s, m) => s + m.hr_zone_1_pct, 0) / metrics.length);
    const avgZ2 = Math.round(metrics.reduce((s, m) => s + m.hr_zone_2_pct, 0) / metrics.length);
    const avgZ3 = Math.round(metrics.reduce((s, m) => s + m.hr_zone_3_pct, 0) / metrics.length);
    const avgZ4 = Math.round(metrics.reduce((s, m) => s + m.hr_zone_4_pct, 0) / metrics.length);
    const avgZ5 = Math.round(metrics.reduce((s, m) => s + m.hr_zone_5_pct, 0) / metrics.length);
    lines.push(`Zone Distribution: Z1 ${avgZ1}% | Z2 ${avgZ2}% | Z3 ${avgZ3}% | Z4 ${avgZ4}% | Z5 ${avgZ5}%`);

    // High-intensity ratio check
    const highIntensityRatio = avgZ45;
    if (highIntensityRatio > 25) {
      lines.push(`WARNING: High-intensity ratio is ${highIntensityRatio}% — above the recommended 15-25% for youth. Consider reducing Z4+Z5 exposure.`);
    } else if (highIntensityRatio < 10) {
      lines.push(`NOTE: High-intensity ratio is only ${highIntensityRatio}% — below the 15-25% target. May need more match-intensity work.`);
    } else {
      lines.push(`High-intensity ratio of ${highIntensityRatio}% is within the optimal 15-25% range for youth training.`);
    }

    // --- 30-day trend ---
    if (metrics.length >= 6) {
      const recent = metrics.slice(0, Math.ceil(metrics.length / 2));
      const older = metrics.slice(Math.ceil(metrics.length / 2));

      const recentAvgTrimp = recent.reduce((s, m) => s + m.trimp_score, 0) / recent.length;
      const olderAvgTrimp = older.reduce((s, m) => s + m.trimp_score, 0) / older.length;
      const trimpChange = pctChange(olderAvgTrimp, recentAvgTrimp);

      const recentAvgHr = recent.reduce((s, m) => s + m.hr_avg, 0) / recent.length;
      const olderAvgHr = older.reduce((s, m) => s + m.hr_avg, 0) / older.length;
      const hrChange = pctChange(olderAvgHr, recentAvgHr);

      const recentHrr = recent.filter(m => m.hr_recovery_60s !== null).map(m => m.hr_recovery_60s as number);
      const olderHrr = older.filter(m => m.hr_recovery_60s !== null).map(m => m.hr_recovery_60s as number);
      let hrrChange = 0;
      if (recentHrr.length > 0 && olderHrr.length > 0) {
        const recentAvgHrr = recentHrr.reduce((s, v) => s + v, 0) / recentHrr.length;
        const olderAvgHrr = olderHrr.reduce((s, v) => s + v, 0) / olderHrr.length;
        hrrChange = pctChange(olderAvgHrr, recentAvgHrr);
      }

      lines.push("");
      lines.push(`--- 30-DAY TRENDS ---`);
      lines.push(`TRIMP trend: ${trendArrow(trimpChange)} (${trimpChange > 0 ? "+" : ""}${trimpChange}%) — ${trimpChange > 10 ? "load increasing significantly" : trimpChange < -10 ? "load decreasing significantly" : "load stable"}`);
      lines.push(`Avg HR trend: ${trendArrow(hrChange)} (${hrChange > 0 ? "+" : ""}${hrChange}%) — ${hrChange < -3 ? "improving aerobic fitness (lower HR for same work)" : hrChange > 3 ? "possible fatigue or deconditioning" : "stable"}`);
      if (recentHrr.length > 0 && olderHrr.length > 0) {
        lines.push(`HRR60 trend: ${trendArrow(hrrChange)} (${hrrChange > 0 ? "+" : ""}${hrrChange}%) — ${hrrChange > 5 ? "recovery improving (positive adaptation)" : hrrChange < -5 ? "recovery declining (fatigue concern)" : "stable recovery"}`);
      }
    }
  }

  // --- CV Metrics ---
  if (cvMetrics.length > 0) {
    const avgDist = Math.round(cvMetrics.reduce((s, m) => s + m.total_distance_m, 0) / cvMetrics.length);
    const avgMaxSpeed = (cvMetrics.reduce((s, m) => s + m.max_speed_kmh, 0) / cvMetrics.length).toFixed(1);
    const avgSprints = Math.round(cvMetrics.reduce((s, m) => s + m.sprint_count, 0) / cvMetrics.length);
    const avgAccel = Math.round(cvMetrics.reduce((s, m) => s + m.accel_events, 0) / cvMetrics.length);
    const avgDecel = Math.round(cvMetrics.reduce((s, m) => s + m.decel_events, 0) / cvMetrics.length);

    const squadDistValues = squadCvMetrics.map(m => m.total_distance_m);
    const squadSprintValues = squadCvMetrics.map(m => m.sprint_count);
    const squadSpeedValues = squadCvMetrics.map(m => m.max_speed_kmh);

    lines.push("");
    lines.push(`--- CV / POSITION METRICS (${cvMetrics.length} sessions) ---`);
    lines.push(`Avg Distance: ${avgDist}m — ${percentileRank(avgDist, squadDistValues)}th percentile`);
    lines.push(`Avg Max Speed: ${avgMaxSpeed} km/h — ${percentileRank(parseFloat(avgMaxSpeed), squadSpeedValues)}th percentile`);
    lines.push(`Avg Sprint Count: ${avgSprints} — ${percentileRank(avgSprints, squadSprintValues)}th percentile`);
    lines.push(`Avg Accel Events: ${avgAccel} | Avg Decel Events: ${avgDecel}`);

    // Position-specific benchmark comparison
    const benchmarks: Record<string, { distance: [number, number]; sprints: [number, number] }> = {
      GK: { distance: [2000, 3500], sprints: [2, 5] },
      DEF: { distance: [4000, 5500], sprints: [5, 10] },
      MID: { distance: [5500, 7500], sprints: [8, 16] },
      ATT: { distance: [4500, 6500], sprints: [12, 22] },
    };
    const bench = benchmarks[posGroup];
    if (bench) {
      const distStatus = avgDist < bench.distance[0] ? "BELOW" : avgDist > bench.distance[1] ? "ABOVE" : "WITHIN";
      const sprintStatus = avgSprints < bench.sprints[0] ? "BELOW" : avgSprints > bench.sprints[1] ? "ABOVE" : "WITHIN";
      lines.push(`Position benchmark (${posGroup}): Distance ${bench.distance[0]}-${bench.distance[1]}m — player is ${distStatus} range (${avgDist}m)`);
      lines.push(`Position benchmark (${posGroup}): Sprints ${bench.sprints[0]}-${bench.sprints[1]} — player is ${sprintStatus} range (${avgSprints})`);
    }
  }

  // --- ACWR / Load ---
  if (loadHistory.length > 0) {
    const latest = loadHistory[0];
    const acwr = latest.acwr_ratio;
    const riskFlag = latest.risk_flag;

    lines.push("");
    lines.push(`--- LOAD MANAGEMENT ---`);
    lines.push(`Current ACWR: ${acwr.toFixed(2)} (${riskFlag.toUpperCase()}) as of ${latest.date}`);
    lines.push(`Acute Load (7d): ${Math.round(latest.acute_load_7d)} | Chronic Load (28d): ${Math.round(latest.chronic_load_28d)}`);

    // ACWR trajectory projection
    if (loadHistory.length >= 3) {
      const recentAcwrs = loadHistory.slice(0, 3).map(l => l.acwr_ratio);
      const acwrTrend = recentAcwrs[0] - recentAcwrs[recentAcwrs.length - 1];
      const dailyChange = acwrTrend / (recentAcwrs.length - 1);
      const projected7d = acwr + dailyChange * 7;
      lines.push(`ACWR trajectory: ${dailyChange > 0 ? "RISING" : dailyChange < 0 ? "FALLING" : "FLAT"} (${dailyChange > 0 ? "+" : ""}${(dailyChange * 7).toFixed(2)} projected over next 7 days)`);
      lines.push(`Projected 7-day ACWR: ${projected7d.toFixed(2)} — ${projected7d > 1.5 ? "DANGER if current load continues" : projected7d > 1.3 ? "will enter caution zone" : projected7d < 0.8 ? "risk of deconditioning" : "within safe range"}`);
    }

    // ACWR history summary
    const redCount = loadHistory.filter(l => l.risk_flag === "red").length;
    const amberCount = loadHistory.filter(l => l.risk_flag === "amber").length;
    lines.push(`Load history (${loadHistory.length} records): ${redCount} red flags, ${amberCount} amber flags`);

    // Recovery score
    const latestHrr = metrics.length > 0 && metrics[0].hr_recovery_60s !== null ? metrics[0].hr_recovery_60s : null;
    // Days since a high TRIMP session (>120)
    const highIntensityDates = metrics.filter(m => m.trimp_score > 120);
    let daysSinceHigh = 3; // default if no data
    if (highIntensityDates.length > 0 && highIntensityDates[0].created_at) {
      daysSinceHigh = Math.floor((Date.now() - new Date(highIntensityDates[0].created_at).getTime()) / (24 * 60 * 60 * 1000));
    }
    const recScore = recoveryScore(latestHrr, daysSinceHigh, acwr);
    lines.push(`Composite Recovery Score: ${recScore}/100 (HRR60: ${latestHrr ?? "N/A"} bpm, ${daysSinceHigh} days since high-intensity, ACWR: ${acwr.toFixed(2)})`);
  }

  // --- Enhanced Injury Prevention Metrics ---
  // (Monotony, Cumulative Load, Asymmetry, Multi-Factor Risk)
  if (metrics.length >= 3) {
    lines.push("");
    lines.push(`--- ENHANCED INJURY PREVENTION ---`);

    // Monotony Index (Foster 1998)
    const dailyLoads7d = metrics.slice(0, 7).map(m => m.trimp_score);
    if (dailyLoads7d.length >= 3) {
      const mean7d = dailyLoads7d.reduce((s, v) => s + v, 0) / dailyLoads7d.length;
      const variance7d = dailyLoads7d.reduce((s, v) => s + Math.pow(v - mean7d, 2), 0) / dailyLoads7d.length;
      const stdDev7d = Math.sqrt(variance7d);
      const monotony = stdDev7d < 0.01 ? (mean7d > 0 ? 10 : 0) : mean7d / stdDev7d;
      const weeklyLoad = dailyLoads7d.reduce((s, v) => s + v, 0);
      const strain = weeklyLoad * monotony;
      lines.push(`Monotony Index: ${monotony.toFixed(2)} (threshold: 2.0) — ${monotony > 2.0 ? "HIGH — training too repetitive, vary session types" : "within acceptable range"}`);
      lines.push(`Training Strain: ${Math.round(strain)} (threshold: 6000 AU) — ${strain > 6000 ? "DANGER — overreaching territory" : strain > 4000 ? "elevated — monitor closely" : "safe range"}`);
    }

    // Cumulative 14-day load
    const dailyLoads14d = metrics.slice(0, 14).map(m => m.trimp_score);
    const cumulative14d = dailyLoads14d.reduce((s, v) => s + v, 0);
    const ageGroupYear = parseInt(player.age_group);
    const ageGroupThresholds: Record<number, number> = { 2016: 1200, 2015: 1400, 2014: 1600, 2013: 1800, 2012: 2000, 2011: 2200, 2010: 2500 };
    const threshold = ageGroupThresholds[ageGroupYear] ?? 2500;
    const loadPct = Math.round((cumulative14d / threshold) * 100);
    lines.push(`Cumulative 14-Day Load: ${Math.round(cumulative14d)} / ${threshold} threshold (${loadPct}%) — ${loadPct > 100 ? "EXCEEDS threshold — mandatory load reduction" : loadPct > 80 ? "approaching threshold — monitor volume" : "within safe limits"}`);
  }

  // Asymmetry context (if CV data available)
  if (cvMetrics.length >= 2) {
    const avgX = cvMetrics.reduce((s, m) => s + (m.total_distance_m > 0 ? 50 : 50), 0) / cvMetrics.length; // simplified
    const totalAccel = cvMetrics.reduce((s, m) => s + m.accel_events, 0);
    const totalDecel = cvMetrics.reduce((s, m) => s + m.decel_events, 0);
    const actionTotal = totalAccel + totalDecel;
    const accelRatio = actionTotal > 0 ? totalAccel / actionTotal : 0.5;
    const imbalance = Math.abs(accelRatio - 0.5) * 2;
    if (imbalance > 0.2) {
      lines.push(`Movement Asymmetry: Accel/Decel imbalance ratio ${(accelRatio * 100).toFixed(0)}/${((1 - accelRatio) * 100).toFixed(0)} — ${imbalance > 0.4 ? "significant asymmetry — physio assessment recommended" : "mild asymmetry — monitor bilateral drills"}`);
    }
  }

  // --- Injury Risk Factors ---
  lines.push("");
  lines.push(`--- INJURY RISK FACTORS ---`);
  const riskFactors: string[] = [];

  if (loadHistory.length > 0 && loadHistory[0].acwr_ratio > 1.3) {
    riskFactors.push(`MODIFIABLE: Elevated ACWR (${loadHistory[0].acwr_ratio.toFixed(2)}) — reduce training load`);
  }
  if (loadHistory.length > 0 && loadHistory[0].acwr_ratio < 0.8) {
    riskFactors.push(`MODIFIABLE: Low ACWR (${loadHistory[0].acwr_ratio.toFixed(2)}) — gradual load increase needed to avoid spike vulnerability`);
  }

  const hrr60Vals = metrics.filter(m => m.hr_recovery_60s !== null).map(m => m.hr_recovery_60s as number);
  if (hrr60Vals.length >= 3) {
    const recentHrr = hrr60Vals.slice(0, 3).reduce((s, v) => s + v, 0) / 3;
    if (recentHrr < 25) {
      riskFactors.push(`MODIFIABLE: Poor HR recovery (avg ${Math.round(recentHrr)} bpm) — indicates accumulated fatigue`);
    }
  }

  if (metrics.length >= 3) {
    const recentZ45 = metrics.slice(0, 3).reduce((s, m) => s + m.hr_zone_4_pct + m.hr_zone_5_pct, 0) / 3;
    if (recentZ45 > 30) {
      riskFactors.push(`MODIFIABLE: Excessive high-intensity exposure (avg ${Math.round(recentZ45)}% Z4+Z5 in recent sessions)`);
    }
  }

  if (age !== null && age >= 12 && age <= 14) {
    riskFactors.push(`NON-MODIFIABLE: Age ${age} — potential PHV window. Growth plate vulnerability. Monitor for Osgood-Schlatter/Sever's symptoms.`);
  }

  if (loadHistory.filter(l => l.risk_flag === "amber" || l.risk_flag === "red").length >= 3) {
    riskFactors.push(`PATTERN: ${loadHistory.filter(l => l.risk_flag === "amber" || l.risk_flag === "red").length} amber/red flags in recent history — chronic overload pattern`);
  }

  if (riskFactors.length === 0) {
    lines.push("No significant risk factors identified. Player is in a healthy load state.");
  } else {
    for (const rf of riskFactors) {
      lines.push(`- ${rf}`);
    }
  }

  // --- Development Velocity ---
  if (metrics.length >= 6) {
    lines.push("");
    lines.push(`--- DEVELOPMENT VELOCITY ---`);
    const half = Math.ceil(metrics.length / 2);
    const recentHalf = metrics.slice(0, half);
    const olderHalf = metrics.slice(half);

    const recentTrimpAvg = recentHalf.reduce((s, m) => s + m.trimp_score, 0) / recentHalf.length;
    const olderTrimpAvg = olderHalf.reduce((s, m) => s + m.trimp_score, 0) / olderHalf.length;
    const trimpGrowth = pctChange(olderTrimpAvg, recentTrimpAvg);
    lines.push(`Load capacity growth: ${trimpGrowth > 0 ? "+" : ""}${trimpGrowth}% (TRIMP trend)`);

    const recentHrrVals = recentHalf.filter(m => m.hr_recovery_60s !== null).map(m => m.hr_recovery_60s as number);
    const olderHrrVals = olderHalf.filter(m => m.hr_recovery_60s !== null).map(m => m.hr_recovery_60s as number);
    if (recentHrrVals.length > 0 && olderHrrVals.length > 0) {
      const recentHrrAvg = recentHrrVals.reduce((s, v) => s + v, 0) / recentHrrVals.length;
      const olderHrrAvg = olderHrrVals.reduce((s, v) => s + v, 0) / olderHrrVals.length;
      const hrrGrowth = pctChange(olderHrrAvg, recentHrrAvg);
      lines.push(`Recovery improvement: ${hrrGrowth > 0 ? "+" : ""}${hrrGrowth}% (HRR60 trend) — ${hrrGrowth > 5 ? "positive adaptation" : hrrGrowth < -5 ? "fatigue accumulating" : "stable"}`);
    }
  }

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// ENRICH SESSION CONTEXT
// ---------------------------------------------------------------------------

/**
 * Takes raw session data and returns an enriched context string with intensity
 * classification, planned vs actual, top/bottom performers, and load alerts.
 */
export function enrichSessionContext(
  session: SessionRow,
  playerMetrics: (WearableMetricRow & { name: string; position: string; jersey_number: number })[],
  cvMetrics: (CvMetricRow & { name: string; position: string; jersey_number: number })[],
  loadRecords: (LoadRecordRow & { name: string; jersey_number: number })[],
  recentSessionAverages: { avgTrimp: number; avgHr: number; avgZ45: number; count: number } | null,
  tactical: TacticalRow | null
): string {
  const lines: string[] = [];

  lines.push(`=== ENRICHED SESSION CONTEXT ===`);
  lines.push(`Session: ${session.date} | ${session.type} | ${session.location ?? "?"} | ${session.duration_minutes ?? "?"} min | Age Group: ${session.age_group ?? "?"}`);
  if (session.notes) lines.push(`Coach Notes: ${session.notes}`);

  if (playerMetrics.length === 0) {
    lines.push("\nNo wearable data available for this session.");
    return lines.join("\n");
  }

  // --- Session intensity classification ---
  const teamAvgTrimp = Math.round(playerMetrics.reduce((s, m) => s + m.trimp_score, 0) / playerMetrics.length);
  const teamAvgHr = Math.round(playerMetrics.reduce((s, m) => s + m.hr_avg, 0) / playerMetrics.length);
  const teamAvgHrMax = Math.round(Math.max(...playerMetrics.map(m => m.hr_max)));
  const teamAvgZ45 = Math.round(playerMetrics.reduce((s, m) => s + m.hr_zone_4_pct + m.hr_zone_5_pct, 0) / playerMetrics.length);
  const intensity = classifyIntensity(teamAvgTrimp);

  lines.push("");
  lines.push(`--- SESSION CLASSIFICATION: ${intensity.toUpperCase()} ---`);
  lines.push(`Team Avg TRIMP: ${teamAvgTrimp} | Avg HR: ${teamAvgHr} bpm | Peak HR: ${teamAvgHrMax} bpm | Avg Z4+Z5: ${teamAvgZ45}%`);

  // Expected vs actual for session type
  const expectedTrimp: Record<string, [number, number]> = {
    match: [130, 170], "match prep": [100, 140], tactical: [100, 140],
    technical: [70, 100], recovery: [30, 50], fitness: [110, 150],
    friendly: [110, 150],
  };
  const sessionTypeLower = session.type?.toLowerCase() ?? "";
  const expected = expectedTrimp[sessionTypeLower] ?? expectedTrimp["technical"];
  const withinExpected = teamAvgTrimp >= expected[0] && teamAvgTrimp <= expected[1];
  lines.push(`Expected TRIMP for ${session.type}: ${expected[0]}-${expected[1]} — Actual: ${teamAvgTrimp} (${withinExpected ? "WITHIN RANGE" : teamAvgTrimp < expected[0] ? "BELOW EXPECTED" : "ABOVE EXPECTED"})`);

  // --- Comparison to recent sessions ---
  if (recentSessionAverages && recentSessionAverages.count > 0) {
    const trimpDiff = teamAvgTrimp - recentSessionAverages.avgTrimp;
    const hrDiff = teamAvgHr - recentSessionAverages.avgHr;
    lines.push("");
    lines.push(`--- VS LAST ${recentSessionAverages.count} SESSIONS ---`);
    lines.push(`TRIMP: ${teamAvgTrimp} vs avg ${recentSessionAverages.avgTrimp} (${trimpDiff > 0 ? "+" : ""}${trimpDiff}) — ${Math.abs(trimpDiff) > 20 ? "significant difference" : "within normal variation"}`);
    lines.push(`Avg HR: ${teamAvgHr} vs avg ${recentSessionAverages.avgHr} (${hrDiff > 0 ? "+" : ""}${hrDiff})`);
  }

  // --- Zone distribution ---
  const avgZ1 = Math.round(playerMetrics.reduce((s, m) => s + m.hr_zone_1_pct, 0) / playerMetrics.length);
  const avgZ2 = Math.round(playerMetrics.reduce((s, m) => s + m.hr_zone_2_pct, 0) / playerMetrics.length);
  const avgZ3 = Math.round(playerMetrics.reduce((s, m) => s + m.hr_zone_3_pct, 0) / playerMetrics.length);
  const avgZ4 = Math.round(playerMetrics.reduce((s, m) => s + m.hr_zone_4_pct, 0) / playerMetrics.length);
  const avgZ5 = Math.round(playerMetrics.reduce((s, m) => s + m.hr_zone_5_pct, 0) / playerMetrics.length);
  lines.push(`Team Zone Distribution: Z1 ${avgZ1}% | Z2 ${avgZ2}% | Z3 ${avgZ3}% | Z4 ${avgZ4}% | Z5 ${avgZ5}%`);

  // --- Per-player data ---
  lines.push("");
  lines.push(`--- PER-PLAYER METRICS (${playerMetrics.length} players) ---`);
  const sorted = [...playerMetrics].sort((a, b) => b.trimp_score - a.trimp_score);
  for (const m of sorted) {
    const cv = cvMetrics.find(c => c.player_id === m.player_id);
    let line = `#${m.jersey_number} ${m.name} (${m.position}): TRIMP ${Math.round(m.trimp_score)}, HR avg ${m.hr_avg}/max ${m.hr_max}, Z4+Z5 ${Math.round(m.hr_zone_4_pct + m.hr_zone_5_pct)}%`;
    if (m.hr_recovery_60s !== null) line += `, HRR60 ${m.hr_recovery_60s} bpm`;
    if (cv) line += `, Dist ${cv.total_distance_m}m, Sprints ${cv.sprint_count}, MaxSpd ${cv.max_speed_kmh.toFixed(1)}km/h`;
    lines.push(line);
  }

  // --- Top/Bottom performers ---
  // Compute each player's TRIMP relative to team average for this session
  lines.push("");
  lines.push(`--- TOP 3 PERFORMERS (highest TRIMP relative to team avg) ---`);
  const trimpSorted = [...playerMetrics].sort((a, b) => b.trimp_score - a.trimp_score);
  for (const m of trimpSorted.slice(0, 3)) {
    const diff = Math.round(m.trimp_score - teamAvgTrimp);
    lines.push(`#${m.jersey_number} ${m.name}: TRIMP ${Math.round(m.trimp_score)} (+${diff} vs team avg) — ${diff > 30 ? "significantly above team" : "above team average"}`);
  }

  lines.push("");
  lines.push(`--- BOTTOM 3 PERFORMERS (lowest TRIMP relative to team avg) ---`);
  for (const m of trimpSorted.slice(-3).reverse()) {
    const diff = Math.round(m.trimp_score - teamAvgTrimp);
    lines.push(`#${m.jersey_number} ${m.name}: TRIMP ${Math.round(m.trimp_score)} (${diff} vs team avg) — ${Math.abs(diff) > 30 ? "significantly below team — check for illness, monitor, or tactical role" : "below team average"}`);
  }

  // --- ACWR alerts ---
  if (loadRecords.length > 0) {
    const atRisk = loadRecords.filter(l => l.risk_flag === "amber" || l.risk_flag === "red");
    if (atRisk.length > 0) {
      lines.push("");
      lines.push(`--- LOAD ALERTS (${atRisk.length} players with elevated ACWR) ---`);
      for (const l of atRisk) {
        lines.push(`#${l.jersey_number} ${l.name}: ACWR ${l.acwr_ratio.toFixed(2)} (${l.risk_flag.toUpperCase()}) — ${l.risk_flag === "red" ? "MUST reduce load in next session" : "monitor closely, consider reduced intensity"}`);
      }
    }

    // Players with unusually low HR (possible monitor issue or illness)
    const lowHrPlayers = playerMetrics.filter(m => m.hr_avg < teamAvgHr * 0.75);
    if (lowHrPlayers.length > 0) {
      lines.push("");
      lines.push(`--- UNUSUAL HR PATTERNS ---`);
      for (const m of lowHrPlayers) {
        lines.push(`#${m.jersey_number} ${m.name}: HR avg ${m.hr_avg} is ${Math.round((1 - m.hr_avg / teamAvgHr) * 100)}% below team avg — possible monitor malfunction or illness. Check with player.`);
      }
    }
  }

  // --- Tactical data ---
  if (tactical) {
    lines.push("");
    lines.push(`--- TACTICAL METRICS ---`);
    if (tactical.avg_formation) lines.push(`Formation: ${tactical.avg_formation}`);
    if (tactical.possession_pct) lines.push(`Possession: ${tactical.possession_pct}%`);
    if (tactical.pressing_intensity) lines.push(`Pressing Intensity (PPDA): ${tactical.pressing_intensity} — ${tactical.pressing_intensity < 8 ? "aggressive press" : tactical.pressing_intensity < 12 ? "moderate press" : "conservative/deep block"}`);
    if (tactical.compactness_avg) lines.push(`Compactness: ${tactical.compactness_avg}m`);
    if (tactical.transition_speed_atk_s) lines.push(`Transition ATK: ${tactical.transition_speed_atk_s}s | Transition DEF: ${tactical.transition_speed_def_s}s`);
  }

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// ENRICH SQUAD CONTEXT
// ---------------------------------------------------------------------------

/**
 * Takes full squad data and returns an enriched context string for team-level
 * analysis including fitness distribution, load trends, and position-group summaries.
 */
export function enrichSquadContext(
  players: PlayerRow[],
  allMetrics: WearableMetricRow[],
  allCvMetrics: CvMetricRow[],
  allLoadRecords: LoadRecordRow[],
  sessions: SessionRow[],
  tactical: TacticalRow[]
): string {
  const lines: string[] = [];
  const playerMap = new Map(players.map(p => [p.id, p]));

  lines.push(`=== ENRICHED SQUAD CONTEXT ===`);
  lines.push(`Academy: The Maker Football Incubator, Cairo, Egypt`);
  lines.push(`Total Active Players: ${players.length}`);
  lines.push(`Date: ${new Date().toISOString().split("T")[0]}`);

  // --- Squad fitness distribution ---
  // Get latest load record per player
  const latestLoads = new Map<string, LoadRecordRow>();
  for (const l of allLoadRecords) {
    if (!latestLoads.has(l.player_id)) {
      latestLoads.set(l.player_id, l);
    }
  }

  let greenCount = 0, amberCount = 0, redCount = 0, blueCount = 0, unknownCount = 0;
  const redPlayers: string[] = [];
  const amberPlayers: string[] = [];

  for (const [playerId, load] of latestLoads) {
    const p = playerMap.get(playerId);
    if (!p) continue;
    switch (load.risk_flag) {
      case "green": greenCount++; break;
      case "amber":
        amberCount++;
        amberPlayers.push(`#${p.jersey_number} ${p.name} (ACWR ${load.acwr_ratio.toFixed(2)})`);
        break;
      case "red":
        redCount++;
        redPlayers.push(`#${p.jersey_number} ${p.name} (ACWR ${load.acwr_ratio.toFixed(2)})`);
        break;
      case "blue": blueCount++; break;
      default: unknownCount++; break;
    }
  }

  const playersWithData = latestLoads.size;
  const playersWithoutData = players.length - playersWithData;

  lines.push("");
  lines.push(`--- SQUAD FITNESS DISTRIBUTION ---`);
  lines.push(`GREEN (optimal 0.8-1.3): ${greenCount} players`);
  lines.push(`AMBER (caution 1.3-1.5): ${amberCount} players${amberPlayers.length > 0 ? " — " + amberPlayers.join(", ") : ""}`);
  lines.push(`RED (danger >1.5): ${redCount} players${redPlayers.length > 0 ? " — " + redPlayers.join(", ") : ""}`);
  lines.push(`BLUE (low load <0.8): ${blueCount} players`);
  if (playersWithoutData > 0) lines.push(`NO DATA: ${playersWithoutData} players (no recent load records)`);

  // --- Overall load trend ---
  if (allLoadRecords.length >= 10) {
    const recentLoads = allLoadRecords.slice(0, Math.ceil(allLoadRecords.length / 2));
    const olderLoads = allLoadRecords.slice(Math.ceil(allLoadRecords.length / 2));

    const recentAvgAcwr = recentLoads.reduce((s, l) => s + l.acwr_ratio, 0) / recentLoads.length;
    const olderAvgAcwr = olderLoads.reduce((s, l) => s + l.acwr_ratio, 0) / olderLoads.length;
    const acwrTrend = recentAvgAcwr - olderAvgAcwr;

    const recentRedCount = recentLoads.filter(l => l.risk_flag === "red" || l.risk_flag === "amber").length;
    const olderRedCount = olderLoads.filter(l => l.risk_flag === "red" || l.risk_flag === "amber").length;
    const riskTrendPct = recentLoads.length > 0 && olderLoads.length > 0
      ? ((recentRedCount / recentLoads.length) - (olderRedCount / olderLoads.length)) * 100
      : 0;

    lines.push("");
    lines.push(`--- OVERALL LOAD TREND ---`);
    lines.push(`Squad avg ACWR trend: ${acwrTrend > 0.05 ? "RISING" : acwrTrend < -0.05 ? "FALLING" : "STABLE"} (${acwrTrend > 0 ? "+" : ""}${acwrTrend.toFixed(2)} shift)`);
    lines.push(`Risk flag trend: ${riskTrendPct > 2 ? "MORE amber/red flags recently — team may be accumulating fatigue" : riskTrendPct < -2 ? "FEWER amber/red flags — team is recovering well" : "Stable risk distribution"}`);
  }

  // --- Position group summaries ---
  const groups: Record<string, { players: PlayerRow[]; metrics: WearableMetricRow[]; loads: LoadRecordRow[] }> = {};
  for (const p of players) {
    const grp = positionGroup(p.position);
    if (!groups[grp]) groups[grp] = { players: [], metrics: [], loads: [] };
    groups[grp].players.push(p);
  }
  for (const m of allMetrics) {
    const p = playerMap.get(m.player_id);
    if (!p) continue;
    const grp = positionGroup(p.position);
    if (groups[grp]) groups[grp].metrics.push(m);
  }
  for (const l of allLoadRecords) {
    const p = playerMap.get(l.player_id);
    if (!p) continue;
    const grp = positionGroup(p.position);
    if (groups[grp]) groups[grp].loads.push(l);
  }

  lines.push("");
  lines.push(`--- POSITION GROUP SUMMARIES ---`);
  let bestGroup = { name: "", avgTrimp: 0 };
  let weakestGroup = { name: "", avgTrimp: Infinity };

  for (const [grp, data] of Object.entries(groups)) {
    if (data.metrics.length === 0) continue;
    const avgTrimp = Math.round(data.metrics.reduce((s, m) => s + m.trimp_score, 0) / data.metrics.length);
    const avgAcwr = data.loads.length > 0
      ? (data.loads.reduce((s, l) => s + l.acwr_ratio, 0) / data.loads.length).toFixed(2)
      : "N/A";
    const atRisk = data.loads.filter(l => l.risk_flag === "amber" || l.risk_flag === "red").length;

    lines.push(`${grp} (${data.players.length} players): Avg TRIMP ${avgTrimp}, Avg ACWR ${avgAcwr}, At-risk records: ${atRisk}`);

    if (avgTrimp > bestGroup.avgTrimp) bestGroup = { name: grp, avgTrimp };
    if (avgTrimp < weakestGroup.avgTrimp) weakestGroup = { name: grp, avgTrimp };
  }
  if (bestGroup.name) lines.push(`Highest load group: ${bestGroup.name} (avg TRIMP ${bestGroup.avgTrimp})`);
  if (weakestGroup.name && weakestGroup.avgTrimp < Infinity) lines.push(`Lowest load group: ${weakestGroup.name} (avg TRIMP ${weakestGroup.avgTrimp})`);

  // --- Per-player latest status ---
  lines.push("");
  lines.push(`--- PER-PLAYER LATEST STATUS ---`);

  // Get latest metric per player
  const latestMetrics = new Map<string, WearableMetricRow>();
  for (const m of allMetrics) {
    if (!latestMetrics.has(m.player_id)) {
      latestMetrics.set(m.player_id, m);
    }
  }

  // Get latest CV metric per player
  const latestCv = new Map<string, CvMetricRow>();
  for (const c of allCvMetrics) {
    if (!latestCv.has(c.player_id)) {
      latestCv.set(c.player_id, c);
    }
  }

  for (const p of players) {
    const load = latestLoads.get(p.id);
    const metric = latestMetrics.get(p.id);
    const cv = latestCv.get(p.id);

    let line = `#${p.jersey_number} ${p.name} (${p.position})`;
    if (load) line += ` | ACWR ${load.acwr_ratio.toFixed(2)} (${load.risk_flag})`;
    if (metric) {
      line += ` | TRIMP ${Math.round(metric.trimp_score)}, HR ${metric.hr_avg}/${metric.hr_max}`;
      if (metric.hr_recovery_60s !== null) line += `, HRR60 ${metric.hr_recovery_60s}`;
    }
    if (cv) line += ` | Dist ${cv.total_distance_m}m, Sprints ${cv.sprint_count}`;
    lines.push(line);
  }

  // --- Session history ---
  if (sessions.length > 0) {
    lines.push("");
    lines.push(`--- RECENT SESSIONS (${sessions.length}) ---`);
    for (const s of sessions.slice(0, 10)) {
      const sessionMetrics = allMetrics.filter(m => m.session_id === s.id);
      const avgTrimp = sessionMetrics.length > 0
        ? Math.round(sessionMetrics.reduce((sum, m) => sum + m.trimp_score, 0) / sessionMetrics.length)
        : null;
      const tac = tactical.find(t => t.session_id === s.id);

      let line = `${s.date} | ${s.type} | ${s.duration_minutes ?? "?"}min | ${sessionMetrics.length} players`;
      if (avgTrimp) line += ` | Avg TRIMP ${avgTrimp}`;
      if (tac?.avg_formation) line += ` | ${tac.avg_formation}`;
      if (tac?.possession_pct) line += ` | Poss ${tac.possession_pct}%`;
      if (s.notes) line += ` | "${s.notes}"`;
      lines.push(line);
    }
  }

  // --- Tactical trends ---
  if (tactical.length > 0) {
    lines.push("");
    lines.push(`--- TACTICAL TRENDS ---`);
    const avgPossession = tactical.filter(t => t.possession_pct).reduce((s, t) => s + (t.possession_pct ?? 0), 0) / tactical.filter(t => t.possession_pct).length || 0;
    const avgPPDA = tactical.filter(t => t.pressing_intensity).reduce((s, t) => s + (t.pressing_intensity ?? 0), 0) / tactical.filter(t => t.pressing_intensity).length || 0;
    if (avgPossession > 0) lines.push(`Avg Possession: ${avgPossession.toFixed(0)}%`);
    if (avgPPDA > 0) lines.push(`Avg PPDA: ${avgPPDA.toFixed(1)}`);
    const formations = tactical.filter(t => t.avg_formation).map(t => t.avg_formation);
    if (formations.length > 0) {
      const formationCounts: Record<string, number> = {};
      for (const f of formations) formationCounts[f!] = (formationCounts[f!] ?? 0) + 1;
      const mostUsed = Object.entries(formationCounts).sort((a, b) => b[1] - a[1])[0];
      lines.push(`Most used formation: ${mostUsed[0]} (${mostUsed[1]} sessions)`);
    }
  }

  return lines.join("\n");
}
