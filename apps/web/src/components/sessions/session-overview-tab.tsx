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
  Trophy,
  Medal,
} from "lucide-react";
import { ExportShareBar } from "@/components/ui/export-share-bar";
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

/* ------------------------------------------------------------------ */
/*  StatCard — connected strip style with colored accent + glow       */
/* ------------------------------------------------------------------ */
function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  color,
  accentHex,
  infoTerm,
  players,
  analysis,
  isCircularScore,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtitle?: string;
  color?: string;
  accentHex?: string;
  infoTerm?: string;
  players?: Array<{ name: string; jersey: number; value: string | number }>;
  analysis?: string;
  isCircularScore?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasDetail = (players && players.length > 0) || analysis;

  const glowColor = accentHex ?? "#ffffff";
  const circularValue = typeof value === "number" ? value : parseInt(String(value), 10);
  const circularPct = isCircularScore && !isNaN(circularValue) ? circularValue : 0;

  return (
    <div
      className={`group/stat relative flex flex-col transition-all duration-300 ${
        hasDetail ? "cursor-pointer" : ""
      } ${expanded ? "w-full" : "w-[calc(50%-4px)] md:w-[calc(25%-6px)] lg:flex-1 min-w-[140px]"} self-start`}
      onClick={() => hasDetail && setExpanded(!expanded)}
    >
      {/* Colored accent bar top */}
      <div
        className="h-[3px] w-full rounded-t-lg"
        style={{ background: glowColor }}
      />

      {/* Card body */}
      <div
        className="flex-1 rounded-b-lg border border-t-0 border-white/[0.08] bg-white/[0.03] backdrop-blur-xl px-3.5 py-3 transition-all duration-300 group-hover/stat:bg-white/[0.06] group-hover/stat:border-white/[0.15] group-hover/stat:scale-[1.02]"
        style={{
          boxShadow: expanded
            ? `0 0 20px ${glowColor}15, inset 0 1px 0 ${glowColor}10`
            : `inset 0 1px 0 ${glowColor}08`,
        }}
      >
        {/* Header row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {/* Glowing icon circle */}
            <div
              className="relative flex h-7 w-7 items-center justify-center rounded-full"
              style={{
                background: `${glowColor}15`,
                boxShadow: `0 0 12px ${glowColor}20`,
              }}
            >
              <Icon className={`h-4 w-4 ${color || "text-muted-foreground"}`} />
            </div>
            <p className="text-[10px] uppercase tracking-widest text-white/50 font-medium">
              {infoTerm ? <MetricInfo term={infoTerm}>{label}</MetricInfo> : label}
            </p>
          </div>
          {hasDetail && (
            <ChevronDown
              className={`h-3.5 w-3.5 text-white/30 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
            />
          )}
        </div>

        {/* Value */}
        {isCircularScore && !isNaN(circularPct) ? (
          <div className="flex items-center gap-3">
            {/* Circular progress ring */}
            <div className="relative h-14 w-14 shrink-0">
              <svg className="h-14 w-14 -rotate-90" viewBox="0 0 56 56">
                <circle
                  cx="28"
                  cy="28"
                  r="24"
                  fill="none"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="4"
                />
                <circle
                  cx="28"
                  cy="28"
                  r="24"
                  fill="none"
                  stroke={glowColor}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${(circularPct / 100) * 150.8} 150.8`}
                  style={{
                    filter: `drop-shadow(0 0 4px ${glowColor}60)`,
                  }}
                />
              </svg>
              <span
                className="absolute inset-0 flex items-center justify-center text-lg font-bold font-mono"
                style={{ color: glowColor, textShadow: `0 0 8px ${glowColor}40` }}
              >
                {circularPct}
              </span>
            </div>
            {subtitle && (
              <p className="text-[10px] uppercase tracking-widest text-white/40">{subtitle}</p>
            )}
          </div>
        ) : (
          <>
            <p
              className="text-3xl font-bold font-mono leading-none"
              style={{ textShadow: `0 0 12px ${glowColor}30` }}
            >
              {value}
            </p>
            {subtitle && (
              <p className="text-[10px] uppercase tracking-widest text-white/40 mt-1">{subtitle}</p>
            )}
          </>
        )}

        {/* Expanded detail */}
        {expanded && (
          <div
            className="mt-3 pt-3 space-y-2 overflow-hidden"
            style={{ borderTop: `1px solid ${glowColor}15` }}
          >
            {analysis && (
              <p className="text-sm text-white/70 leading-relaxed">{analysis}</p>
            )}
            {players && players.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-widest text-white/40 font-semibold">
                  Per Player
                </p>
                {players.slice(0, 5).map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-white/70">
                      <span
                        className={`font-mono ${i === 0 ? "text-[#00ff88]" : ""}`}
                      >
                        #{p.jersey}
                      </span>{" "}
                      {p.name}
                    </span>
                    <span className="font-mono font-semibold text-white">
                      {p.value}
                    </span>
                  </div>
                ))}
                {players.length > 5 && (
                  <p className="text-xs text-white/40">
                    +{players.length - 5} more players
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section Header                                                     */
/* ------------------------------------------------------------------ */
function SectionHeader({
  title,
  gradient,
  pulseDot,
  pulseDotColor,
}: {
  title: string;
  gradient: string;
  pulseDot?: boolean;
  pulseDotColor?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className={`h-px flex-1 max-w-8 ${gradient}`} />
      <div className="flex items-center gap-2">
        {pulseDot && (
          <span className="relative flex h-2 w-2">
            <span
              className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
              style={{ backgroundColor: pulseDotColor ?? "#00d4ff" }}
            />
            <span
              className="relative inline-flex h-2 w-2 rounded-full"
              style={{ backgroundColor: pulseDotColor ?? "#00d4ff" }}
            />
          </span>
        )}
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60">
          {title}
        </h3>
      </div>
      <div className={`h-px flex-1 ${gradient}`} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Performer Rank Icon                                                */
/* ------------------------------------------------------------------ */
function RankIcon({ rank }: { rank: number }) {
  if (rank === 0) {
    return <Trophy className="h-5 w-5 text-amber-400" style={{ filter: "drop-shadow(0 0 4px rgba(251,191,36,0.5))" }} />;
  }
  if (rank === 1) {
    return <Medal className="h-5 w-5 text-gray-300" style={{ filter: "drop-shadow(0 0 4px rgba(209,213,219,0.4))" }} />;
  }
  return <Medal className="h-5 w-5 text-amber-700" style={{ filter: "drop-shadow(0 0 4px rgba(180,83,9,0.4))" }} />;
}

/* ------------------------------------------------------------------ */
/*  Player Avatar (initial)                                            */
/* ------------------------------------------------------------------ */
function PlayerAvatar({ name, rank }: { name: string; rank: number }) {
  const initial = name.charAt(0).toUpperCase();
  const borderColors = ["border-amber-400/50", "border-gray-300/50", "border-amber-700/50"];
  const bgColors = ["bg-amber-400/15", "bg-gray-300/10", "bg-amber-700/10"];

  return (
    <div
      className={`flex h-9 w-9 items-center justify-center rounded-full border ${borderColors[rank] ?? "border-white/10"} ${bgColors[rank] ?? "bg-white/5"} text-sm font-bold text-white/80 shrink-0`}
    >
      {initial}
    </div>
  );
}

/* ================================================================== */
/*  MAIN COMPONENT                                                     */
/* ================================================================== */
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

  // CV metrics aggregates
  const avgDistance = hasCvData
    ? Math.round(
        cvMetrics.reduce((s, m) => s + m.total_distance_m, 0) / cvMetrics.length
      )
    : null;
  const avgMaxSpeed = hasCvData
    ? (
        cvMetrics.reduce((s, m) => s + m.max_speed_kmh, 0) / cvMetrics.length
      ).toFixed(1)
    : null;
  const avgSprints = hasCvData
    ? Math.round(
        cvMetrics.reduce((s, m) => s + m.sprint_count, 0) / cvMetrics.length
      )
    : null;
  const totalSprints = hasCvData
    ? cvMetrics.reduce((s, m) => s + m.sprint_count, 0)
    : null;
  const avgHSR = hasCvData
    ? Math.round(
        cvMetrics.reduce((s, m) => s + m.high_speed_run_count, 0) /
          cvMetrics.length
      )
    : null;
  const avgAccel = hasCvData
    ? Math.round(
        cvMetrics.reduce((s, m) => s + m.accel_events, 0) / cvMetrics.length
      )
    : null;
  const avgDecel = hasCvData
    ? Math.round(
        cvMetrics.reduce((s, m) => s + m.decel_events, 0) / cvMetrics.length
      )
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
          recoveryMetrics.reduce(
            (s, m) => s + (m.hr_recovery_60s ?? 0),
            0
          ) / recoveryMetrics.length
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

  const intensityHex = avgTrimp
    ? avgTrimp > 200
      ? "#ef4444"
      : avgTrimp > 150
        ? "#f97316"
        : avgTrimp > 100
          ? "#eab308"
          : "#22c55e"
    : "#888888";

  /* ---- Empty state ---- */
  if (!hasData) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Activity className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">
                No wearable data yet
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                This session doesn&apos;t have any heart rate data attached.
                Data will appear here once players wear their chest straps
                during the session.
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

  /* ---- Main render ---- */
  return (
    <div className="space-y-8">
      {/* Export bar */}
      <div className="flex justify-end">
        <ExportShareBar
          title={`Session Overview — ${session.type} · ${session.date}`}
          content={`Session: ${session.type}\nDate: ${session.date}\nAge Group: ${session.age_group}\nDuration: ${session.duration_minutes ?? "—"} min\nPlayers tracked: ${metrics.length}\nAvg TRIMP: ${avgTrimp ?? "—"}\nAvg HR: ${avgHr ?? "—"} bpm`}
        />
      </div>

      {/* =========================================================== */}
      {/*  AI Session Analysis — gradient left border + brain glow     */}
      {/* =========================================================== */}
      <div
        className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl"
        style={{
          boxShadow: "0 0 30px rgba(139,92,246,0.08), 0 0 60px rgba(0,212,255,0.04)",
        }}
      >
        {/* Purple-to-cyan gradient left border */}
        <div
          className="absolute left-0 top-0 bottom-0 w-[3px]"
          style={{
            background: "linear-gradient(to bottom, #a855f7, #06b6d4)",
          }}
        />

        <div className="pl-6 pr-5 py-5">
          <div className="flex items-center gap-3 mb-3">
            {/* Brain icon with glow */}
            <div
              className="relative flex h-9 w-9 items-center justify-center rounded-full"
              style={{
                background: "rgba(139,92,246,0.15)",
                boxShadow: "0 0 20px rgba(139,92,246,0.3), 0 0 40px rgba(139,92,246,0.1)",
              }}
            >
              <Brain className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">
                Session Analysis
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Brain className="h-3 w-3 text-violet-400/60" />
                <span className="text-[10px] uppercase tracking-widest text-violet-400/60">
                  Coach M8 AI
                </span>
              </div>
            </div>
          </div>

          <p className="text-base leading-relaxed text-white/80">
            {session.type === "match"
              ? `Match session with ${metrics.length} players tracked. `
              : `Training session with ${metrics.length} players tracked. `}
            {intensityLabel && (
              <span>
                Overall intensity was{" "}
                <span
                  className={`font-semibold ${intensityColor}`}
                  style={{ textShadow: `0 0 10px ${intensityHex}50` }}
                >
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
        </div>
      </div>

      {/* =========================================================== */}
      {/*  HR Metrics — connected strip                                */}
      {/* =========================================================== */}
      <div>
        <SectionHeader
          title="Heart Rate Monitoring"
          gradient="bg-gradient-to-r from-red-500/40 to-transparent"
        />
        <div className="flex flex-wrap gap-2">
          <StatCard
            icon={Heart}
            label="Avg Heart Rate"
            value={`${avgHr} bpm`}
            color="text-red-500"
            accentHex="#ef4444"
            infoTerm="hr-avg"
            analysis={
              avgHr
                ? `Team averaged ${avgHr} bpm this session. ${avgHr > 160 ? "High intensity — monitor recovery." : avgHr > 140 ? "Moderate-high effort — good for development." : "Lower intensity — appropriate for technical/recovery work."}`
                : undefined
            }
            players={[...metrics]
              .sort((a, b) => b.hr_avg - a.hr_avg)
              .slice(0, 5)
              .map((m) => ({
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
            accentHex="#f97316"
            infoTerm="hr-max"
            players={[...metrics]
              .sort((a, b) => b.hr_max - a.hr_max)
              .slice(0, 5)
              .map((m) => ({
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
            accentHex={intensityHex}
            infoTerm="trimp"
            analysis={
              avgTrimp
                ? `Session load averaged ${avgTrimp} TRIMP. ${intensityLabel ? `Classified as ${intensityLabel.toLowerCase()} intensity.` : ""}`
                : undefined
            }
            players={[...metrics]
              .sort((a, b) => b.trimp_score - a.trimp_score)
              .slice(0, 5)
              .map((m) => ({
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
            accentHex="#3b82f6"
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
            color="text-white/60"
            accentHex="#64748b"
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
            accentHex={
              redFlags.length > 0
                ? "#ef4444"
                : amberFlags.length > 0
                  ? "#f59e0b"
                  : "#22c55e"
            }
          />
        </div>
      </div>

      {/* =========================================================== */}
      {/*  CV Pipeline — Physical Performance                          */}
      {/* =========================================================== */}
      {hasCvData && (
        <div>
          <SectionHeader
            title="Physical Performance -- Video Tracking"
            gradient="bg-gradient-to-r from-cyan-500/40 to-transparent"
            pulseDot
            pulseDotColor="#06b6d4"
          />
          <div className="flex flex-wrap gap-2">
            <StatCard
              icon={Activity}
              label="Avg Distance"
              value={
                avgDistance ? `${(avgDistance / 1000).toFixed(1)} km` : "--"
              }
              color="text-[#00d4ff]"
              accentHex="#00d4ff"
              analysis={
                avgDistance
                  ? `Team covered an average of ${(avgDistance / 1000).toFixed(1)} km per player. ${avgDistance > 6000 ? "High volume — great work rate across the squad." : avgDistance > 5000 ? "Good coverage for a training session." : "Lower distance — likely technical or tactical focused session."}`
                  : undefined
              }
              players={[...cvMetrics]
                .sort((a, b) => b.total_distance_m - a.total_distance_m)
                .slice(0, 5)
                .map((m) => ({
                  name: m.players?.name ?? "Unknown",
                  jersey: m.players?.jersey_number ?? 0,
                  value: `${((m.total_distance_m ?? 0) / 1000).toFixed(1)} km`,
                }))}
            />
            <StatCard
              icon={Zap}
              label="Top Speed"
              value={avgMaxSpeed ? `${avgMaxSpeed} km/h` : "--"}
              color="text-[#00ff88]"
              accentHex="#00ff88"
              analysis="Peak speed reached during sprints. Compare to age-group benchmarks: U16 elite = 28-32 km/h."
              players={[...cvMetrics]
                .sort((a, b) => b.max_speed_kmh - a.max_speed_kmh)
                .slice(0, 5)
                .map((m) => ({
                  name: m.players?.name ?? "Unknown",
                  jersey: m.players?.jersey_number ?? 0,
                  value: `${(m.max_speed_kmh ?? 0).toFixed(1)} km/h`,
                }))}
            />
            <StatCard
              icon={Zap}
              label="Avg Sprints"
              value={avgSprints ?? "--"}
              subtitle={totalSprints ? `${totalSprints} total` : undefined}
              color="text-[#ff6b35]"
              accentHex="#ff6b35"
              analysis="Sprints above 20 km/h. More sprints = higher intensity. Compare across sessions to track explosive capacity development."
              players={[...cvMetrics]
                .sort((a, b) => b.sprint_count - a.sprint_count)
                .slice(0, 5)
                .map((m) => ({
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
              accentHex="#a855f7"
              analysis="Runs above 15 km/h. Includes both sprints and high-tempo runs. Key indicator of work rate and physical capacity."
              players={[...cvMetrics]
                .sort(
                  (a, b) =>
                    b.high_speed_run_count - a.high_speed_run_count
                )
                .slice(0, 5)
                .map((m) => ({
                  name: m.players?.name ?? "Unknown",
                  jersey: m.players?.jersey_number ?? 0,
                  value: `${m.high_speed_run_count} runs`,
                }))}
            />
            <StatCard
              icon={TrendingUp}
              label="Accelerations"
              value={avgAccel ?? "--"}
              subtitle=">2.5 m/s\u00B2"
              color="text-[#00d4ff]"
              accentHex="#00d4ff"
              analysis="Sharp acceleration events above 2.5 m/s\u00B2. High acceleration count indicates explosive playing style — pressing, counter-attacks, and off-the-ball runs."
              players={[...cvMetrics]
                .sort((a, b) => b.accel_events - a.accel_events)
                .slice(0, 5)
                .map((m) => ({
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
              accentHex="#ff3355"
              analysis="Deceleration events above 2.5 m/s\u00B2. This is the STRONGEST single predictor of soft tissue injuries. Players with consistently high deceleration loads need careful monitoring."
              players={[...cvMetrics]
                .sort((a, b) => b.decel_events - a.decel_events)
                .slice(0, 5)
                .map((m) => ({
                  name: m.players?.name ?? "Unknown",
                  jersey: m.players?.jersey_number ?? 0,
                  value: `${m.decel_events} events`,
                }))}
            />
            <StatCard
              icon={Users}
              label="Movement Score"
              value={
                hasCvData
                  ? Math.round(
                      cvMetrics.reduce(
                        (s, m) => s + (m.off_ball_movement_score ?? 0),
                        0
                      ) / cvMetrics.length
                    )
                  : "--"
              }
              subtitle="Off-ball quality"
              color="text-[#00ff88]"
              accentHex="#00ff88"
              isCircularScore
              analysis="AI-derived score (0-100) measuring the quality of a player's movement when they don't have the ball. Higher = better positioning, more intelligent runs."
              players={[...cvMetrics]
                .filter((m) => m.off_ball_movement_score != null)
                .sort(
                  (a, b) =>
                    (b.off_ball_movement_score ?? 0) -
                    (a.off_ball_movement_score ?? 0)
                )
                .slice(0, 5)
                .map((m) => ({
                  name: m.players?.name ?? "Unknown",
                  jersey: m.players?.jersey_number ?? 0,
                  value: `${Math.round(m.off_ball_movement_score ?? 0)}/100`,
                }))}
            />
          </div>
        </div>
      )}

      {/* =========================================================== */}
      {/*  Zone Distribution + Top Performers + Alerts                 */}
      {/* =========================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Team Zone Distribution */}
        {avgZones && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                <MetricInfo term="hr-zones">
                  Team HR Zone Distribution
                </MetricInfo>
              </CardTitle>
              <CardDescription>
                Average time spent in each zone across all players
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3.5">
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
                        style={{
                          backgroundColor: HR_ZONE_COLORS[zone],
                          boxShadow: `0 0 6px ${HR_ZONE_COLORS[zone]}60`,
                        }}
                      />
                      <span className="text-[10px] uppercase tracking-widest text-white/50 font-medium">
                        {HR_ZONE_LABELS[zone]}
                      </span>
                    </div>
                    <div className="flex-1 h-5 bg-white/[0.04] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.min(pct, 100)}%`,
                          backgroundColor: HR_ZONE_COLORS[zone],
                          boxShadow: `0 0 12px ${HR_ZONE_COLORS[zone]}40, inset 0 1px 0 rgba(255,255,255,0.2)`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-bold font-mono w-10 text-right">
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
                <CardDescription>
                  Highest training load (TRIMP)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topPerformers.map((m, i) => (
                    <div
                      key={m.players?.jersey_number ?? i}
                      className="flex items-center justify-between group/performer rounded-lg px-3 py-2.5 -mx-3 transition-all hover:bg-white/[0.04]"
                    >
                      <div className="flex items-center gap-3">
                        <RankIcon rank={i} />
                        <PlayerAvatar
                          name={m.players?.name ?? "?"}
                          rank={i}
                        />
                        <div>
                          <p className="text-sm font-medium">
                            <span className="font-mono text-white/50">
                              #{m.players?.jersey_number}
                            </span>{" "}
                            {m.players?.name}
                          </p>
                          <p className="text-[10px] uppercase tracking-widest text-white/40">
                            {m.players?.position} — HR avg {m.hr_avg} bpm
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">
                        <span className="font-mono">
                          TRIMP {Math.round(m.trimp_score)}
                        </span>
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Risk flags summary — animated left border */}
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
                  {[...redFlags, ...amberFlags].slice(0, 5).map((r) => {
                    const isRed = r.risk_flag === "red";
                    const borderColor = isRed ? "#ff3355" : "#ff6b35";

                    return (
                      <div
                        key={r.player_id}
                        className="relative flex items-center justify-between p-3 rounded-lg text-sm overflow-hidden"
                        style={{
                          background: isRed
                            ? "rgba(255,51,85,0.08)"
                            : "rgba(255,107,53,0.08)",
                          border: `1px solid ${borderColor}20`,
                        }}
                      >
                        {/* Animated left border */}
                        <div
                          className="absolute left-0 top-0 bottom-0 w-[3px]"
                          style={{
                            background: borderColor,
                            boxShadow: `0 0 8px ${borderColor}60`,
                            animation: isRed
                              ? "pulse 2s ease-in-out infinite"
                              : undefined,
                          }}
                        />
                        <span className="font-medium pl-2">
                          #{r.players.jersey_number} {r.players.name}
                        </span>
                        <Badge
                          variant="outline"
                          className={
                            isRed
                              ? "bg-[#ff3355]/15 text-[#ff3355] border-[#ff3355]/30 font-mono"
                              : "bg-[#ff6b35]/15 text-[#ff6b35] border-[#ff6b35]/30 font-mono"
                          }
                        >
                          ACWR {r.acwr_ratio}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recovery */}
          {avgRecovery !== null && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Team Recovery</CardTitle>
              </CardHeader>
              <CardContent>
                <p
                  className="text-3xl font-bold font-mono"
                  style={{ textShadow: "0 0 12px rgba(34,197,94,0.3)" }}
                >
                  {avgRecovery}{" "}
                  <span className="text-sm font-normal text-white/40">
                    bpm
                  </span>
                </p>
                <p className="text-[10px] uppercase tracking-widest text-white/40 mt-1">
                  Average HR drop in first 60s post-session
                </p>
                <p className="text-xs text-white/60 mt-2">
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

      {/* =========================================================== */}
      {/*  Coach Notes                                                 */}
      {/* =========================================================== */}
      {session.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              Coach Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-white/70">
              {session.notes}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
