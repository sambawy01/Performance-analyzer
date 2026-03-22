export type SessionIntensity = "high" | "medium" | "low" | "recovery" | "match";

export type SessionType = "training" | "match" | "recovery" | "rest";

export interface PlannedSession {
  id?: string;
  date: string;
  type: SessionType;
  intensity: SessionIntensity;
  duration: number;
  location: string;
  time: string;
  focus: string;
  restPlayers: Array<{ jerseyNumber: number; name: string; reason: string }>;
  notes: string;
  aiGenerated?: boolean;
  availablePlayers?: number;
  predictedReadiness?: number;
}

export interface WeekPlan {
  days: PlannedSession[];
  summary: string;
  totalLoad: number;
  sessionsPlanned: number;
  playersNeedingRest: Array<{ jerseyNumber: number; name: string; reason: string }>;
  predictedEndOfWeekACWR: number;
  aiCommentary: string;
}

export const INTENSITY_COLORS: Record<SessionIntensity, string> = {
  high: "#ff3355",
  medium: "#ff6b35",
  low: "#00ff88",
  recovery: "#00d4ff",
  match: "#a855f7",
};

export const INTENSITY_LABELS: Record<SessionIntensity, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
  recovery: "Recovery",
  match: "Match",
};
