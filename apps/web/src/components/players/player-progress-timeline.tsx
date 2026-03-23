"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { TrendingUp, TrendingDown, Minus, Brain, Loader2, Activity } from "lucide-react";
import { ExportShareBar } from "@/components/ui/export-share-bar";

// Dynamic import Recharts for SSR safety
const LineChart = dynamic(() => import("recharts").then((m) => m.LineChart), { ssr: false });
const Line = dynamic(() => import("recharts").then((m) => m.Line), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then((m) => m.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), { ssr: false });
const Legend = dynamic(() => import("recharts").then((m) => m.Legend), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((m) => m.ResponsiveContainer), { ssr: false });

interface ProgressData {
  date: string;
  trimp: number;
  hrRecovery: number | null;
  maxSpeed: number | null;
  sprintCount: number | null;
}

interface TrendResult {
  metric: string;
  recent: number;
  previous: number;
  change: number;
  direction: "up" | "down" | "stable";
  unit: string;
}

interface PlayerProgressTimelineProps {
  playerId: string;
  playerName: string;
  progressData: ProgressData[];
}

function computeTrends(data: ProgressData[]): TrendResult[] {
  if (data.length < 6) return [];

  const recent5 = data.slice(0, 5);
  const prev5 = data.slice(5, 10);

  if (prev5.length < 3) return [];

  const avg = (arr: (number | null)[]): number => {
    const valid = arr.filter((v): v is number => v !== null && v !== undefined);
    return valid.length > 0 ? valid.reduce((s, v) => s + v, 0) / valid.length : 0;
  };

  const metrics: { key: keyof ProgressData; label: string; unit: string; higherBetter: boolean }[] = [
    { key: "trimp", label: "TRIMP", unit: "", higherBetter: true },
    { key: "hrRecovery", label: "HR Recovery", unit: "bpm", higherBetter: true },
    { key: "maxSpeed", label: "Max Speed", unit: "km/h", higherBetter: true },
    { key: "sprintCount", label: "Sprint Count", unit: "", higherBetter: true },
  ];

  return metrics.map((m) => {
    const recentAvg = avg(recent5.map((d) => d[m.key] as number | null));
    const prevAvg = avg(prev5.map((d) => d[m.key] as number | null));
    const change = prevAvg > 0 ? ((recentAvg - prevAvg) / prevAvg) * 100 : 0;
    const direction: "up" | "down" | "stable" =
      Math.abs(change) < 3 ? "stable" : change > 0 ? "up" : "down";
    return {
      metric: m.label,
      recent: Math.round(recentAvg * 10) / 10,
      previous: Math.round(prevAvg * 10) / 10,
      change: Math.round(change * 10) / 10,
      direction,
      unit: m.unit,
    };
  });
}

function TrendArrow({ direction, positive }: { direction: "up" | "down" | "stable"; positive?: boolean }) {
  if (direction === "stable") return <Minus className="h-4 w-4 text-white/40" />;
  if (direction === "up") {
    return <TrendingUp className={`h-4 w-4 ${positive !== false ? "text-[#00ff88]" : "text-[#ff3355]"}`} />;
  }
  return <TrendingDown className={`h-4 w-4 ${positive !== false ? "text-[#ff3355]" : "text-[#00ff88]"}`} />;
}

export function PlayerProgressTimeline({ playerId, playerName, progressData }: PlayerProgressTimelineProps) {
  const [aiNarrative, setAiNarrative] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Trigger mount for chart rendering
  useState(() => { setMounted(true); });

  const trends = useMemo(() => computeTrends(progressData), [progressData]);

  const chartData = useMemo(() => {
    return [...progressData].reverse().map((d) => ({
      date: new Date(d.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      TRIMP: Math.round(d.trimp),
      "HR Recovery": d.hrRecovery,
      "Max Speed": d.maxSpeed ? Math.round(d.maxSpeed * 10) / 10 : null,
      "Sprint Count": d.sprintCount,
    }));
  }, [progressData]);

  const generateNarrative = async () => {
    setAiLoading(true);
    try {
      const trendContext = trends
        .map((t) => `${t.metric}: ${t.previous} -> ${t.recent} (${t.change > 0 ? "+" : ""}${t.change}%)`)
        .join(", ");
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Generate a "3 months ago vs now" progress narrative for ${playerName}. Use specific numbers from this data. Trends (last 5 vs previous 5 sessions): ${trendContext}. Total sessions analyzed: ${progressData.length}. Keep it 3-4 sentences, cite the exact numbers, and give a forward-looking recommendation.`,
            },
          ],
          context: `Player progress analysis for ${playerName}`,
        }),
      });
      const data = await res.json();
      setAiNarrative(data.reply);
    } catch {
      setAiNarrative("Unable to generate progress narrative at this time.");
    } finally {
      setAiLoading(false);
    }
  };

  const exportContent = useMemo(() => {
    const lines = [`## Player Progress: ${playerName}`, ""];
    if (trends.length > 0) {
      lines.push("## Key Trends (Last 5 vs Previous 5 Sessions)");
      trends.forEach((t) => {
        const arrow = t.direction === "up" ? "UP" : t.direction === "down" ? "DOWN" : "STABLE";
        lines.push(`- ${t.metric}: ${t.previous} -> ${t.recent} (${t.change > 0 ? "+" : ""}${t.change}%) ${arrow}`);
      });
    }
    if (aiNarrative) {
      lines.push("", "## AI Analysis", aiNarrative);
    }
    return lines.join("\n");
  }, [playerName, trends, aiNarrative]);

  if (progressData.length === 0) {
    return (
      <div
        className="rounded-xl border p-5"
        style={{
          background: "rgba(10,14,26,0.8)",
          borderColor: "rgba(255,255,255,0.06)",
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Activity className="h-4 w-4 text-[#00d4ff]" />
          <h3 className="text-sm font-semibold text-white">Progress Timeline</h3>
        </div>
        <p className="text-sm text-white/40">
          No progress data available yet. Data will appear once sessions with wearable and CV metrics are recorded.
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{
        background: "rgba(10,14,26,0.8)",
        borderColor: "rgba(0,212,255,0.12)",
        boxShadow: "0 0 30px rgba(0,212,255,0.04)",
      }}
    >
      <div className="p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#00d4ff]" />
            <h3 className="text-sm font-semibold text-white">Progress Timeline</h3>
            <span className="text-xs text-white/30 font-mono">{progressData.length} sessions</span>
          </div>
          <ExportShareBar title={`${playerName} Progress Timeline`} content={exportContent} />
        </div>

        {/* Trend Cards */}
        {trends.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            {trends.map((t) => (
              <div
                key={t.metric}
                className="rounded-lg px-3 py-2.5 transition-all duration-200 hover:scale-[1.02]"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-white/40 uppercase tracking-wider">{t.metric}</span>
                  <TrendArrow direction={t.direction} />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-bold font-mono text-white">{t.recent}</span>
                  {t.unit && <span className="text-xs text-white/30">{t.unit}</span>}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span
                    className="text-xs font-mono font-medium"
                    style={{
                      color:
                        t.direction === "up"
                          ? "#00ff88"
                          : t.direction === "down"
                          ? "#ff3355"
                          : "rgba(255,255,255,0.3)",
                    }}
                  >
                    {t.change > 0 ? "+" : ""}
                    {t.change}%
                  </span>
                  <span className="text-xs text-white/20">vs prev 5</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Chart */}
        {mounted && chartData.length > 1 && (
          <div
            className="rounded-lg p-4 mb-5"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.04)",
            }}
          >
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" fontSize={11} stroke="rgba(255,255,255,0.3)" />
                <YAxis fontSize={11} stroke="rgba(255,255,255,0.3)" />
                <Tooltip
                  contentStyle={{
                    background: "#0f1629",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Line
                  type="monotone"
                  dataKey="TRIMP"
                  stroke="#00d4ff"
                  strokeWidth={2}
                  dot={{ r: 2.5, fill: "#00d4ff" }}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="HR Recovery"
                  stroke="#00ff88"
                  strokeWidth={2}
                  dot={{ r: 2.5, fill: "#00ff88" }}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="Max Speed"
                  stroke="#ff6b35"
                  strokeWidth={2}
                  dot={{ r: 2.5, fill: "#ff6b35" }}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="Sprint Count"
                  stroke="#a855f7"
                  strokeWidth={2}
                  dot={{ r: 2.5, fill: "#a855f7" }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* AI Narrative */}
        <div className="space-y-2">
          {aiNarrative ? (
            <div
              className="rounded-lg px-3.5 py-3 text-sm text-white/70"
              style={{
                background: "rgba(168,85,247,0.06)",
                border: "1px solid rgba(168,85,247,0.15)",
              }}
            >
              <div className="flex items-start gap-2">
                <Brain className="h-4 w-4 shrink-0 mt-0.5 text-[#a855f7]" />
                <div>
                  <p className="text-xs text-[#a855f7] font-semibold mb-1">AI Progress Analysis</p>
                  <p className="leading-relaxed">{aiNarrative}</p>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={generateNarrative}
              disabled={aiLoading}
              className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg border transition-all duration-200 disabled:opacity-40 hover:bg-[#a855f7]/10"
              style={{
                borderColor: "rgba(168,85,247,0.25)",
                background: "rgba(168,85,247,0.06)",
                color: "#a855f7",
              }}
            >
              {aiLoading ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" /> Analyzing progress...
                </>
              ) : (
                <>
                  <Brain className="h-3 w-3" /> Generate &ldquo;3 Months Ago vs Now&rdquo; Analysis
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
