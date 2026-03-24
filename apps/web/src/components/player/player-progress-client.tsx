"use client";

import dynamic from "next/dynamic";
import { Trophy, Zap, Heart, TrendingUp, TrendingDown } from "lucide-react";
import { MotivationCard } from "./motivation-card";

const PlayerProgressChart = dynamic(
  () => import("./player-progress-chart").then((m) => m.PlayerProgressChart),
  { ssr: false, loading: () => <div className="h-[260px] glass rounded-xl animate-pulse" /> }
);

interface Milestone {
  value: number;
  date: string;
  type?: string;
}

interface ComparisonItem {
  label: string;
  thisMonth: number;
  lastMonth: number;
  unit?: string;
}

interface PlayerProgressClientProps {
  playerId: string;
  timeline: Array<{
    date: string;
    trimp: number;
    maxSpeed: number;
    distance: number;
  }>;
  milestones: {
    bestSpeed: Milestone | null;
    bestTrimp: Milestone | null;
    bestRecovery: Milestone | null;
  };
  comparison: ComparisonItem[];
}

function formatDate(d: string) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
  });
}

export function PlayerProgressClient({
  playerId,
  timeline,
  milestones,
  comparison,
}: PlayerProgressClientProps) {
  return (
    <div className="space-y-5">
      {/* Progress Timeline Chart */}
      <div className="glass rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-white mb-1">
          Your Progress
        </h2>
        <p className="text-[10px] text-white/30 mb-3">
          TRIMP, Speed, and Distance over your last {timeline.length} sessions
        </p>
        <PlayerProgressChart data={timeline} />
        <div className="flex items-center justify-center gap-4 mt-2 text-[10px] text-white/40">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#a855f7]" />
            TRIMP
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#00d4ff]" />
            Max Speed
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#00ff88]" />
            Distance
          </span>
        </div>
      </div>

      {/* Milestone Cards */}
      <div>
        <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
          Personal Bests
        </h2>
        <div className="space-y-2">
          {milestones.bestSpeed && (
            <div className="glass rounded-xl p-4 border border-[#00d4ff]/10 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#00d4ff]/10 flex items-center justify-center flex-shrink-0">
                <Zap size={18} className="text-[#00d4ff]" />
              </div>
              <div>
                <p className="text-xs text-white/40">Best Sprint Speed</p>
                <p className="font-mono text-lg font-bold text-white">
                  {milestones.bestSpeed.value}{" "}
                  <span className="text-xs text-white/30">km/h</span>
                </p>
                <p className="text-[10px] text-white/25">
                  {formatDate(milestones.bestSpeed.date)}
                </p>
              </div>
            </div>
          )}
          {milestones.bestTrimp && (
            <div className="glass rounded-xl p-4 border border-[#a855f7]/10 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#a855f7]/10 flex items-center justify-center flex-shrink-0">
                <Trophy size={18} className="text-[#a855f7]" />
              </div>
              <div>
                <p className="text-xs text-white/40">Highest TRIMP</p>
                <p className="font-mono text-lg font-bold text-white">
                  {milestones.bestTrimp.value}
                </p>
                <p className="text-[10px] text-white/25">
                  {formatDate(milestones.bestTrimp.date)}
                  {milestones.bestTrimp.type
                    ? ` (${milestones.bestTrimp.type})`
                    : ""}
                </p>
              </div>
            </div>
          )}
          {milestones.bestRecovery && (
            <div className="glass rounded-xl p-4 border border-[#00ff88]/10 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#00ff88]/10 flex items-center justify-center flex-shrink-0">
                <Heart size={18} className="text-[#00ff88]" />
              </div>
              <div>
                <p className="text-xs text-white/40">Best Recovery</p>
                <p className="font-mono text-lg font-bold text-white">
                  {milestones.bestRecovery.value}{" "}
                  <span className="text-xs text-white/30">bpm/60s</span>
                </p>
                <p className="text-[10px] text-white/25">
                  {formatDate(milestones.bestRecovery.date)}
                </p>
              </div>
            </div>
          )}
          {!milestones.bestSpeed &&
            !milestones.bestTrimp &&
            !milestones.bestRecovery && (
              <div className="glass rounded-xl p-6 text-center text-sm text-white/30">
                Personal bests will appear as you train more!
              </div>
            )}
        </div>
      </div>

      {/* Month-over-Month Comparison */}
      <div>
        <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
          This Month vs Last Month
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {comparison.map((c) => {
            const diff =
              c.lastMonth > 0
                ? ((c.thisMonth - c.lastMonth) / c.lastMonth) * 100
                : 0;
            const isPositive = diff > 0;
            return (
              <div key={c.label} className="glass rounded-xl p-4">
                <span className="data-label">{c.label}</span>
                <div className="mt-1.5">
                  <span className="font-mono text-xl font-bold text-white">
                    {c.thisMonth}
                  </span>
                  {c.unit && (
                    <span className="text-[10px] text-white/30 ml-1">
                      {c.unit}
                    </span>
                  )}
                </div>
                {c.lastMonth > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    {isPositive ? (
                      <TrendingUp size={10} className="text-[#00ff88]" />
                    ) : diff < 0 ? (
                      <TrendingDown size={10} className="text-[#ff3355]" />
                    ) : null}
                    <span
                      className={`font-mono text-xs font-semibold ${
                        isPositive
                          ? "text-[#00ff88]"
                          : diff < 0
                          ? "text-[#ff3355]"
                          : "text-white/30"
                      }`}
                    >
                      {diff > 0 ? "+" : ""}
                      {diff.toFixed(0)}%
                    </span>
                    <span className="text-[10px] text-white/20">
                      vs {c.lastMonth}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Development Insight */}
      <MotivationCard playerId={playerId} context="development" />
    </div>
  );
}
