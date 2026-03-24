"use client";

import dynamic from "next/dynamic";
import { TrendingUp, TrendingDown, AlertTriangle, Shield, ShieldCheck } from "lucide-react";
import { PositionHeatmap } from "./position-heatmap";

const PlayerStatsRadar = dynamic(
  () => import("./player-stats-radar").then((m) => m.PlayerStatsRadar),
  { ssr: false, loading: () => <div className="h-[280px] glass rounded-xl animate-pulse" /> }
);

interface MetricItem {
  label: string;
  value: string;
  unit: string;
  trend: number;
  context: string;
  risk?: string;
}

interface PlayerStatsClientProps {
  radarData: Array<{ metric: string; value: number; avg: number }>;
  metrics: MetricItem[];
  positionData: Array<{ x: number; y: number }>;
  playerPosition: string | null;
}

function getRiskBadge(risk: string) {
  switch (risk) {
    case "high":
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-[#ff3355]/10 text-[#ff3355] px-2 py-0.5 rounded-full">
          <AlertTriangle size={10} /> High Risk
        </span>
      );
    case "moderate":
    case "caution":
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-[#ff6b35]/10 text-[#ff6b35] px-2 py-0.5 rounded-full">
          <Shield size={10} /> Caution
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-[#00ff88]/10 text-[#00ff88] px-2 py-0.5 rounded-full">
          <ShieldCheck size={10} /> Optimal
        </span>
      );
  }
}

export function PlayerStatsClient({
  radarData,
  metrics,
  positionData,
  playerPosition,
}: PlayerStatsClientProps) {
  return (
    <div className="space-y-5">
      {/* Radar Chart */}
      <div className="glass rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-white mb-1">
          Your Performance Profile
        </h2>
        <p className="text-[10px] text-white/30 mb-3">
          Compared to squad average (dashed line)
        </p>
        <PlayerStatsRadar data={radarData} />
        <div className="flex items-center justify-center gap-4 text-[10px] text-white/40">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#00d4ff]" />
            You
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-0.5 bg-white/20" style={{ borderTop: "1px dashed rgba(255,255,255,0.3)" }} />
            Squad Avg
          </span>
        </div>
      </div>

      {/* Detailed Metrics Grid */}
      <div>
        <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
          Detailed Metrics
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="glass rounded-xl p-4 hover:bg-white/[0.06] transition-colors"
            >
              <span className="data-label">{m.label}</span>
              <div className="flex items-baseline gap-1.5 mt-1.5">
                <span className="font-mono text-xl font-bold text-white">
                  {m.value}
                </span>
                {m.unit && (
                  <span className="text-[10px] text-white/30">{m.unit}</span>
                )}
              </div>
              {m.trend !== 0 && (
                <div className="flex items-center gap-1 mt-1">
                  {m.trend > 0 ? (
                    <TrendingUp size={10} className="text-[#00ff88]" />
                  ) : (
                    <TrendingDown size={10} className="text-[#ff3355]" />
                  )}
                  <span
                    className={`text-[10px] font-mono font-semibold ${
                      m.trend > 0 ? "text-[#00ff88]" : "text-[#ff3355]"
                    }`}
                  >
                    {m.trend > 0 ? "+" : ""}
                    {m.trend}
                  </span>
                </div>
              )}
              {"risk" in m && m.risk && (
                <div className="mt-2">{getRiskBadge(m.risk)}</div>
              )}
              <p className="text-[10px] text-white/30 mt-1.5">{m.context}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Position Heatmap */}
      <div>
        <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
          Average Position
        </h2>
        <PositionHeatmap data={positionData} position={playerPosition} />
      </div>
    </div>
  );
}
