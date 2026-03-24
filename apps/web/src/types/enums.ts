export const SessionType = {
  TRAINING: "training",
  MATCH: "match",
  FRIENDLY: "friendly",
  RECOVERY: "recovery",
} as const;
export type SessionType = (typeof SessionType)[keyof typeof SessionType];

export const UserRole = {
  COACH: "coach",
  ANALYST: "analyst",
  DIRECTOR: "director",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const PlayerStatus = {
  ACTIVE: "active",
  INJURED: "injured",
  INACTIVE: "inactive",
} as const;
export type PlayerStatus = (typeof PlayerStatus)[keyof typeof PlayerStatus];

export const PlayerPosition = {
  GK: "GK",
  CB: "CB",
  FB: "FB",
  CM: "CM",
  CAM: "CAM",
  W: "W",
  ST: "ST",
} as const;
export type PlayerPosition =
  (typeof PlayerPosition)[keyof typeof PlayerPosition];

export const DominantFoot = {
  LEFT: "left",
  RIGHT: "right",
  BOTH: "both",
} as const;
export type DominantFoot = (typeof DominantFoot)[keyof typeof DominantFoot];

export const AgeGroup = {
  U14_2010: "2010",
  U12_2012: "2012",
  U11_2013: "2013",
} as const;
export type AgeGroup = (typeof AgeGroup)[keyof typeof AgeGroup];

export const VideoSourceType = {
  VEO_LINK: "veo_link",
  UPLOADED_MP4: "uploaded_mp4",
  OTHER_LINK: "other_link",
} as const;
export type VideoSourceType =
  (typeof VideoSourceType)[keyof typeof VideoSourceType];

export const ProcessingStatus = {
  LINKED: "linked",
  UPLOADED: "uploaded",
  QUEUED: "queued",
  PROCESSING: "processing",
  COMPLETE: "complete",
  FAILED: "failed",
} as const;
export type ProcessingStatus =
  (typeof ProcessingStatus)[keyof typeof ProcessingStatus];

export const VideoTagType = {
  GOAL: "goal",
  SPRINT: "sprint",
  PRESS: "press",
  DRIBBLE: "dribble",
  PASS: "pass",
  TACKLE: "tackle",
  CUSTOM: "custom",
} as const;
export type VideoTagType = (typeof VideoTagType)[keyof typeof VideoTagType];

export const CvEventType = {
  SPRINT: "sprint",
  DECELERATION: "deceleration",
  PRESSING_TRIGGER: "pressing_trigger",
  SHOT: "shot",
  GOAL: "goal",
  FORMATION_SHIFT: "formation_shift",
} as const;
export type CvEventType = (typeof CvEventType)[keyof typeof CvEventType];

export const DeviceType = {
  MAGENE_H303: "magene_h303",
  POLAR_VERITY_SENSE: "polar_verity_sense",
} as const;
export type DeviceType = (typeof DeviceType)[keyof typeof DeviceType];

export const RiskFlag = {
  BLUE: "blue",
  GREEN: "green",
  AMBER: "amber",
  RED: "red",
} as const;
export type RiskFlag = (typeof RiskFlag)[keyof typeof RiskFlag];

export const ReportType = {
  SESSION_CARD: "session_card",
  FATIGUE_ALERT: "fatigue_alert",
  COMPARISON: "comparison",
  TACTICAL: "tactical",
  HIGHLIGHT_REEL: "highlight_reel",
  NL_QUERY_RESPONSE: "nl_query_response",
  DEVELOPMENT: "development",
} as const;
export type ReportType = (typeof ReportType)[keyof typeof ReportType];

export const HighlightStatus = {
  DRAFT: "draft",
  APPROVED: "approved",
  SHARED: "shared",
} as const;
export type HighlightStatus =
  (typeof HighlightStatus)[keyof typeof HighlightStatus];

export const TrackIdentifiedBy = {
  MANUAL: "manual",
  OCR: "ocr",
} as const;
export type TrackIdentifiedBy =
  (typeof TrackIdentifiedBy)[keyof typeof TrackIdentifiedBy];

export const BaselinePeriod = {
  DAYS_7: "7d",
  DAYS_14: "14d",
  DAYS_28: "28d",
} as const;
export type BaselinePeriod =
  (typeof BaselinePeriod)[keyof typeof BaselinePeriod];

export const DevelopmentTrend = {
  IMPROVING: "improving",
  STABLE: "stable",
  DECLINING: "declining",
} as const;
export type DevelopmentTrend =
  (typeof DevelopmentTrend)[keyof typeof DevelopmentTrend];

export const QuerySource = {
  WEB_APP: "web_app",
  WHATSAPP: "whatsapp",
} as const;
export type QuerySource = (typeof QuerySource)[keyof typeof QuerySource];

export const HighlightGeneratedBy = {
  AI: "ai",
  COACH: "coach",
} as const;
export type HighlightGeneratedBy =
  (typeof HighlightGeneratedBy)[keyof typeof HighlightGeneratedBy];

export const Location = {
  OCTOBER: "October",
  NEW_CAIRO: "New Cairo",
  MAADI: "Maadi",
  HQ: "HQ",
} as const;
export type Location = (typeof Location)[keyof typeof Location];
