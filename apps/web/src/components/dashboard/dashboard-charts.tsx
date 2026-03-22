"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

interface TrendSession {
  id: string;
  date: string;
  wearable_metrics: Array<{
    hr_avg: number;
    hr_max: number;
    trimp_score: number;
  }>;
}

interface DashboardChartsProps {
  trendData: TrendSession[];
  riskDistribution: { blue: number; green: number; amber: number; red: number };
}

const RISK_COLORS: Record<string, string> = {
  blue: "#3b82f6",
  green: "#22c55e",
  amber: "#f59e0b",
  red: "#ef4444",
};

const RISK_LABELS: Record<string, string> = {
  blue: "Under-training",
  green: "Optimal",
  amber: "Caution",
  red: "High Risk",
};

export function DashboardCharts({ trendData, riskDistribution }: DashboardChartsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-[300px] rounded-lg border bg-card animate-pulse" />
        <div className="h-[300px] rounded-lg border bg-card animate-pulse" />
      </div>
    );
  }

  // Process trend data
  const chartData = trendData.map((s) => {
    const metrics = s.wearable_metrics ?? [];
    const avgHr =
      metrics.length > 0
        ? Math.round(metrics.reduce((sum, m) => sum + m.hr_avg, 0) / metrics.length)
        : 0;
    const avgTrimp =
      metrics.length > 0
        ? Math.round(metrics.reduce((sum, m) => sum + m.trimp_score, 0) / metrics.length)
        : 0;
    return {
      date: new Date(s.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      avgHr,
      avgTrimp,
    };
  });

  const riskEntries = Object.entries(riskDistribution).filter(([, v]) => v > 0);
  const riskTotal = riskEntries.reduce((s, [, v]) => s + v, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Session Intensity - simple bar chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Session Intensity (14 days)</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No session data in the last 14 days.</p>
          ) : (
            <div className="space-y-3">
              {chartData.map((d, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{d.date}</span>
                    <span className="font-medium">
                      {d.avgHr > 0 ? `${d.avgHr} bpm` : "No HR"}
                      {d.avgTrimp > 0 ? ` · TRIMP ${d.avgTrimp}` : ""}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {d.avgHr > 0 && (
                      <div className="h-3 rounded-full bg-blue-500" style={{ width: `${Math.min((d.avgHr / 200) * 100, 100)}%` }} title={`Avg HR: ${d.avgHr}`} />
                    )}
                    {d.avgTrimp > 0 && (
                      <div className="h-3 rounded-full bg-orange-500" style={{ width: `${Math.min((d.avgTrimp / 300) * 100, 100)}%` }} title={`TRIMP: ${d.avgTrimp}`} />
                    )}
                    {d.avgHr === 0 && d.avgTrimp === 0 && (
                      <div className="h-3 rounded-full bg-muted w-full" />
                    )}
                  </div>
                </div>
              ))}
              <div className="flex gap-4 text-xs text-muted-foreground mt-2 pt-2 border-t">
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  Avg HR
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-orange-500" />
                  Avg TRIMP
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Risk Distribution - simple visual */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Injury Risk Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {riskTotal === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No load data yet.</p>
          ) : (
            <div className="space-y-4">
              {/* Stacked bar */}
              <div className="h-8 rounded-full overflow-hidden flex">
                {riskEntries.map(([key, value]) => (
                  <div
                    key={key}
                    className="h-full transition-all"
                    style={{
                      width: `${(value / riskTotal) * 100}%`,
                      backgroundColor: RISK_COLORS[key],
                    }}
                    title={`${RISK_LABELS[key]}: ${value}`}
                  />
                ))}
              </div>

              {/* Legend */}
              <div className="grid grid-cols-2 gap-3">
                {riskEntries.map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: RISK_COLORS[key] }}
                    />
                    <div>
                      <p className="text-sm font-medium">{value} players</p>
                      <p className="text-xs text-muted-foreground">{RISK_LABELS[key]}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <p className="text-xs text-muted-foreground border-t pt-3">
                {riskDistribution.red > 0
                  ? `${riskDistribution.red} player${riskDistribution.red > 1 ? "s" : ""} in the danger zone — immediate load reduction recommended.`
                  : riskDistribution.amber > 0
                    ? `${riskDistribution.amber} player${riskDistribution.amber > 1 ? "s" : ""} approaching danger zone — monitor closely.`
                    : "All players within safe load ranges."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
