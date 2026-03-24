/**
 * Data validation and calculation utilities for session metrics.
 */

export function validateHR(
  avg: number,
  max: number
): { valid: boolean; error?: string } {
  if (avg < 40 || avg > 220) {
    return { valid: false, error: "HR average must be between 40 and 220 bpm" };
  }
  if (max < 40 || max > 220) {
    return { valid: false, error: "HR max must be between 40 and 220 bpm" };
  }
  if (avg > max) {
    return { valid: false, error: "HR average cannot exceed HR max" };
  }
  return { valid: true };
}

export function validateTRIMP(
  trimp: number
): { valid: boolean; error?: string } {
  if (trimp < 0) {
    return { valid: false, error: "TRIMP cannot be negative" };
  }
  if (trimp > 1000) {
    return {
      valid: false,
      error: "TRIMP exceeds realistic maximum (1000). Check inputs.",
    };
  }
  return { valid: true };
}

/**
 * Modified Banister TRIMP calculation.
 * duration: session duration in minutes
 * hrAvg: average heart rate during session
 * hrMax: maximum heart rate during session
 * hrRest: resting heart rate (defaults to 60 for youth athletes)
 */
export function calculateTRIMP(
  duration: number,
  hrAvg: number,
  hrMax: number,
  hrRest: number = 60
): number {
  if (hrMax <= hrRest) return 0;
  const ratio = (hrAvg - hrRest) / (hrMax - hrRest);
  const factor = 1.67; // Male youth approximation
  const trimp = duration * ratio * factor;
  return Math.round(Math.max(0, trimp) * 10) / 10;
}

/**
 * Calculate Acute:Chronic Workload Ratio.
 * recentLoads: array of daily load values for the acute period (typically 7 days)
 * chronicLoads: array of daily load values for the chronic period (typically 28 days)
 */
export function calculateACWR(
  recentLoads: number[],
  chronicLoads: number[]
): number {
  const acuteAvg =
    recentLoads.length > 0
      ? recentLoads.reduce((a, b) => a + b, 0) / recentLoads.length
      : 0;
  const chronicAvg =
    chronicLoads.length > 0
      ? chronicLoads.reduce((a, b) => a + b, 0) / chronicLoads.length
      : 0;

  if (chronicAvg === 0) return 0;
  return Math.round((acuteAvg / chronicAvg) * 100) / 100;
}

/**
 * Determine risk flag from ACWR value.
 * blue: < 0.8 (under-training)
 * green: 0.8 - 1.3 (optimal)
 * amber: 1.3 - 1.5 (caution)
 * red: > 1.5 (danger)
 */
export function getRiskFlag(
  acwr: number
): "blue" | "green" | "amber" | "red" {
  if (acwr < 0.8) return "blue";
  if (acwr <= 1.3) return "green";
  if (acwr <= 1.5) return "amber";
  return "red";
}
