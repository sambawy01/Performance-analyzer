"use client";

import type { TacticalMetrics } from "@/types";

interface FormationStatsProps {
  tacticalMetrics: TacticalMetrics[];
  goalsBySession: Record<string, number>;
}

interface FormationSummary {
  formation: string;
  count: number;
  avgPpda: number | null;
  avgPossession: number | null;
  avgTransitionSpeed: number | null;
  goalsScored: number;
}

export function FormationStats({
  tacticalMetrics,
  goalsBySession,
}: FormationStatsProps) {
  const formationMap = new Map<string, FormationSummary>();

  for (const tm of tacticalMetrics) {
    const f = tm.avg_formation ?? "Unknown";
    const existing = formationMap.get(f) ?? {
      formation: f,
      count: 0,
      avgPpda: null,
      avgPossession: null,
      avgTransitionSpeed: null,
      goalsScored: 0,
    };

    existing.count += 1;
    existing.goalsScored += goalsBySession[tm.session_id] ?? 0;

    if (tm.pressing_intensity != null) {
      existing.avgPpda =
        ((existing.avgPpda ?? 0) * (existing.count - 1) +
          tm.pressing_intensity) /
        existing.count;
    }
    if (tm.possession_pct != null) {
      existing.avgPossession =
        ((existing.avgPossession ?? 0) * (existing.count - 1) +
          tm.possession_pct) /
        existing.count;
    }
    if (tm.transition_speed_atk_s != null) {
      existing.avgTransitionSpeed =
        ((existing.avgTransitionSpeed ?? 0) * (existing.count - 1) +
          tm.transition_speed_atk_s) /
        existing.count;
    }

    formationMap.set(f, existing);
  }

  const formations = Array.from(formationMap.values()).sort(
    (a, b) => b.count - a.count
  );

  if (formations.length === 0) {
    return (
      <div className="glass rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-3">Formation Comparison</h3>
        <p className="text-xs text-muted-foreground">
          No formation data available yet. Play matches to see formation stats.
        </p>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-4">
      <h3 className="text-sm font-semibold mb-3">Formation Comparison</h3>
      <div className="space-y-2">
        {formations.map((f) => (
          <div
            key={f.formation}
            className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2 text-xs"
          >
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-[#00d4ff] text-sm">
                {f.formation}
              </span>
              <span className="text-muted-foreground">
                ({f.count} {f.count === 1 ? "match" : "matches"})
              </span>
            </div>
            <div className="flex items-center gap-4 text-muted-foreground">
              {f.avgPpda != null && (
                <span>
                  PPDA:{" "}
                  <span className="font-mono text-white">
                    {f.avgPpda.toFixed(1)}
                  </span>
                </span>
              )}
              {f.avgPossession != null && (
                <span>
                  Poss:{" "}
                  <span className="font-mono text-white">
                    {f.avgPossession.toFixed(0)}%
                  </span>
                </span>
              )}
              {f.avgTransitionSpeed != null && (
                <span>
                  Trans:{" "}
                  <span className="font-mono text-white">
                    {f.avgTransitionSpeed.toFixed(1)}s
                  </span>
                </span>
              )}
              <span>
                Goals:{" "}
                <span className="font-mono text-[#00ff88]">
                  {f.goalsScored}
                </span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
