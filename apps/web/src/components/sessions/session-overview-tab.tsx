"use client";

import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  Heart,
  TrendingUp,
  Users,
  Clock,
  AlertTriangle,
  Zap,
  Brain,
  FileText,
  ChevronDown,
} from "lucide-react";
import { HR_ZONE_COLORS, HR_ZONE_LABELS } from "@/lib/hr-zones";
import type { HrZone } from "@/lib/hr-zones";
import { MetricInfo } from "@/components/ui/metric-info";

interface OverviewTabProps {
  session: {
    notes: string | null;
    duration_minutes: number | null;
    type: string;
    date: string;
    age_group: string;
  };
  metrics: Array<{
    hr_avg: number;
    hr_max: number;
    hr_min: number;
    trimp_score: number;
    hr_zone_1_pct: number;
    hr_zone_2_pct: number;
    hr_zone_3_pct: number;
    hr_zone_4_pct: number;
    hr_zone_5_pct: number;
    hr_recovery_60s: number | null;
    players?: { name: string; jersey_number: number; position: string };
  }>;
  cvMetrics: Array<{
    total_distance_m: number;
    max_speed_kmh: number;
    sprint_count: number;
    sprint_distance_m: number;
    high_speed_run_count: number;
    accel_events: number;
    decel_events: number;
    off_ball_movement_score: number | null;
    players?: { name: string; jersey_number: number; position: string };
  }>;
  loadRecords: Array<{
    risk_flag: string;
    acwr_ratio: number;
    player_id: string;
    players: { name: string; jersey_number: number };
  }>;
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  color,
  infoTerm,
  players,
  analysis,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtitle?: string;
  color?: string;
  infoTerm?: string;
  players?: Array<{ name: string; jersey: number; value: string | number }>;
  analysis?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasDetail = (players && players.length > 0) || analysis;

  return (
    <Card
      className={hasDetail ? "cursor-pointer transition-all hover:border-white/20" : ""}
      onClick={() => hasDetail && setExpanded(!expanded)}
    >
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Icon className={`h-4 w-4 ${color || "text-muted-foreground"}`} />
            <p className="text-xs text-muted-foreground">
              {infoTerm ? <MetricInfo term={infoTerm}>{label}</MetricInfo> : label}
            </p>
          </div>
          {hasDetail && (
            <ChevronDown className={`h-3.5 w-3.5 text-white/30 transition-transform ${expanded ? "rotate-180" : ""}`} />
          )}
        </div>
        <p className="text-2xl font-bold font-mono">{value}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}

        {expanded && (
          <div className="mt-3 pt-3 border-t border-white/[0.08] space-y-2">
            {analysis && (
              <p className="text-sm text-white/70 leading-relaxed">{analysis}</p>
            )}
            {players && players.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">Per Player</p>
                {players.slice(0, 5).map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-white/70">
                      <span className={`font-mono ${i === 0 ? "text-[#00ff88]" : ""}`}>#{p.jersey}</span> {p.name}
                    </span>
                    <span className="font-mono font-semibold text-white">{p.value}</span>
                  </div>
                ))}
                {players.length > 5 && (
                  <p className="text-xs text-white/40">+{players.length - 5} more players</p>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function SessionOverviewTab({
  session,
  metrics,
  cvMetrics,
  loadRecords,
}: OverviewTabProps) {
  const hasData = metrics.length > 0;
  const hasCvData = cvMetrics.length > 0;

  const avgHr = hasData
    ? Math.round(metrics.reduce((s, m) => s + m.hr_avg, 0) / metrics.length)
    : null;
  const maxHr = hasData ? Math.max(...metrics.map((m) => m.hr_max)) : null;
  const minHr = hasData ? Math.min(...metrics.map((m) => m.hr_min)) : null;
  const avgTrimp = hasData
    ? Math.round(
        metrics.reduce((s, m) => s + m.trimp_score, 0) / metrics.length
      )
    : null;
  const totalTrimp = hasData
    ? Math.round(metrics.reduce((s, m) => s + m.trimp_score, 0))
    : null;

  // CV metrics aggregates
  const avgDistance = hasCvData
    ? Math.round(cvMetrics.reduce((s, m) => s + m.total_distance_m, 0) / cvMetrics.length)
    : null;
  const avgMaxSpeed = hasCvData
    ? (cvMetrics.reduce((s, m) => s + m.max_speed_kmh, 0) / cvMetrics.length).toFixed(1)
    : null;
  const avgSprints = hasCvData
    ? Math.round(cvMetrics.reduce((s, m) => s + m.sprint_count, 0) / cvMetrics.length)
    : null;
  const totalSprints = hasCvData
    ? cvMetrics.reduce((s, m) => s + m.sprint_count, 0)
    : null;
  const avgHSR = hasCvData
    ? Math.round(cvMetrics.reduce((s, m) => s + m.high_speed_run_count, 0) / cvMetrics.length)
    : null;
  const avgAccel = hasCvData
    ? Math.round(cvMetrics.reduce((s, m) => s + m.accel_events, 0) / cvMetrics.length)
    : null;
  const avgDecel = hasCvData
    ? Math.round(cvMetrics.reduce((s, m) => s + m.decel_events, 0) / cvMetrics.length)
    : null;

  const redFlags = loadRecords.filter((r) => r.risk_flag === "red");
  const amberFlags = loadRecords.filter((r) => r.risk_flag === "amber");

  // Average zone distribution across all players
  const avgZones = hasData
    ? {
        z1: Math.round(
          metrics.reduce((s, m) => s + m.hr_zone_1_pct, 0) / metrics.length
        ),
        z2: Math.round(
          metrics.reduce((s, m) => s + m.hr_zone_2_pct, 0) / metrics.length
        ),
        z3: Math.round(
          metrics.reduce((s, m) => s + m.hr_zone_3_pct, 0) / metrics.length
        ),
        z4: Math.round(
          metrics.reduce((s, m) => s + m.hr_zone_4_pct, 0) / metrics.length
        ),
        z5: Math.round(
          metrics.reduce((s, m) => s + m.hr_zone_5_pct, 0) / metrics.length
        ),
      }
    : null;

  // Top performers by TRIMP
  const topPerformers = hasData
    ? [...metrics]
        .sort((a, b) => b.trimp_score - a.trimp_score)
        .slice(0, 3)
    : [];

  // Avg recovery
  const recoveryMetrics = metrics.filter((m) => m.hr_recovery_60s !== null);
  const avgRecovery =
    recoveryMetrics.length > 0
      ? Math.round(
          recoveryMetrics.reduce((s, m) => s + (m.hr_recovery_60s ?? 0), 0) /
            recoveryMetrics.length
        )
      : null;

  // Session intensity classification
  const intensityLabel = avgTrimp
    ? avgTrimp > 200
      ? "Very High"
      : avgTrimp > 150
        ? "High"
        : avgTrimp > 100
          ? "Moderate"
          : avgTrimp > 50
            ? "Low"
            : "Very Low"
    : null;

  const intensityColor = avgTrimp
    ? avgTrimp > 200
      ? "text-red-500"
      : avgTrimp > 150
        ? "text-orange-500"
        : avgTrimp > 100
          ? "text-yellow-500"
          : "text-green-500"
    : "";

  if (!hasData) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Activity className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">No wearable data yet</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                This session doesn&apos;t have any heart rate data attached. Data will
                appear here once players wear their chest straps during the
                session.
              </p>
            </div>
          </CardContent>
        </Card>

        {session.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4" />
                Coach Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{session.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="h-4 w-4 text-violet-500" />
            Session Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-base leading-relaxed">
            {session.type === "match"
              ? `Match session with ${metrics.length} players tracked. `
              : `Training session with ${metrics.length} players tracked. `}
            {intensityLabel && (
              <span>
                Overall intensity was{" "}
                <span className={`font-semibold ${intensityColor}`}>
                  {intensityLabel.toLowerCase()}
                </span>{" "}
                (avg TRIMP: {avgTrimp}).{" "}
              </span>
            )}
            {avgZones && avgZones.z5 > 15
              ? `Players spent an average of ${avgZones.z5}% of time in the anaerobic zone (Z5) — high-intensity session. `
              : avgZones && avgZones.z4 + avgZones.z5 > 30
                ? `Good mix of threshold and high-intensity work — ${avgZones.z4 + avgZones.z5}% of time in Z4/Z5. `
                : `Predominantly aerobic session — most time spent in zones 2-3. `}
            {redFlags.length > 0
              ? `${redFlags.length} player${redFlags.length > 1 ? "s" : ""} flagged for injury risk — monitor closely.`
              : amberFlags.length > 0
                ? `${amberFlags.length} player${amberFlags.length > 1 ? "s" : ""} in the caution zone for load management.`
                : "No injury risk flags from this session."}
          </p>
          <div className="flex items-center gap-1.5 mt-3">
            <Brain className="h-3 w-3 text-violet-400" />
            <span className="text-xs text-violet-400">
              Coach M8 AI — auto-generated from session data
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          icon={Heart}
          label="Avg Heart Rate"
          value={`${avgHr} bpm`}
          color="text-red-500"
          infoTerm="hr-avg"
          analysis={avgHr ? `Team averaged ${avgHr} bpm this session. ${avgHr > 160 ? "High intensity — monitor recovery." : avgHr > 140 ? "Moderate-high effort — good for development." : "Lower intensity — appropriate for technical/recovery work."}` : undefined}
          players={[...metrics].sort((a, b) => b.hr_avg - a.hr_avg).slice(0, 5).map(m => ({
            name: m.players?.name ?? "Unknown",
            jersey: m.players?.jersey_number ?? 0,
            value: `${m.hr_avg} bpm`,
          }))}
        />
        <StatCard
          icon={TrendingUp}
          label="Peak HR"
          value={`${maxHr} bpm`}
          subtitle={`Low: ${minHr} bpm`}
          color="text-orange-500"
          infoTerm="hr-max"
          players={[...metrics].sort((a, b) => b.hr_max - a.hr_max).slice(0, 5).map(m => ({
            name: m.players?.name ?? "Unknown",
            jersey: m.players?.jersey_number ?? 0,
            value: `${m.hr_max} bpm`,
          }))}
        />
        <StatCard
          icon={Zap}
          label="Avg TRIMP"
          value={avgTrimp ?? "--"}
          subtitle={intensityLabel ?? undefined}
          color={intensityColor || "text-muted-foreground"}
          infoTerm="trimp"
          analysis={avgTrimp ? `Session load averaged ${avgTrimp} TRIMP. ${intensityLabel ? `Classified as ${intensityLabel.toLowerCase()} intensity.` : ""}` : undefined}
          players={[...metrics].sort((a, b) => b.trimp_score - a.trimp_score).slice(0, 5).map(m => ({
            name: m.players?.name ?? "Unknown",
            jersey: m.players?.jersey_number ?? 0,
            value: Math.round(m.trimp_score),
          }))}
        />
        <StatCard
          icon={Users}
          label="Players Tracked"
          value={metrics.length}
          color="text-blue-500"
          infoTerm="players-tracked"
        />
        <StatCard
          icon={Clock}
          label="Duration"
          value={
            session.duration_minutes
              ? `${session.duration_minutes} min`
              : "--"
          }
          color="text-muted-foreground"
        />
        <StatCard
          icon={AlertTriangle}
          label="Risk Flags"
          infoTerm="risk-flag"
          value={
            redFlags.length + amberFlags.length === 0
              ? "None"
              : `${redFlags.length + amberFlags.length}`
          }
          subtitle={
            redFlags.length > 0
              ? `${redFlags.length} red, ${amberFlags.length} amber`
              : amberFlags.length > 0
                ? `${amberFlags.length} caution`
                : "All clear"
          }
          color={
            redFlags.length > 0
              ? "text-red-500"
              : amberFlags.length > 0
                ? "text-amber-500"
                : "text-green-500"
          }
        />
      </div>

      {/* Physical Performance Metrics (from CV Pipeline) */}
      {hasCvData && (
        <div>
          <h3 className="text-sm font-semibold text-white/80 mb-3 uppercase tracking-wider">Physical Performance — Video Tracking</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <StatCard
              icon={Activity}
              label="Avg Distance"
              value={avgDistance ? `${(avgDistance / 1000).toFixed(1)} km` : "--"}
              color="text-[#00d4ff]"
              analysis={avgDistance ? `Team covered an average of ${(avgDistance / 1000).toFixed(1)} km per player. ${avgDistance > 6000 ? "High volume — great work rate across the squad." : avgDistance > 5000 ? "Good coverage for a training session." : "Lower distance — likely technical or tactical focused session."}` : undefined}
              players={[...cvMetrics].sort((a, b) => b.total_distance_m - a.total_distance_m).slice(0, 5).map(m => ({
                name: m.players?.name ?? "Unknown",
                jersey: m.players?.jersey_number ?? 0,
                value: `${(m.total_distance_m / 1000).toFixed(1)} km`,
              }))}
            />
            <StatCard
              icon={Zap}
              label="Top Speed"
              value={avgMaxSpeed ? `${avgMaxSpeed} km/h` : "--"}
              color="text-[#00ff88]"
              analysis="Peak speed reached during sprints. Compare to age-group benchmarks: U16 elite = 28-32 km/h."
              players={[...cvMetrics].sort((a, b) => b.max_speed_kmh - a.max_speed_kmh).slice(0, 5).map(m => ({
                name: m.players?.name ?? "Unknown",
                jersey: m.players?.jersey_number ?? 0,
                value: `${m.max_speed_kmh.toFixed(1)} km/h`,
              }))}
            />
            <StatCard
              icon={Zap}
              label="Avg Sprints"
              value={avgSprints ?? "--"}
              subtitle={totalSprints ? `${totalSprints} total` : undefined}
              color="text-[#ff6b35]"
              analysis="Sprints above 20 km/h. More sprints = higher intensity. Compare across sessions to track explosive capacity development."
              players={[...cvMetrics].sort((a, b) => b.sprint_count - a.sprint_count).slice(0, 5).map(m => ({
                name: m.players?.name ?? "Unknown",
                jersey: m.players?.jersey_number ?? 0,
                value: `${m.sprint_count} sprints`,
              }))}
            />
            <StatCard
              icon={TrendingUp}
              label="High Speed Runs"
              value={avgHSR ?? "--"}
              subtitle=">15 km/h"
              color="text-[#a855f7]"
              analysis="Runs above 15 km/h. Includes both sprints and high-tempo runs. Key indicator of work rate and physical capacity."
              players={[...cvMetrics].sort((a, b) => b.high_speed_run_count - a.high_speed_run_count).slice(0, 5).map(m => ({
                name: m.players?.name ?? "Unknown",
                jersey: m.players?.jersey_number ?? 0,
                value: `${m.high_speed_run_count} runs`,
              }))}
            />
            <StatCard
              icon={TrendingUp}
              label="Accelerations"
              value={avgAccel ?? "--"}
              subtitle=">2.5 m/s²"
              color="text-[#00d4ff]"
              analysis="Sharp acceleration events above 2.5 m/s². High acceleration count indicates explosive playing style — pressing, counter-attacks, and off-the-ball runs."
              players={[...cvMetrics].sort((a, b) => b.accel_events - a.accel_events).slice(0, 5).map(m => ({
                name: m.players?.name ?? "Unknown",
                jersey: m.players?.jersey_number ?? 0,
                value: `${m.accel_events} events`,
              }))}
            />
            <StatCard
              icon={AlertTriangle}
              label="Decelerations"
              value={avgDecel ?? "--"}
              subtitle="Injury predictor"
              color="text-[#ff3355]"
              analysis="Deceleration events above 2.5 m/s². This is the STRONGEST single predictor of soft tissue injuries. Players with consistently high deceleration loads need careful monitoring."
              players={[...cvMetrics].sort((a, b) => b.decel_events - a.decel_events).slice(0, 5).map(m => ({
                name: m.players?.name ?? "Unknown",
                jersey: m.players?.jersey_number ?? 0,
                value: `${m.decel_events} events`,
              }))}
            />
            <StatCard
              icon={Users}
              label="Movement Score"
              value={hasCvData ? Math.round(cvMetrics.reduce((s, m) => s + (m.off_ball_movement_score ?? 0), 0) / cvMetrics.length) : "--"}
              subtitle="Off-ball quality"
              color="text-[#00ff88]"
              analysis="AI-derived score (0-100) measuring the quality of a player's movement when they don't have the ball. Higher = better positioning, more intelligent runs."
              players={[...cvMetrics].filter(m => m.off_ball_movement_score != null).sort((a, b) => (b.off_ball_movement_score ?? 0) - (a.off_ball_movement_score ?? 0)).slice(0, 5).map(m => ({
                name: m.players?.name ?? "Unknown",
                jersey: m.players?.jersey_number ?? 0,
                value: `${Math.round(m.off_ball_movement_score ?? 0)}/100`,
              }))}
            />
          </div>
        </div>
      )}

      {/* Two-column: Zone Distribution + Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Team Zone Distribution */}
        {avgZones && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                <MetricInfo term="hr-zones">Team HR Zone Distribution</MetricInfo>
              </CardTitle>
              <CardDescription>
                Average time spent in each zone across all players
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(
                  [
                    { zone: 1 as HrZone, pct: avgZones.z1 },
                    { zone: 2 as HrZone, pct: avgZones.z2 },
                    { zone: 3 as HrZone, pct: avgZones.z3 },
                    { zone: 4 as HrZone, pct: avgZones.z4 },
                    { zone: 5 as HrZone, pct: avgZones.z5 },
                  ] as const
                ).map(({ zone, pct }) => (
                  <div key={zone} className="flex items-center gap-3">
                    <div className="flex items-center gap-2 w-24">
                      <div
                        className="h-3 w-3 rounded-full shrink-0"
                        style={{ backgroundColor: HR_ZONE_COLORS[zone] }}
                      />
                      <span className="text-xs font-medium">
                        {HR_ZONE_LABELS[zone]}
                      </span>
                    </div>
                    <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(pct, 100)}%`,
                          backgroundColor: HR_ZONE_COLORS[zone],
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold w-10 text-right">
                      {pct}%
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top Performers + Risk Flags */}
        <div className="space-y-4">
          {topPerformers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Performers</CardTitle>
                <CardDescription>Highest training load (TRIMP)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topPerformers.map((m, i) => (
                    <div
                      key={m.players?.jersey_number ?? i}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-lg font-bold ${i === 0 ? "text-amber-500" : i === 1 ? "text-gray-400" : "text-amber-700"}`}
                        >
                          {i + 1}
                        </span>
                        <div>
                          <p className="text-sm font-medium">
                            #{m.players?.jersey_number} {m.players?.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {m.players?.position} — HR avg {m.hr_avg} bpm
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">
                        TRIMP {Math.round(m.trimp_score)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Risk flags summary */}
          {(redFlags.length > 0 || amberFlags.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Load Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[...redFlags, ...amberFlags].slice(0, 5).map((r) => (
                    <div
                      key={r.player_id}
                      className={`flex items-center justify-between p-2 rounded-lg text-sm border ${r.risk_flag === "red" ? "bg-[#ff3355]/10 border-[#ff3355]/20" : "bg-[#ff6b35]/10 border-[#ff6b35]/20"}`}
                    >
                      <span className="font-medium">
                        #{r.players.jersey_number} {r.players.name}
                      </span>
                      <Badge
                        variant="outline"
                        className={
                          r.risk_flag === "red"
                            ? "bg-[#ff3355]/15 text-[#ff3355] border-[#ff3355]/30 font-mono"
                            : "bg-[#ff6b35]/15 text-[#ff6b35] border-[#ff6b35]/30 font-mono"
                        }
                      >
                        ACWR {r.acwr_ratio}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recovery */}
          {avgRecovery !== null && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Team Recovery
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{avgRecovery} bpm</p>
                <p className="text-xs text-muted-foreground">
                  Average HR drop in first 60 seconds post-session
                </p>
                <p className="text-xs mt-1">
                  {avgRecovery > 30
                    ? "Excellent recovery — team is well conditioned"
                    : avgRecovery > 20
                      ? "Good recovery — within normal range"
                      : "Below average — consider monitoring fatigue levels"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Coach Notes */}
      {session.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              Coach Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{session.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
