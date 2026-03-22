export interface Academy {
  id: string;
  name: string;
  country: string;
  created_at: string;
}

export interface User {
  id: string;
  academy_id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  age_groups_visible: string[];
  notification_preferences: Record<string, boolean> | null;
  auth_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Player {
  id: string;
  academy_id: string;
  name: string;
  dob: string;
  position: string;
  jersey_number: number;
  age_group: string;
  height_cm: number | null;
  weight_kg: number | null;
  dominant_foot: string;
  photo_url: string | null;
  hr_max_measured: number | null;
  status: string;
  consent_status: string;
  consent_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  academy_id: string;
  date: string;
  type: string;
  location: string;
  duration_minutes: number;
  age_group: string;
  weather_conditions: string | null;
  coach_id: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Video {
  id: string;
  session_id: string;
  source_type: string;
  source_url: string | null;
  file_url: string | null;
  duration_seconds: number | null;
  resolution: string | null;
  fps: number | null;
  processing_status: string;
  homography_matrix: Record<string, unknown> | null;
  processed_at: string | null;
  thumbnail_url: string | null;
  error_message: string | null;
  created_at: string;
}

export interface VideoTag {
  id: string;
  video_id: string;
  player_id: string;
  timestamp_start: number;
  timestamp_end: number;
  tag_type: string;
  label: string | null;
  tagged_by: string;
  created_at: string;
}

export interface CvTrack {
  id: string;
  video_id: string;
  player_id: string | null;
  track_data: Array<{ frame: number; x: number; y: number; confidence: number }>;
  jersey_number_detected: number | null;
  identified_by: string | null;
  created_at: string;
}

export interface CvEvent {
  id: string;
  video_id: string;
  player_id: string;
  event_type: string;
  start_frame: number;
  end_frame: number;
  start_time: number;
  end_time: number;
  metadata: Record<string, unknown>;
  clip_url: string | null;
  created_at: string;
}

export interface WearableSession {
  id: string;
  session_id: string;
  player_id: string;
  device_type: string;
  device_id: string;
  started_at: string;
  ended_at: string | null;
  hr_stream: Array<{ timestamp_ms: number; hr: number }> | null;
}

export interface WearableMetrics {
  id: string;
  wearable_session_id: string;
  player_id: string;
  session_id: string;
  hr_avg: number;
  hr_max: number;
  hr_min: number;
  hr_zone_1_pct: number;
  hr_zone_2_pct: number;
  hr_zone_3_pct: number;
  hr_zone_4_pct: number;
  hr_zone_5_pct: number;
  hr_recovery_60s: number | null;
  trimp_score: number;
  session_rpe: number | null;
  calories_estimated: number | null;
  created_at: string;
}

export interface CvMetrics {
  id: string;
  video_id: string;
  player_id: string;
  session_id: string;
  total_distance_m: number;
  distance_per_min: number;
  max_speed_kmh: number;
  avg_speed_kmh: number;
  sprint_count: number;
  sprint_distance_m: number;
  high_speed_run_count: number;
  high_speed_run_distance_m: number;
  accel_events: number;
  decel_events: number;
  heatmap_data: Record<string, unknown>;
  avg_position_x: number;
  avg_position_y: number;
  time_in_zones: Record<string, number>;
  off_ball_movement_score: number | null;
  created_at: string;
}

export interface TacticalMetrics {
  id: string;
  session_id: string;
  avg_formation: string | null;
  compactness_avg: number | null;
  compactness_std: number | null;
  defensive_line_height_avg: number | null;
  team_width_avg: number | null;
  team_length_avg: number | null;
  pressing_intensity: number | null;
  transition_speed_atk_s: number | null;
  transition_speed_def_s: number | null;
  possession_pct: number | null;
  formation_snapshots: Record<string, unknown> | null;
  created_at: string;
}

export interface PlayerBaseline {
  id: string;
  player_id: string;
  period: string;
  avg_distance_m: number | null;
  avg_max_speed_kmh: number | null;
  avg_sprint_count: number | null;
  avg_hr: number | null;
  avg_trimp: number | null;
  avg_decel_events: number | null;
  calculated_at: string;
}

export interface LoadRecord {
  id: string;
  player_id: string;
  session_id: string;
  date: string;
  daily_load: number;
  acute_load_7d: number;
  chronic_load_28d: number;
  acwr_ratio: number;
  risk_flag: string;
  created_at: string;
}

export interface AiReport {
  id: string;
  session_id: string | null;
  player_id: string | null;
  report_type: string;
  prompt_used: string;
  response: Record<string, unknown>;
  model_used: string;
  tokens_used: number;
  cost_usd: number;
  generated_at: string;
}

export interface AiQuery {
  id: string;
  user_id: string;
  query_text: string;
  generated_sql: string;
  result_data: Record<string, unknown>;
  ai_narrative: string;
  source: string;
  created_at: string;
}

export interface HighlightReel {
  id: string;
  session_id: string;
  player_id: string | null;
  clips: Array<{
    cv_event_id: string;
    start_time: number;
    end_time: number;
    label: string;
    significance_score: number;
  }>;
  status: string;
  generated_by: string;
  created_at: string;
}

export interface DevelopmentSnapshot {
  id: string;
  player_id: string;
  month: string;
  physical_score: number | null;
  tactical_score: number | null;
  workload_score: number | null;
  metrics_summary: Record<string, unknown>;
  ai_development_narrative: string | null;
  trend: string;
  benchmarks_vs_age_group: Record<string, unknown> | null;
  created_at: string;
}
