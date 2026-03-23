import { Star, Target } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { TalentSpotlight } from "@/components/scout/talent-spotlight";
import { ScoutReport } from "@/components/scout/scout-report";

export default async function ScoutPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get all players
  const { data: players } = await supabase
    .from("players")
    .select("id, name, jersey_number, position, age_group, dominant_foot, height_cm, weight_kg")
    .order("jersey_number");

  // Get latest wearable metrics per player (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: metrics } = await supabase
    .from("wearable_metrics")
    .select("player_id, hr_avg, hr_max, trimp_score, hr_zone_4_pct, hr_zone_5_pct, hr_recovery_60s, session_id");

  // Get sessions for date context
  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, date, type")
    .order("date", { ascending: false });

  const sessionMap = new Map((sessions ?? []).map((s: any) => [s.id, s]));

  // Get load records for injury risk
  const { data: loadRecords } = await supabase
    .from("load_records")
    .select("player_id, acwr_ratio, risk_flag")
    .order("week_start", { ascending: false });

  // Get CV metrics for position data
  const { data: cvMetrics } = await supabase
    .from("cv_metrics")
    .select("player_id, avg_speed_kmh, max_speed_kmh, distance_covered_m, sprint_count, heatmap_zones");

  // Build per-player aggregates
  const playerMap = new Map<string, any>();
  for (const p of players ?? []) {
    playerMap.set(p.id, {
      ...p,
      sessions: 0,
      matchSessions: 0,
      avgTrimp: 0,
      avgHr: 0,
      maxHr: 0,
      avgHighIntensity: 0,
      avgRecovery: 0,
      totalTrimp: 0,
      avgSpeed: 0,
      maxSpeed: 0,
      avgDistance: 0,
      sprintCount: 0,
      acwr: null as number | null,
      riskFlag: null as string | null,
      trimpScores: [] as number[],
      hrAvgs: [] as number[],
      highIntensities: [] as number[],
      recoveries: [] as number[],
      speeds: [] as number[],
      maxSpeeds: [] as number[],
      distances: [] as number[],
      sprints: [] as number[],
    });
  }

  // Aggregate wearable metrics
  for (const m of metrics ?? []) {
    const p = playerMap.get(m.player_id);
    if (!p) continue;
    p.sessions++;
    const session = sessionMap.get(m.session_id);
    if (session?.type === "match" || session?.type === "friendly") p.matchSessions++;
    p.trimpScores.push(m.trimp_score);
    p.hrAvgs.push(m.hr_avg);
    if (m.hr_max > p.maxHr) p.maxHr = m.hr_max;
    p.highIntensities.push((m.hr_zone_4_pct || 0) + (m.hr_zone_5_pct || 0));
    if (m.hr_recovery_60s) p.recoveries.push(m.hr_recovery_60s);
  }

  // Aggregate CV metrics
  for (const cv of cvMetrics ?? []) {
    const p = playerMap.get(cv.player_id);
    if (!p) continue;
    if (cv.avg_speed_kmh) p.speeds.push(cv.avg_speed_kmh);
    if (cv.max_speed_kmh) p.maxSpeeds.push(cv.max_speed_kmh);
    if (cv.distance_covered_m) p.distances.push(cv.distance_covered_m);
    if (cv.sprint_count) p.sprints.push(cv.sprint_count);
  }

  // Latest load records per player
  const seenLoad = new Set<string>();
  for (const l of loadRecords ?? []) {
    if (!seenLoad.has(l.player_id)) {
      seenLoad.add(l.player_id);
      const p = playerMap.get(l.player_id);
      if (p) {
        p.acwr = l.acwr_ratio;
        p.riskFlag = l.risk_flag;
      }
    }
  }

  // Compute averages and score
  const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  const talentList = Array.from(playerMap.values())
    .filter((p) => p.sessions >= 3)
    .map((p) => {
      p.avgTrimp = Math.round(avg(p.trimpScores));
      p.avgHr = Math.round(avg(p.hrAvgs));
      p.avgHighIntensity = Math.round(avg(p.highIntensities));
      p.avgRecovery = Math.round(avg(p.recoveries));
      p.avgSpeed = Math.round(avg(p.speeds) * 10) / 10;
      p.maxSpeed = Math.round(Math.max(0, ...p.maxSpeeds) * 10) / 10;
      p.avgDistance = Math.round(avg(p.distances));
      p.sprintCount = Math.round(avg(p.sprints));

      // Composite talent score: TRIMP (work rate) + high intensity (effort) + recovery (fitness) + speed
      const trimpScore = Math.min(10, p.avgTrimp / 15); // 150 trimp = 10
      const intensityScore = Math.min(10, p.avgHighIntensity / 4); // 40% Z4+Z5 = 10
      const recoveryScore = Math.min(10, p.avgRecovery / 4); // 40 bpm/60s = 10
      const speedScore = Math.min(10, p.maxSpeed / 3); // 30 km/h = 10
      const consistencyScore = Math.min(10, p.sessions / 3); // 30 sessions = 10

      const compositeScore = Math.round(
        (trimpScore * 0.25 + intensityScore * 0.2 + recoveryScore * 0.2 + speedScore * 0.2 + consistencyScore * 0.15) * 10
      );

      return {
        id: p.id,
        name: p.name,
        jerseyNumber: p.jersey_number,
        position: p.position,
        ageGroup: p.age_group,
        sessions: p.sessions,
        matchSessions: p.matchSessions,
        avgTrimp: p.avgTrimp,
        avgHr: p.avgHr,
        maxHr: p.maxHr,
        avgHighIntensity: p.avgHighIntensity,
        avgRecovery: p.avgRecovery,
        avgSpeed: p.avgSpeed,
        maxSpeed: p.maxSpeed,
        avgDistance: p.avgDistance,
        sprintCount: p.sprintCount,
        acwr: p.acwr,
        riskFlag: p.riskFlag,
        compositeScore,
      };
    })
    .sort((a, b) => b.compositeScore - a.compositeScore);

  return (
    <div className="space-y-8">
      {/* Talent Spotlight */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Star className="h-6 w-6 text-[#ffbb00]" />
          Talent Spotlight
        </h2>
        <p className="text-sm text-white/50 mt-1">
          Top performers ranked by AI composite score — ready for video &amp; social media promotion
        </p>
      </div>
      <TalentSpotlight players={talentList} />

      {/* Divider */}
      <div className="border-t border-white/[0.06] pt-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Target className="h-6 w-6 text-[#00d4ff]" />
          Opponent Scout Report
        </h2>
        <p className="text-sm text-white/50 mt-1">
          AI-generated pre-match tactical plan based on your squad&apos;s current data
        </p>
      </div>
      <ScoutReport />
    </div>
  );
}
