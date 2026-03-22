"use client";

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
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtitle?: string;
  color?: string;
  infoTerm?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <Icon className={`h-4 w-4 ${color || "text-muted-foreground"}`} />
          <p className="text-xs text-muted-foreground">
            {infoTerm ? <MetricInfo term={infoTerm}>{label}</MetricInfo> : label}
          </p>
        </div>
        <p className="text-2xl font-bold font-mono">{value}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function SessionOverviewTab({
  session,
  metrics,
  loadRecords,
}: OverviewTabProps) {
  const hasData = metrics.length > 0;

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
          <p className="text-sm leading-relaxed">
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
            <span className="text-[10px] text-violet-400">
              Auto-generated analysis — will use Claude AI when connected
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
        />
        <StatCard
          icon={TrendingUp}
          label="Peak HR"
          value={`${maxHr} bpm`}
          subtitle={`Low: ${minHr} bpm`}
          color="text-orange-500"
          infoTerm="hr-max"
        />
        <StatCard
          icon={Zap}
          label="Avg TRIMP"
          value={avgTrimp ?? "--"}
          subtitle={intensityLabel ?? undefined}
          color={intensityColor || "text-muted-foreground"}
          infoTerm="trimp"
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
