"use client";

import {
  Activity,
  Calendar,
  Users,
  TrendingUp,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { type WeekPlan, INTENSITY_COLORS } from "./types";

interface WeekSummaryProps {
  plan: WeekPlan | null;
}

function StatBlock({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <Icon
          className="h-3.5 w-3.5"
          style={{ color: color ?? "rgba(255,255,255,0.4)" }}
        />
        <span className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">
          {label}
        </span>
      </div>
      <span
        className="font-mono text-lg font-bold"
        style={{ color: color ?? "#e2e8f0" }}
      >
        {value}
      </span>
    </div>
  );
}

export function WeekSummary({ plan }: WeekSummaryProps) {
  if (!plan) {
    return (
      <div className="glass rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="h-4 w-4 text-white/40" />
          <h3 className="text-sm font-semibold text-white/60">Week Summary</h3>
        </div>
        <p className="text-xs text-white/30 italic">
          Generate a weekly plan to see the summary and AI analysis.
        </p>
      </div>
    );
  }

  const acwrColor =
    plan.predictedEndOfWeekACWR <= 1.3
      ? "#00ff88"
      : plan.predictedEndOfWeekACWR <= 1.5
      ? "#ff6b35"
      : "#ff3355";

  return (
    <div className="glass rounded-xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-[#00d4ff]" />
          <h3 className="text-sm font-semibold">Week Summary</h3>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[#a855f7]/80 bg-[#a855f7]/10 px-2 py-0.5 rounded">
          <Sparkles className="h-2.5 w-2.5" />
          AI Analysis
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBlock
          icon={Activity}
          label="Total Load"
          value={plan.totalLoad}
          color="#00d4ff"
        />
        <StatBlock
          icon={Calendar}
          label="Sessions"
          value={plan.sessionsPlanned}
          color="#00ff88"
        />
        <StatBlock
          icon={Users}
          label="Need Rest"
          value={plan.playersNeedingRest.length}
          color={plan.playersNeedingRest.length > 3 ? "#ff3355" : "#ff6b35"}
        />
        <StatBlock
          icon={TrendingUp}
          label="Predicted ACWR"
          value={plan.predictedEndOfWeekACWR.toFixed(2)}
          color={acwrColor}
        />
      </div>

      {/* Players Needing Rest */}
      {plan.playersNeedingRest.length > 0 && (
        <div className="border-t border-white/[0.06] pt-3">
          <div className="flex items-center gap-1.5 mb-2">
            <AlertTriangle className="h-3.5 w-3.5 text-[#ff6b35]" />
            <span className="text-xs font-semibold text-white/60">
              Players Needing Rest
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {plan.playersNeedingRest.map((p) => (
              <span
                key={p.jerseyNumber}
                className="inline-flex items-center gap-1 text-[11px] bg-[#ff6b35]/10 text-[#ff6b35] px-2 py-0.5 rounded font-medium"
              >
                #{p.jerseyNumber} {p.name}
                <span className="text-[#ff6b35]/60">- {p.reason}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* AI Commentary */}
      {plan.aiCommentary && (
        <div className="border-t border-white/[0.06] pt-3">
          <div className="flex items-start gap-2">
            <Sparkles className="h-3.5 w-3.5 text-[#a855f7] mt-0.5 shrink-0" />
            <p className="text-xs text-white/50 leading-relaxed italic">
              {plan.aiCommentary}
            </p>
          </div>
        </div>
      )}

      {/* Intensity Distribution Mini Bar */}
      <div className="border-t border-white/[0.06] pt-3">
        <span className="text-[10px] uppercase tracking-wider text-white/30 font-semibold mb-2 block">
          Intensity Distribution
        </span>
        <div className="flex gap-1 h-2 rounded-full overflow-hidden">
          {plan.days
            .filter((d) => d.type !== "rest")
            .map((d, i) => (
              <div
                key={i}
                className="flex-1 rounded-full"
                style={{
                  backgroundColor: INTENSITY_COLORS[d.intensity],
                  opacity: 0.8,
                }}
                title={`${d.date}: ${d.intensity}`}
              />
            ))}
        </div>
        <div className="flex justify-between mt-1.5">
          {(
            [
              ["High", "#ff3355"],
              ["Medium", "#ff6b35"],
              ["Low", "#00ff88"],
              ["Recovery", "#00d4ff"],
              ["Match", "#a855f7"],
            ] as const
          ).map(([label, color]) => (
            <div key={label} className="flex items-center gap-1">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-[9px] text-white/30">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
