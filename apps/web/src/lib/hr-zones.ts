/**
 * HR zone calculation for youth football players.
 * Uses Tanaka formula: HRmax = 208 - (0.7 * age)
 * Falls back to measured HRmax if available.
 */

export type HrZone = 1 | 2 | 3 | 4 | 5;

export interface HrZoneThresholds {
  zone1Max: number; // <60% HRmax (recovery)
  zone2Max: number; // 60-70% (aerobic)
  zone3Max: number; // 70-80% (tempo)
  zone4Max: number; // 80-90% (threshold)
  zone5Min: number; // >90% (anaerobic)
  hrMax: number;
}

export function estimateHrMax(ageYears: number): number {
  return Math.round(208 - 0.7 * ageYears);
}

export function getHrZoneThresholds(
  hrMax: number
): HrZoneThresholds {
  return {
    zone1Max: Math.round(hrMax * 0.6),
    zone2Max: Math.round(hrMax * 0.7),
    zone3Max: Math.round(hrMax * 0.8),
    zone4Max: Math.round(hrMax * 0.9),
    zone5Min: Math.round(hrMax * 0.9),
    hrMax,
  };
}

export function getHrZone(hr: number, hrMax: number): HrZone {
  const pct = hr / hrMax;
  if (pct < 0.6) return 1;
  if (pct < 0.7) return 2;
  if (pct < 0.8) return 3;
  if (pct < 0.9) return 4;
  return 5;
}

export const HR_ZONE_COLORS: Record<HrZone, string> = {
  1: "#3b82f6", // blue — recovery
  2: "#22c55e", // green — aerobic
  3: "#eab308", // yellow — tempo
  4: "#f97316", // orange — threshold
  5: "#ef4444", // red — anaerobic
};

export const HR_ZONE_LABELS: Record<HrZone, string> = {
  1: "Recovery",
  2: "Aerobic",
  3: "Tempo",
  4: "Threshold",
  5: "Anaerobic",
};
