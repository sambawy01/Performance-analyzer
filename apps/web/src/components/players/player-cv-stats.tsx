"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { CvMetrics } from "@/types";

interface CvMetricWithSession extends Partial<CvMetrics> {
  session: { id: string; date: string; type: string } | null;
}

interface StatCardDef {
  key: keyof CvMetrics;
  label: string;
  color: string;
  hex: string;
  format: (v: number) => string;
}

const STAT_DEFS: StatCardDef[] = [
  {
    key: "total_distance_m",
    label: "Distance",
    color: "text-[#00d4ff]",
    hex: "#00d4ff",
    format: (v) => `${(v / 1000).toFixed(1)} km`,
  },
  {
    key: "max_speed_kmh",
    label: "Top Speed",
    color: "text-[#00ff88]",
    hex: "#00ff88",
    format: (v) => `${v.toFixed(1)} km/h`,
  },
  {
    key: "sprint_count",
    label: "Sprints",
    color: "text-[#ff6b35]",
    hex: "#ff6b35",
    format: (v) => `${v}`,
  },
  {
    key: "high_speed_run_count",
    label: "High Speed Runs",
    color: "text-[#a855f7]",
    hex: "#a855f7",
    format: (v) => `${v}`,
  },
  {
    key: "accel_events",
    label: "Accelerations",
    color: "text-[#00d4ff]",
    hex: "#00d4ff",
    format: (v) => `${v}`,
  },
  {
    key: "decel_events",
    label: "Decelerations",
    color: "text-[#ff3355]",
    hex: "#ff3355",
    format: (v) => `${v}`,
  },
  {
    key: "off_ball_movement_score",
    label: "Movement Score",
    color: "text-[#00ff88]",
    hex: "#00ff88",
    format: (v) => `${Math.round(v)}/100`,
  },
];

function computeTrend(values: number[]): { pct: number; direction: "up" | "down" | "flat" } {
  if (values.length < 2) return { pct: 0, direction: "flat" };
  const half = Math.ceil(values.length / 2);
  const early = values.slice(0, half);
  const recent = values.slice(-half);
  const avgEarly = early.reduce((s, v) => s + v, 0) / early.length;
  const avgRecent = recent.reduce((s, v) => s + v, 0) / recent.length;
  if (avgEarly === 0) return { pct: 0, direction: "flat" };
  const pct = Math.round(((avgRecent - avgEarly) / Math.abs(avgEarly)) * 100);
  return {
    pct: Math.abs(pct),
    direction: pct > 2 ? "up" : pct < -2 ? "down" : "flat",
  };
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

export function PlayerCvStats({ cvMetrics }: { cvMetrics: CvMetricWithSession[] }) {
  const [expanded, setExpanded] = useState<keyof CvMetrics | null>(null);

  if (cvMetrics.length === 0) return null;

  // Compute averages
  const avg = (key: keyof CvMetrics): number | null => {
    const vals = cvMetrics
      .map((m) => m[key] as number | null | undefined)
      .filter((v): v is number => v !== null && v !== undefined);
    if (vals.length === 0) return null;
    return vals.reduce((s, v) => s + v, 0) / vals.length;
  };

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
      <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-3">
        Physical Performance — Video Tracking (Avg per Session)
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {STAT_DEFS.map((stat) => {
          const avgVal = avg(stat.key);
          const isExpanded = expanded === stat.key;

          // Per-session values for trend + breakdown
          const sessionValues = cvMetrics
            .filter((m) => m[stat.key] !== null && m[stat.key] !== undefined && m.session?.date)
            .sort((a, b) => new Date(a.session!.date).getTime() - new Date(b.session!.date).getTime())
            .map((m) => ({
              date: m.session!.date,
              value: m[stat.key] as number,
            }));

          const trend = computeTrend(sessionValues.map((s) => s.value));

          return (
            <div key={stat.key} className="col-span-1">
              <button
                className={`w-full rounded-lg bg-white/[0.03] border transition-all text-left ${
                  isExpanded
                    ? "border-white/20 bg-white/[0.06]"
                    : "border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.05]"
                } p-2.5 text-center cursor-pointer`}
                onClick={() => setExpanded(isExpanded ? null : stat.key)}
                aria-expanded={isExpanded}
              >
                <p className={`font-mono text-lg font-bold ${stat.color}`}>
                  {avgVal !== null ? stat.format(avgVal) : "—"}
                </p>
                <p className="text-[10px] text-white/50 uppercase tracking-wider mt-0.5">
                  {stat.label}
                </p>
                {trend.direction !== "flat" && sessionValues.length >= 2 && (
                  <div
                    className={`flex items-center justify-center gap-0.5 mt-1 text-[9px] font-semibold ${
                      trend.direction === "up" ? "text-[#00ff88]" : "text-[#ff3355]"
                    }`}
                  >
                    {trend.direction === "up" ? (
                      <TrendingUp className="h-2.5 w-2.5" />
                    ) : (
                      <TrendingDown className="h-2.5 w-2.5" />
                    )}
                    {trend.pct}%
                  </div>
                )}
                {trend.direction === "flat" && sessionValues.length >= 2 && (
                  <div className="flex items-center justify-center gap-0.5 mt-1 text-[9px] text-white/30">
                    <Minus className="h-2.5 w-2.5" />
                    stable
                  </div>
                )}
              </button>

            </div>
          );
        })}
      </div>

      {/* Full-width expanded panel when any stat is expanded */}
      {expanded && (() => {
        const stat = STAT_DEFS.find((s) => s.key === expanded);
        if (!stat) return null;
        const sessionValues = cvMetrics
          .filter((m) => m[stat.key] !== null && m[stat.key] !== undefined && m.session?.date)
          .sort((a, b) => new Date(a.session!.date).getTime() - new Date(b.session!.date).getTime())
          .map((m) => ({ date: m.session!.date, type: m.session!.type, value: m[stat.key] as number }));

        if (sessionValues.length === 0) return null;
        const trend = computeTrend(sessionValues.map((s) => s.value));

        return (
          <div className="mt-3 rounded-lg border border-white/[0.08] bg-white/[0.02] p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-white/80">
                {stat.label} — Per Session Breakdown
              </p>
              {sessionValues.length >= 2 && (
                <div
                  className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                    trend.direction === "up"
                      ? "bg-[#00ff88]/10 text-[#00ff88]"
                      : trend.direction === "down"
                      ? "bg-[#ff3355]/10 text-[#ff3355]"
                      : "bg-white/5 text-white/40"
                  }`}
                >
                  {trend.direction === "up" && <TrendingUp className="h-3 w-3" />}
                  {trend.direction === "down" && <TrendingDown className="h-3 w-3" />}
                  {trend.direction === "flat" && <Minus className="h-3 w-3" />}
                  {trend.direction === "up"
                    ? `↑ ${trend.pct}% improvement`
                    : trend.direction === "down"
                    ? `↓ ${trend.pct}% decline`
                    : "Stable"}
                </div>
              )}
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {[...sessionValues].reverse().map((s, i) => {
                const maxVal = Math.max(...sessionValues.map((x) => x.value));
                const pct = maxVal > 0 ? (s.value / maxVal) * 100 : 0;
                return (
                  <div key={i} className="flex items-center gap-3 text-xs">
                    <span className="text-white/50 w-16 shrink-0">{formatDate(s.date)}</span>
                    <div className="flex-1 h-2 bg-white/[0.05] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: stat.hex }}
                      />
                    </div>
                    <span className={`font-mono font-semibold w-20 text-right ${stat.color}`}>
                      {stat.format(s.value)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
