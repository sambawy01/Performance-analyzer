"use client";

import { useState, useMemo } from "react";
import { Brain, Loader2, Sparkles, Plus, X } from "lucide-react";
import { ComparisonRadarWrapper } from "./comparison-radar-wrapper";

const PLAYER_COLORS = ["#00d4ff", "#00ff88", "#ff6b35", "#a855f7"];

interface EnrichedPlayer {
  id: string;
  name: string;
  jersey_number: number;
  position: string;
  age_group: string;
  acwr: number | null;
  riskFlag: string | null;
  hrAvg: number | null;
  hrMax: number | null;
  trimp: number | null;
  recovery: number | null;
  maxSpeedKmh: number | null;
  sprintCount: number | null;
  distanceKm: number | null;
  hsrCount: number | null;
  accelEvents: number | null;
  decelEvents: number | null;
  movementScore: number | null;
}

interface PlayerComparisonProps {
  players: EnrichedPlayer[];
}

const METRICS: { key: keyof EnrichedPlayer; label: string; unit?: string; higherBetter: boolean }[] = [
  { key: "hrAvg", label: "Avg HR", unit: "bpm", higherBetter: false },
  { key: "hrMax", label: "Peak HR", unit: "bpm", higherBetter: true },
  { key: "trimp", label: "TRIMP Score", higherBetter: true },
  { key: "recovery", label: "HR Recovery 60s", unit: "bpm", higherBetter: true },
  { key: "acwr", label: "ACWR", higherBetter: false },
  { key: "maxSpeedKmh", label: "Max Speed", unit: "km/h", higherBetter: true },
  { key: "sprintCount", label: "Sprint Count", higherBetter: true },
  { key: "distanceKm", label: "Distance", unit: "km", higherBetter: true },
  { key: "hsrCount", label: "High Speed Runs", higherBetter: true },
  { key: "accelEvents", label: "Accelerations", higherBetter: true },
  { key: "decelEvents", label: "Decelerations", higherBetter: false },
  { key: "movementScore", label: "Movement Score", higherBetter: true },
];

// Absolute ranges for meaningful normalization (not relative to selected players)
const ABSOLUTE_RANGES: Record<string, { min: number; max: number }> = {
  hrAvg: { min: 120, max: 185 },
  hrMax: { min: 160, max: 210 },
  trimp: { min: 50, max: 250 },
  recovery: { min: 10, max: 45 },
  acwr: { min: 0.6, max: 1.8 },
  maxSpeedKmh: { min: 18, max: 35 },
  sprintCount: { min: 3, max: 30 },
  distanceKm: { min: 3, max: 12 },
  hsrCount: { min: 5, max: 50 },
  accelEvents: { min: 5, max: 60 },
  decelEvents: { min: 5, max: 60 },
  movementScore: { min: 0, max: 100 },
};

function normalize(value: number | null, key: string, higherBetter: boolean): number {
  if (value === null) return 0;
  const range = ABSOLUTE_RANGES[key] ?? { min: 0, max: 100 };
  let score = ((value - range.min) / (range.max - range.min)) * 100;
  score = Math.max(0, Math.min(100, score));
  // Invert for metrics where lower is better (ACWR, Avg HR)
  if (!higherBetter) score = 100 - score;
  return Math.round(score);
}

function formatMarkdown(text: string) {
  return text.split("\n").map((line, i) => {
    if (!line.trim()) return <div key={i} className="h-1" />;
    const html = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
    if (line.trim().startsWith("##")) {
      return <p key={i} className="text-sm font-semibold text-white mt-3 first:mt-0">{line.replace(/^#+\s*/, "")}</p>;
    }
    if (line.trim().startsWith("- ")) {
      return (
        <div key={i} className="flex items-start gap-2 text-sm ml-2">
          <span className="text-[#00d4ff] mt-1 shrink-0">•</span>
          <span className="text-white/70" dangerouslySetInnerHTML={{ __html: html.replace(/^-\s*/, "") }} />
        </div>
      );
    }
    return <p key={i} className="text-sm text-white/70 leading-relaxed" dangerouslySetInnerHTML={{ __html: html }} />;
  });
}

export function PlayerComparison({ players }: PlayerComparisonProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    // Default to first 2 players that have data
    const withData = players.filter((p) => p.hrAvg !== null || p.trimp !== null);
    return withData.slice(0, 2).map((p) => p.id);
  });
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const selectedPlayers = useMemo(
    () => players.filter((p) => selectedIds.includes(p.id)),
    [players, selectedIds]
  );

  const addSlot = () => {
    if (selectedIds.length < 4) {
      const next = players.find((p) => !selectedIds.includes(p.id));
      if (next) setSelectedIds([...selectedIds, next.id]);
    }
  };

  const removeSlot = (id: string) => {
    if (selectedIds.length > 2) setSelectedIds(selectedIds.filter((x) => x !== id));
  };

  const updateSlot = (index: number, id: string) => {
    const updated = [...selectedIds];
    updated[index] = id;
    setSelectedIds(updated);
  };

  // Build radar data with absolute normalization
  const radarData = METRICS.slice(0, 6).map((m) => {
    const point: { subject: string; [key: string]: string | number } = { subject: m.label };
    selectedPlayers.forEach((p) => {
      point[p.name] = normalize(p[m.key] as number | null, m.key, m.higherBetter);
    });
    return point;
  });

  const handleAiCompare = async () => {
    if (selectedPlayers.length < 2) return;
    setAiLoading(true);
    setAiAnalysis(null);
    try {
      const playerSummaries = selectedPlayers.map((p) =>
        `${p.name} (#${p.jersey_number}, ${p.position}, ${p.age_group}): ACWR=${p.acwr ?? "N/A"} (${p.riskFlag ?? "N/A"}), TRIMP=${p.trimp ?? "N/A"}, HR avg=${p.hrAvg ?? "N/A"}, Recovery=${p.recovery ?? "N/A"} bpm, Max Speed=${p.maxSpeedKmh ?? "N/A"} km/h, Sprints=${p.sprintCount ?? "N/A"}, Distance=${p.distanceKm !== null ? p.distanceKm.toFixed(2) + " km" : "N/A"}, HSR=${p.hsrCount ?? "N/A"}, Accels=${p.accelEvents ?? "N/A"}, Decels=${p.decelEvents ?? "N/A"}, Movement Score=${p.movementScore ?? "N/A"}`
      ).join("\n");

      const question = `Compare these players:\n${playerSummaries}\n\nWho is better suited for each position? Who is improving faster? Who carries more injury risk? Give specific recommendations on who to start and who needs rest.`;

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: question }],
          context: "Player comparison tool — coach comparing multiple players.",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setAiAnalysis(data.reply);
    } catch (e) {
      setAiAnalysis(`Error: ${e instanceof Error ? e.message : "AI comparison failed"}`);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Player selectors */}
      <div className="rounded-xl border border-white/[0.08] p-5"
        style={{ background: "rgba(10,14,26,0.8)" }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white/80">Select Players</h3>
          {selectedIds.length < 4 && (
            <button
              onClick={addSlot}
              className="flex items-center gap-1.5 text-xs text-[#00d4ff] hover:text-[#00d4ff]/80 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Player
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {selectedIds.map((id, index) => {
            const color = PLAYER_COLORS[index % PLAYER_COLORS.length];
            return (
              <div key={index} className="relative">
                <div
                  className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full"
                  style={{ background: color }}
                />
                <div className="pl-3">
                  <select
                    value={id}
                    onChange={(e) => updateSlot(index, e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-white/20 cursor-pointer"
                  >
                    {players.map((p) => (
                      <option key={p.id} value={p.id} className="bg-[#0a0e1a]">
                        #{p.jersey_number} {p.name} ({p.age_group})
                      </option>
                    ))}
                  </select>
                  {selectedIds.length > 2 && (
                    <button
                      onClick={() => removeSlot(id)}
                      className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[#ff3355]/80 flex items-center justify-center hover:bg-[#ff3355] transition-colors"
                    >
                      <X className="h-2.5 w-2.5 text-white" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stat cards side by side */}
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${selectedPlayers.length}, 1fr)` }}>
        {selectedPlayers.map((player, i) => {
          const color = PLAYER_COLORS[i % PLAYER_COLORS.length];
          return (
            <div
              key={player.id}
              className="rounded-xl border p-4 space-y-3"
              style={{
                background: "rgba(10,14,26,0.8)",
                borderColor: `${color}30`,
                boxShadow: `0 0 20px ${color}08`,
              }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{ background: `${color}25`, border: `1px solid ${color}40` }}
                >
                  #{player.jersey_number}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white leading-tight">{player.name}</p>
                  <p className="text-xs text-white/40">{player.position} · {player.age_group}</p>
                </div>
              </div>

              <div className="space-y-2">
                {METRICS.map((m) => {
                  const val = player[m.key];
                  return (
                    <div key={m.key} className="flex items-center justify-between">
                      <span className="text-xs text-white/40">{m.label}</span>
                      <span className="text-xs font-mono" style={{ color }}>
                        {val !== null && val !== undefined
                          ? `${val}${m.unit ? ` ${m.unit}` : ""}`
                          : "—"}
                      </span>
                    </div>
                  );
                })}
              </div>

              {player.riskFlag && (
                <div
                  className="rounded-lg px-2.5 py-1.5 text-center text-xs font-medium"
                  style={{
                    background:
                      player.riskFlag === "red"
                        ? "rgba(255,51,85,0.15)"
                        : player.riskFlag === "amber"
                        ? "rgba(255,107,53,0.15)"
                        : "rgba(0,255,136,0.1)",
                    color:
                      player.riskFlag === "red"
                        ? "#ff3355"
                        : player.riskFlag === "amber"
                        ? "#ff6b35"
                        : "#00ff88",
                  }}
                >
                  ACWR {player.acwr ?? "N/A"} · {player.riskFlag?.toUpperCase()}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Radar chart */}
      <div className="rounded-xl border border-white/[0.08] p-5"
        style={{ background: "rgba(10,14,26,0.8)" }}>
        <h3 className="text-sm font-semibold text-white/80 mb-4">Performance Radar</h3>
        <ComparisonRadarWrapper
          data={radarData}
          playerNames={selectedPlayers.map((p) => p.name)}
        />
        <p className="text-xs text-white/30 text-center mt-2">
          Values normalized 0–100 relative to selected players
        </p>
      </div>

      {/* AI Compare button + output */}
      <div className="rounded-xl border border-white/[0.08] p-5 space-y-4"
        style={{ background: "rgba(10,14,26,0.8)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-[#a855f7]" />
            <h3 className="text-sm font-semibold text-white/80">AI Comparison Analysis</h3>
          </div>
          <button
            onClick={handleAiCompare}
            disabled={aiLoading || selectedPlayers.length < 2}
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-all duration-300 disabled:opacity-40"
            style={{
              background: "linear-gradient(135deg, #a855f7 0%, #00d4ff 100%)",
              boxShadow: !aiLoading ? "0 0 20px rgba(168,85,247,0.3)" : undefined,
            }}
          >
            {aiLoading ? (
              <><Loader2 className="h-3 w-3 animate-spin" /> Analyzing...</>
            ) : (
              <><Sparkles className="h-3 w-3" /> AI Compare</>
            )}
          </button>
        </div>

        {aiAnalysis && (
          <div className="space-y-1.5 pt-2 border-t border-white/[0.06]">
            {formatMarkdown(aiAnalysis)}
          </div>
        )}

        {!aiAnalysis && !aiLoading && (
          <p className="text-sm text-white/30 text-center py-4">
            Click &ldquo;AI Compare&rdquo; to get a detailed analysis from Coach M8
          </p>
        )}
      </div>

      {/* Comparison table */}
      <div className="rounded-xl border border-white/[0.08] overflow-hidden"
        style={{ background: "rgba(10,14,26,0.8)" }}>
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="text-xs font-medium text-white/40 text-left px-4 py-3">Metric</th>
              {selectedPlayers.map((p, i) => (
                <th key={p.id} className="text-xs font-medium text-left px-4 py-3"
                  style={{ color: PLAYER_COLORS[i % PLAYER_COLORS.length] }}>
                  #{p.jersey_number} {p.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {METRICS.map((m, rowIdx) => {
              // Find best value
              const vals = selectedPlayers.map((p) => p[m.key] as number | null);
              const numericVals = vals.filter((v) => v !== null) as number[];
              const best = numericVals.length > 0
                ? m.higherBetter
                  ? Math.max(...numericVals)
                  : Math.min(...numericVals)
                : null;

              return (
                <tr
                  key={m.key}
                  className={`border-b border-white/[0.04] ${rowIdx % 2 === 0 ? "bg-white/[0.01]" : ""}`}
                >
                  <td className="text-xs text-white/50 px-4 py-3">{m.label}</td>
                  {selectedPlayers.map((p, i) => {
                    const val = p[m.key] as number | null;
                    const isBest = val !== null && val === best && numericVals.length > 1;
                    return (
                      <td key={p.id} className="px-4 py-3">
                        <span
                          className={`text-xs font-mono ${isBest ? "font-semibold" : ""}`}
                          style={{
                            color: isBest
                              ? PLAYER_COLORS[i % PLAYER_COLORS.length]
                              : "rgba(255,255,255,0.45)",
                          }}
                        >
                          {val !== null ? `${val}${m.unit ? ` ${m.unit}` : ""}` : "—"}
                          {isBest && " ↑"}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
