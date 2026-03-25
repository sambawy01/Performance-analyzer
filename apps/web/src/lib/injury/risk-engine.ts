/**
 * Coach M8 — Enhanced Injury Risk Computation Engine
 *
 * Pure computation functions — NO database access, NO side effects.
 * All functions take data in, return results out.
 *
 * Research citations throughout. Key references:
 * - Foster (1998): Monitoring training in athletes with reference to overtraining syndrome
 * - Gabbett (2016): The training-injury prevention paradox
 * - Blanch & Gabbett (2016): Has the athlete trained enough to return to play safely?
 * - Hulin et al. (2014): Spikes in acute workload are associated with increased injury risk
 * - Williams et al. (2017): EWMA better predicts injury risk than simple rolling averages
 * - Windt & Gabbett (2017): How do training and competition workloads relate to injury?
 * - Plews et al. (2013): HRV and training: monitoring training loads in athletes
 * - Saw et al. (2016): Monitoring athletic fatigue with wellness questionnaires
 *
 * ── SQL for wellness_checkins table (apply separately to Supabase) ──
 *
 * CREATE TABLE wellness_checkins (
 *   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *   player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
 *   date date NOT NULL,
 *   soreness int CHECK (soreness BETWEEN 1 AND 5),
 *   energy int CHECK (energy BETWEEN 1 AND 5),
 *   sleep_quality int CHECK (sleep_quality BETWEEN 1 AND 5),
 *   sleep_hours numeric(3,1),
 *   mood int CHECK (mood BETWEEN 1 AND 5),
 *   hrv_rmssd numeric(6,2),
 *   resting_hr int,
 *   notes text,
 *   created_at timestamptz DEFAULT now(),
 *   UNIQUE(player_id, date)
 * );
 *
 * CREATE INDEX idx_wellness_player_date ON wellness_checkins(player_id, date DESC);
 * ALTER TABLE wellness_checkins ENABLE ROW LEVEL SECURITY;
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface MonotonyResult {
  monotony: number;
  strain: number;
  weeklyLoad: number;
  risk: "low" | "moderate" | "high";
}

export interface CumulativeLoadResult {
  total: number;
  avgPerDay: number;
  risk: "low" | "moderate" | "high";
  threshold: number;
}

export interface EwmaAcwrResult {
  acwr: number;
  acute: number;
  chronic: number;
  risk: "low" | "moderate" | "high" | "critical";
}

export interface AsymmetryResult {
  score: number; // 0-100, where 0 = perfectly balanced
  direction: "left" | "right" | "balanced";
  risk: "low" | "moderate" | "high";
}

export interface RecoveryFactor {
  name: string;
  value: number;
  status: "good" | "warning" | "poor";
}

export interface RecoveryScoreResult {
  score: number; // 0-100
  factors: RecoveryFactor[];
  risk: "low" | "moderate" | "high";
}

export interface ContributingFactor {
  name: string;
  weight: number;
  value: number;
  contribution: number;
  status: "safe" | "caution" | "danger";
  recommendation: string;
}

export interface MultiFactorRiskResult {
  risk_score: number;
  risk_level: "low" | "moderate" | "high" | "critical";
  risk_color: string;
  contributing_factors: ContributingFactor[];
  overall_recommendation: string;
  predicted_risk_7d: number[];
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Training Monotony Index
// Reference: Foster (1998) — Monitoring training in athletes
//
// Monotony = mean daily load / standard deviation of daily load (7 days)
// Strain = weekly load x monotony
// High monotony (>2.0) indicates repetitive loading without variation,
// which increases both psychological staleness and soft-tissue injury risk.
// High strain (>6000) indicates dangerous combination of volume + monotony.
// ─────────────────────────────────────────────────────────────────────────────

export function computeMonotony(dailyLoads: number[]): MonotonyResult {
  // Need at least 3 days of data for meaningful computation
  if (dailyLoads.length < 3) {
    return { monotony: 0, strain: 0, weeklyLoad: 0, risk: "low" };
  }

  // Use last 7 days (pad with 0 if fewer)
  const loads = dailyLoads.slice(0, 7);
  while (loads.length < 7) loads.push(0);

  const weeklyLoad = loads.reduce((s, v) => s + v, 0);
  const mean = weeklyLoad / loads.length;

  // Standard deviation
  const variance =
    loads.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / loads.length;
  const stdDev = Math.sqrt(variance);

  // Avoid division by zero — if all days identical, monotony is effectively infinite
  const monotony = stdDev < 0.01 ? (mean > 0 ? 10 : 0) : mean / stdDev;
  const strain = weeklyLoad * monotony;

  // Risk classification (Foster 1998 thresholds)
  let risk: "low" | "moderate" | "high" = "low";
  if (monotony > 2.0 && strain > 6000) {
    risk = "high";
  } else if (monotony > 2.0 || strain > 4000) {
    risk = "moderate";
  }

  return {
    monotony: Math.round(monotony * 100) / 100,
    strain: Math.round(strain),
    weeklyLoad: Math.round(weeklyLoad),
    risk,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Cumulative 14-Day Load
// Reference: Windt & Gabbett (2017) — absolute load thresholds matter
//
// While ACWR captures relative load changes, absolute cumulative load
// over 14 days identifies when total volume exceeds tissue tolerance.
// Youth athletes (U14-U16) have lower thresholds than adults due to
// immature musculoskeletal structures and growth plate vulnerability.
// ─────────────────────────────────────────────────────────────────────────────

const AGE_GROUP_THRESHOLDS: Record<string, number> = {
  "2016": 1200, // U10 — very conservative
  "2015": 1400, // U11
  "2014": 1600, // U12
  "2013": 1800, // U13
  "2012": 2000, // U14
  "2011": 2200, // U15
  "2010": 2500, // U16
  default: 2500,
};

export function computeCumulativeLoad(
  dailyLoads14d: number[],
  ageGroup?: string
): CumulativeLoadResult {
  const loads = dailyLoads14d.slice(0, 14);
  const total = loads.reduce((s, v) => s + v, 0);
  const daysWithData = loads.filter((v) => v > 0).length || 1;
  const avgPerDay = total / daysWithData;
  const threshold =
    AGE_GROUP_THRESHOLDS[ageGroup ?? "default"] ??
    AGE_GROUP_THRESHOLDS["default"];

  let risk: "low" | "moderate" | "high" = "low";
  if (total > threshold) {
    risk = "high";
  } else if (total > threshold * 0.8) {
    risk = "moderate";
  }

  return {
    total: Math.round(total),
    avgPerDay: Math.round(avgPerDay),
    risk,
    threshold,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. EWMA-based ACWR
// Reference: Williams et al. (2017) — EWMA provides better injury risk
// prediction than simple rolling averages because it weights recent sessions
// more heavily, capturing rapid load changes that simple ACWR misses.
//
// EWMA formula:
//   EWMA_today = load_today * lambda + (1 - lambda) * EWMA_yesterday
//   lambda_acute = 2 / (7 + 1) = 0.25
//   lambda_chronic = 2 / (28 + 1) ≈ 0.069
// ─────────────────────────────────────────────────────────────────────────────

export function computeEWMA_ACWR(dailyLoads: number[]): EwmaAcwrResult {
  if (dailyLoads.length < 7) {
    return { acwr: 1.0, acute: 0, chronic: 0, risk: "low" };
  }

  const lambdaAcute = 2 / (7 + 1); // 0.25
  const lambdaChronic = 2 / (28 + 1); // ~0.069

  // Process oldest to newest
  const reversed = [...dailyLoads].reverse();

  let ewmaAcute = reversed[0];
  let ewmaChronic = reversed[0];

  for (let i = 1; i < reversed.length; i++) {
    ewmaAcute =
      reversed[i] * lambdaAcute + (1 - lambdaAcute) * ewmaAcute;
    ewmaChronic =
      reversed[i] * lambdaChronic + (1 - lambdaChronic) * ewmaChronic;
  }

  // Avoid division by zero
  const acwr = ewmaChronic < 1 ? 1.0 : ewmaAcute / ewmaChronic;

  // Risk classification (Gabbett 2016 + Blanch & Gabbett 2016)
  let risk: "low" | "moderate" | "high" | "critical" = "low";
  if (acwr > 1.5) risk = "critical";
  else if (acwr > 1.3) risk = "high";
  else if (acwr > 1.2 || acwr < 0.8) risk = "moderate";

  return {
    acwr: Math.round(acwr * 100) / 100,
    acute: Math.round(ewmaAcute),
    chronic: Math.round(ewmaChronic),
    risk,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Movement Asymmetry Score
// Derived from CV tracking data. Compares bilateral movement patterns.
//
// Left/right asymmetry in acceleration, deceleration, and sprint patterns
// is associated with compensatory movement and increased injury risk
// (particularly hamstring and groin injuries in football).
//
// We compute asymmetry from the position and action data by analyzing
// deviation from centre-field and action balance.
// ─────────────────────────────────────────────────────────────────────────────

export interface CvSessionData {
  avg_position_x: number;
  avg_position_y: number;
  sprint_count: number;
  accel_events: number;
  decel_events: number;
}

export function computeAsymmetryScore(
  cvSessions: CvSessionData[]
): AsymmetryResult {
  if (cvSessions.length < 2) {
    return { score: 0, direction: "balanced", risk: "low" };
  }

  // Positional asymmetry: deviation from centre-field (x ~ 50 assumed centre)
  // A player consistently drifting left or right suggests movement preference
  const avgX =
    cvSessions.reduce((s, c) => s + c.avg_position_x, 0) /
    cvSessions.length;
  const centreDeviation = Math.abs(avgX - 50); // distance from centre

  // Action asymmetry: compare accel vs decel balance across sessions
  // Healthy movement has roughly balanced accel/decel ratio
  // Large imbalance suggests one-directional compensation
  const totalAccel = cvSessions.reduce((s, c) => s + c.accel_events, 0);
  const totalDecel = cvSessions.reduce((s, c) => s + c.decel_events, 0);
  const actionTotal = totalAccel + totalDecel;
  const accelRatio = actionTotal > 0 ? totalAccel / actionTotal : 0.5;
  const actionImbalance = Math.abs(accelRatio - 0.5) * 2; // 0-1 scale

  // Sprint variability: high variance in sprint counts across sessions
  // suggests inconsistent movement patterns
  const sprintCounts = cvSessions.map((c) => c.sprint_count);
  const avgSprint =
    sprintCounts.reduce((s, v) => s + v, 0) / sprintCounts.length;
  const sprintVariance =
    sprintCounts.reduce((s, v) => s + Math.pow(v - avgSprint, 2), 0) /
    sprintCounts.length;
  const sprintCV = avgSprint > 0 ? Math.sqrt(sprintVariance) / avgSprint : 0;

  // Composite asymmetry score (0-100)
  // Weight: positional deviation 40%, action imbalance 35%, sprint variability 25%
  const posScore = Math.min(100, centreDeviation * 4); // 25 deviation = 100
  const actionScore = Math.min(100, actionImbalance * 200); // 0.5 imbalance = 100
  const sprintScore = Math.min(100, sprintCV * 200); // CV of 0.5 = 100

  const score = Math.round(
    posScore * 0.4 + actionScore * 0.35 + sprintScore * 0.25
  );

  const direction: "left" | "right" | "balanced" =
    centreDeviation < 5 ? "balanced" : avgX < 50 ? "left" : "right";

  let risk: "low" | "moderate" | "high" = "low";
  if (score > 40) risk = "high";
  else if (score > 20) risk = "moderate";

  return { score: Math.min(100, score), direction, risk };
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Sleep/Recovery Score
// Reference: Plews et al. (2013) — HRV as a training monitoring tool
// Reference: Saw et al. (2016) — Monitoring athlete fatigue via wellness
//
// Combines objective wearable data (HRV, resting HR, sleep duration)
// with subjective wellness questionnaire (soreness, energy, sleep quality).
// Each factor scored independently, then weighted into a 0-100 composite.
// ─────────────────────────────────────────────────────────────────────────────

export interface RecoveryInputData {
  hrv_rmssd?: number; // ms — higher is better
  hrv_baseline?: number; // personal 30-day average
  resting_hr?: number;
  resting_hr_baseline?: number;
  sleep_hours?: number;
  soreness?: number; // 1-5 (1=none, 5=severe)
  energy?: number; // 1-5 (1=exhausted, 5=high)
  sleep_quality?: number; // 1-5 (1=terrible, 5=great)
}

export function computeRecoveryScore(
  data: RecoveryInputData
): RecoveryScoreResult {
  const factors: RecoveryFactor[] = [];
  let totalWeight = 0;
  let weightedSum = 0;

  // 1. HRV RMSSD (weight: 25 if available)
  // Plews et al. (2013): HRV below 85% of baseline indicates incomplete recovery
  if (data.hrv_rmssd != null && data.hrv_baseline != null && data.hrv_baseline > 0) {
    const hrvRatio = data.hrv_rmssd / data.hrv_baseline;
    let hrvScore: number;
    let status: "good" | "warning" | "poor";

    if (hrvRatio >= 0.95) {
      hrvScore = 100;
      status = "good";
    } else if (hrvRatio >= 0.85) {
      hrvScore = 70;
      status = "warning";
    } else if (hrvRatio >= 0.75) {
      hrvScore = 40;
      status = "warning";
    } else {
      hrvScore = 15;
      status = "poor";
    }

    factors.push({
      name: "HRV (RMSSD)",
      value: Math.round(data.hrv_rmssd * 10) / 10,
      status,
    });
    weightedSum += hrvScore * 25;
    totalWeight += 25;
  }

  // 2. Resting HR (weight: 15 if available)
  // Elevated resting HR above baseline signals sympathetic dominance / incomplete recovery
  if (data.resting_hr != null && data.resting_hr_baseline != null && data.resting_hr_baseline > 0) {
    const hrElevation = data.resting_hr - data.resting_hr_baseline;
    let hrScore: number;
    let status: "good" | "warning" | "poor";

    if (hrElevation <= 2) {
      hrScore = 100;
      status = "good";
    } else if (hrElevation <= 5) {
      hrScore = 65;
      status = "warning";
    } else if (hrElevation <= 10) {
      hrScore = 35;
      status = "warning";
    } else {
      hrScore = 10;
      status = "poor";
    }

    factors.push({
      name: "Resting HR",
      value: data.resting_hr,
      status,
    });
    weightedSum += hrScore * 15;
    totalWeight += 15;
  }

  // 3. Sleep Duration (weight: 20)
  // Youth athletes need 9-10 hours; <7 significantly impairs recovery
  if (data.sleep_hours != null) {
    let sleepScore: number;
    let status: "good" | "warning" | "poor";

    if (data.sleep_hours >= 9) {
      sleepScore = 100;
      status = "good";
    } else if (data.sleep_hours >= 8) {
      sleepScore = 80;
      status = "good";
    } else if (data.sleep_hours >= 7) {
      sleepScore = 55;
      status = "warning";
    } else if (data.sleep_hours >= 6) {
      sleepScore = 30;
      status = "poor";
    } else {
      sleepScore = 10;
      status = "poor";
    }

    factors.push({
      name: "Sleep Duration",
      value: data.sleep_hours,
      status,
    });
    weightedSum += sleepScore * 20;
    totalWeight += 20;
  }

  // 4. Soreness (weight: 15)
  // 1=none (best), 5=severe (worst)
  if (data.soreness != null) {
    const sorenessScore = Math.max(0, (5 - data.soreness) / 4) * 100;
    const status: "good" | "warning" | "poor" =
      data.soreness <= 2 ? "good" : data.soreness <= 3 ? "warning" : "poor";

    factors.push({ name: "Muscle Soreness", value: data.soreness, status });
    weightedSum += sorenessScore * 15;
    totalWeight += 15;
  }

  // 5. Energy Level (weight: 15)
  // 1=exhausted (worst), 5=high (best)
  if (data.energy != null) {
    const energyScore = Math.max(0, (data.energy - 1) / 4) * 100;
    const status: "good" | "warning" | "poor" =
      data.energy >= 4 ? "good" : data.energy >= 3 ? "warning" : "poor";

    factors.push({ name: "Energy Level", value: data.energy, status });
    weightedSum += energyScore * 15;
    totalWeight += 15;
  }

  // 6. Sleep Quality (weight: 10)
  // 1=terrible (worst), 5=great (best)
  if (data.sleep_quality != null) {
    const qualityScore = Math.max(0, (data.sleep_quality - 1) / 4) * 100;
    const status: "good" | "warning" | "poor" =
      data.sleep_quality >= 4
        ? "good"
        : data.sleep_quality >= 3
        ? "warning"
        : "poor";

    factors.push({
      name: "Sleep Quality",
      value: data.sleep_quality,
      status,
    });
    weightedSum += qualityScore * 10;
    totalWeight += 10;
  }

  // If no data at all, return neutral score
  if (totalWeight === 0) {
    return { score: 50, factors: [], risk: "low" };
  }

  const score = Math.round(weightedSum / totalWeight);

  let risk: "low" | "moderate" | "high" = "low";
  if (score < 40) risk = "high";
  else if (score < 60) risk = "moderate";

  return { score, factors, risk };
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Multi-Factor Risk Model — THE MAIN ENGINE
//
// Combines all individual risk factors into a composite 0-100 score.
// This is a weighted additive model where each factor contributes
// independently to the total risk.
//
// Factor weights:
//   ACWR status:          20%
//   Recovery/HRV score:   20%
//   Monotony + Strain:    15%
//   Cumulative 14d load:  10%
//   HR Recovery trend:    10%
//   Asymmetry score:      10%
//   High intensity ratio: 10%
//   Days since rest:       5%
//
// Each factor is normalized to a 0-100 risk contribution, then weighted.
// The final score is clamped to 0-100.
// ─────────────────────────────────────────────────────────────────────────────

export interface MultiFactorInput {
  acwr: number;
  acwr_trend: "rising" | "stable" | "falling";
  hr_recovery: number | null; // bpm/60s
  hr_recovery_trend: "improving" | "stable" | "declining" | null;
  monotony: number;
  strain: number;
  cumulative_14d: number;
  cumulative_threshold: number;
  asymmetry_score: number;
  recovery_score: number | null; // 0-100 from wellness data
  high_intensity_ratio: number; // % of time in Z4+Z5
  days_since_rest: number;
  age_group: string;
}

export function computeMultiFactorRisk(
  factors: MultiFactorInput
): MultiFactorRiskResult {
  const contributing: ContributingFactor[] = [];

  // ── 1. ACWR (20%) ──
  let acwrRisk = 0;
  if (factors.acwr > 1.5) acwrRisk = 100;
  else if (factors.acwr > 1.3) acwrRisk = 70;
  else if (factors.acwr > 1.2) acwrRisk = 40;
  else if (factors.acwr >= 0.8) acwrRisk = 10;
  else if (factors.acwr >= 0.5) acwrRisk = 45; // under-training risk
  else acwrRisk = 60; // severely deconditioned

  // Trend modifier: rising ACWR adds risk
  if (factors.acwr_trend === "rising" && factors.acwr > 1.1) acwrRisk = Math.min(100, acwrRisk + 15);
  if (factors.acwr_trend === "falling" && factors.acwr > 1.3) acwrRisk = Math.max(0, acwrRisk - 10);

  const acwrContrib = Math.round(acwrRisk * 0.2);
  contributing.push({
    name: "ACWR (Load Ratio)",
    weight: 0.2,
    value: factors.acwr,
    contribution: acwrContrib,
    status: acwrRisk > 60 ? "danger" : acwrRisk > 30 ? "caution" : "safe",
    recommendation:
      acwrRisk > 60
        ? "Reduce acute training load immediately. Cap sessions at 60 min with no Z5 work."
        : acwrRisk > 30
        ? "Monitor load progression. Ensure weekly increase stays under 10%."
        : "Load ratio is in the safe zone. Continue current progression.",
  });

  // ── 2. Recovery/HRV Score (20%) ──
  let recoveryRisk = 50; // default if no data
  if (factors.recovery_score != null) {
    // recovery_score is 0-100 where 100 = fully recovered
    // So risk = inverse
    recoveryRisk = 100 - factors.recovery_score;
  } else if (factors.hr_recovery != null) {
    // Fall back to HR recovery alone
    if (factors.hr_recovery >= 40) recoveryRisk = 10;
    else if (factors.hr_recovery >= 30) recoveryRisk = 30;
    else if (factors.hr_recovery >= 20) recoveryRisk = 55;
    else recoveryRisk = 80;
  }

  // HR recovery trend modifier
  if (factors.hr_recovery_trend === "declining") recoveryRisk = Math.min(100, recoveryRisk + 15);
  if (factors.hr_recovery_trend === "improving") recoveryRisk = Math.max(0, recoveryRisk - 10);

  const recoveryContrib = Math.round(recoveryRisk * 0.2);
  contributing.push({
    name: "Recovery & HRV",
    weight: 0.2,
    value: factors.recovery_score ?? (factors.hr_recovery ?? -1),
    contribution: recoveryContrib,
    status: recoveryRisk > 60 ? "danger" : recoveryRisk > 30 ? "caution" : "safe",
    recommendation:
      recoveryRisk > 60
        ? "Recovery is poor. Prioritize sleep (9+ hours), reduce intensity, and consider a rest day."
        : recoveryRisk > 30
        ? "Recovery is suboptimal. Monitor wellness and ensure adequate nutrition."
        : "Recovery markers are healthy. Maintain current recovery practices.",
  });

  // ── 3. Monotony + Strain (15%) ──
  let monotonyRisk = 0;
  if (factors.monotony > 2.0 && factors.strain > 6000) monotonyRisk = 100;
  else if (factors.monotony > 2.0 && factors.strain > 4000) monotonyRisk = 75;
  else if (factors.monotony > 2.0) monotonyRisk = 55;
  else if (factors.strain > 6000) monotonyRisk = 50;
  else if (factors.monotony > 1.5 || factors.strain > 4000) monotonyRisk = 30;
  else monotonyRisk = 10;

  const monotonyContrib = Math.round(monotonyRisk * 0.15);
  contributing.push({
    name: "Training Monotony",
    weight: 0.15,
    value: factors.monotony,
    contribution: monotonyContrib,
    status: monotonyRisk > 60 ? "danger" : monotonyRisk > 30 ? "caution" : "safe",
    recommendation:
      monotonyRisk > 60
        ? "Training is too repetitive. Vary session types, intensities, and recovery days (Foster 1998)."
        : monotonyRisk > 30
        ? "Consider adding more variation in session intensity and type."
        : "Good training variation. Continue alternating session intensities.",
  });

  // ── 4. Cumulative 14d Load (10%) ──
  const loadRatio = factors.cumulative_threshold > 0
    ? factors.cumulative_14d / factors.cumulative_threshold
    : 0;
  let cumulativeRisk = 0;
  if (loadRatio > 1.0) cumulativeRisk = 90;
  else if (loadRatio > 0.9) cumulativeRisk = 65;
  else if (loadRatio > 0.8) cumulativeRisk = 40;
  else cumulativeRisk = 10;

  const cumulativeContrib = Math.round(cumulativeRisk * 0.1);
  contributing.push({
    name: "Cumulative Load (14d)",
    weight: 0.1,
    value: factors.cumulative_14d,
    contribution: cumulativeContrib,
    status: cumulativeRisk > 60 ? "danger" : cumulativeRisk > 30 ? "caution" : "safe",
    recommendation:
      cumulativeRisk > 60
        ? `14-day load exceeds age-appropriate threshold (${factors.cumulative_threshold}). Mandatory load reduction this week.`
        : cumulativeRisk > 30
        ? `Approaching 14-day load limit. Monitor volume carefully.`
        : "Cumulative load is within safe limits for this age group.",
  });

  // ── 5. HR Recovery Trend (10%) ──
  let hrTrendRisk = 30; // default moderate if null
  if (factors.hr_recovery_trend === "declining") hrTrendRisk = 75;
  else if (factors.hr_recovery_trend === "stable") hrTrendRisk = 20;
  else if (factors.hr_recovery_trend === "improving") hrTrendRisk = 5;

  const hrTrendContrib = Math.round(hrTrendRisk * 0.1);
  contributing.push({
    name: "HR Recovery Trend",
    weight: 0.1,
    value: factors.hr_recovery ?? 0,
    contribution: hrTrendContrib,
    status: hrTrendRisk > 60 ? "danger" : hrTrendRisk > 30 ? "caution" : "safe",
    recommendation:
      hrTrendRisk > 60
        ? "HR recovery is declining — early sign of overreaching. Reduce load for 48-72h."
        : hrTrendRisk > 30
        ? "Monitor HR recovery closely over the next 3 sessions."
        : "HR recovery trend is positive — good autonomic adaptation.",
  });

  // ── 6. Asymmetry Score (10%) ──
  let asymmetryRisk = 0;
  if (factors.asymmetry_score > 40) asymmetryRisk = 80;
  else if (factors.asymmetry_score > 25) asymmetryRisk = 50;
  else if (factors.asymmetry_score > 15) asymmetryRisk = 25;
  else asymmetryRisk = 5;

  const asymmetryContrib = Math.round(asymmetryRisk * 0.1);
  contributing.push({
    name: "Movement Asymmetry",
    weight: 0.1,
    value: factors.asymmetry_score,
    contribution: asymmetryContrib,
    status: asymmetryRisk > 60 ? "danger" : asymmetryRisk > 30 ? "caution" : "safe",
    recommendation:
      asymmetryRisk > 60
        ? "Significant movement asymmetry detected. Recommend physio assessment and corrective exercises."
        : asymmetryRisk > 30
        ? "Mild asymmetry present. Monitor running gait and consider bilateral drills."
        : "Movement patterns appear balanced.",
  });

  // ── 7. High Intensity Ratio (10%) ──
  let intensityRisk = 0;
  if (factors.high_intensity_ratio > 35) intensityRisk = 85;
  else if (factors.high_intensity_ratio > 25) intensityRisk = 55;
  else if (factors.high_intensity_ratio > 15) intensityRisk = 20;
  else intensityRisk = 5;

  const intensityContrib = Math.round(intensityRisk * 0.1);
  contributing.push({
    name: "High Intensity Exposure",
    weight: 0.1,
    value: factors.high_intensity_ratio,
    contribution: intensityContrib,
    status: intensityRisk > 60 ? "danger" : intensityRisk > 30 ? "caution" : "safe",
    recommendation:
      intensityRisk > 60
        ? "Excessive Z4+Z5 exposure. Reduce high-intensity drills and add more Z2-Z3 base work."
        : intensityRisk > 30
        ? "High-intensity ratio is elevated. Ensure adequate recovery between hard sessions."
        : "High-intensity distribution is appropriate for youth training.",
  });

  // ── 8. Days Since Rest (5%) ──
  let restRisk = 0;
  if (factors.days_since_rest >= 6) restRisk = 90;
  else if (factors.days_since_rest >= 5) restRisk = 70;
  else if (factors.days_since_rest >= 4) restRisk = 45;
  else if (factors.days_since_rest >= 3) restRisk = 20;
  else restRisk = 5;

  const restContrib = Math.round(restRisk * 0.05);
  contributing.push({
    name: "Days Since Rest",
    weight: 0.05,
    value: factors.days_since_rest,
    contribution: restContrib,
    status: restRisk > 60 ? "danger" : restRisk > 30 ? "caution" : "safe",
    recommendation:
      restRisk > 60
        ? `${factors.days_since_rest} consecutive training days. Schedule a rest day immediately.`
        : restRisk > 30
        ? "Consider scheduling a recovery session within the next 48 hours."
        : "Rest frequency is adequate.",
  });

  // ── Age group modifier ──
  // Younger players are more vulnerable — apply a multiplier
  const birthYear = parseInt(factors.age_group);
  const approxAge = birthYear ? 2026 - birthYear : 14;
  let ageMultiplier = 1.0;
  if (approxAge <= 12) ageMultiplier = 1.2; // U12 — most vulnerable
  else if (approxAge <= 13) ageMultiplier = 1.15; // PHV window
  else if (approxAge <= 14) ageMultiplier = 1.1; // Late PHV

  // ── Total risk score ──
  const rawScore =
    acwrContrib +
    recoveryContrib +
    monotonyContrib +
    cumulativeContrib +
    hrTrendContrib +
    asymmetryContrib +
    intensityContrib +
    restContrib;

  const adjustedScore = Math.min(100, Math.round(rawScore * ageMultiplier));

  // ── Risk level classification ──
  let risk_level: "low" | "moderate" | "high" | "critical";
  let risk_color: string;
  if (adjustedScore >= 75) {
    risk_level = "critical";
    risk_color = "#ff3355";
  } else if (adjustedScore >= 50) {
    risk_level = "high";
    risk_color = "#ff6b35";
  } else if (adjustedScore >= 30) {
    risk_level = "moderate";
    risk_color = "#f59e0b";
  } else {
    risk_level = "low";
    risk_color = "#00ff88";
  }

  // ── Overall recommendation ──
  let overall_recommendation: string;
  if (risk_level === "critical") {
    overall_recommendation =
      "CRITICAL RISK: Remove from full training immediately. Recovery sessions only for 48-72h. Daily monitoring required before return to play.";
  } else if (risk_level === "high") {
    overall_recommendation =
      "HIGH RISK: Reduce training load by 30-40%. Cap sessions at 60 minutes, limit Z4+Z5 to <10%. Mandatory recovery session within 48h.";
  } else if (risk_level === "moderate") {
    overall_recommendation =
      "MODERATE RISK: Monitor closely. Ensure weekly load increase stays under 10%. Include 1 recovery day per 3 training days.";
  } else {
    overall_recommendation =
      "LOW RISK: Player is in a healthy load state. Continue progressive overload within safe parameters.";
  }

  // ── 7-Day Risk Projection ──
  // Extrapolate current risk trajectory assuming similar training continues
  const predicted_risk_7d: number[] = [];
  let projectedRisk = adjustedScore;

  for (let i = 0; i < 7; i++) {
    if (i === 0) {
      predicted_risk_7d.push(projectedRisk);
      continue;
    }

    // Base daily change depends on current risk factors
    let dailyChange = 0;

    // If ACWR is rising and already elevated, risk compounds
    if (factors.acwr_trend === "rising" && factors.acwr > 1.1) {
      dailyChange += 3;
    } else if (factors.acwr_trend === "falling") {
      dailyChange -= 2;
    }

    // High monotony accelerates risk
    if (factors.monotony > 2.0) dailyChange += 2;

    // Lack of rest compounds
    if (factors.days_since_rest + i >= 5) dailyChange += 2;

    // Declining recovery accelerates risk
    if (factors.hr_recovery_trend === "declining") dailyChange += 1;

    // High cumulative load adds pressure
    if (loadRatio > 0.9) dailyChange += 1;

    // Assume one rest day in the next 7 resets slightly
    if (i === 3 || i === 6) dailyChange -= 4; // simulated rest day

    projectedRisk = Math.min(100, Math.max(0, projectedRisk + dailyChange));
    predicted_risk_7d.push(Math.round(projectedRisk));
  }

  return {
    risk_score: adjustedScore,
    risk_level,
    risk_color,
    contributing_factors: contributing,
    overall_recommendation,
    predicted_risk_7d,
  };
}
