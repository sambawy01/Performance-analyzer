"use client";

import { useState, useCallback } from "react";
import {
  PitchDiagram,
  type PitchPlayer,
  type Formation,
} from "./pitch-diagram";
import { FormationStats } from "./formation-stats";
import {
  Brain,
  GripVertical,
  AlertTriangle,
  ShieldAlert,
  Clock,
  ChevronDown,
} from "lucide-react";
import type { TacticalMetrics } from "@/types";

interface SquadBuilderProps {
  players: PitchPlayer[];
  tacticalMetrics: TacticalMetrics[];
  goalsBySession: Record<string, number>;
}

interface AiRecommendation {
  startingXI: Array<{
    playerId: string;
    name: string;
    jersey: number;
    position: string;
    reason: string;
  }>;
  bench: Array<{
    playerId: string;
    name: string;
    jersey: number;
    position: string;
  }>;
  excluded: Array<{
    playerId: string;
    name: string;
    jersey: number;
    reason: string;
  }>;
  subTiming: Array<{
    minute: number;
    playerOut: string;
    playerIn: string;
    reason: string;
  }>;
  reasoning: string;
}

function getRiskBadgeClass(flag: string | null): string {
  switch (flag) {
    case "green":
      return "bg-[#00ff88]/20 text-[#00ff88]";
    case "blue":
      return "bg-[#00d4ff]/20 text-[#00d4ff]";
    case "amber":
      return "bg-[#ff6b35]/20 text-[#ff6b35]";
    case "red":
      return "bg-[#ff3355]/20 text-[#ff3355]";
    default:
      return "bg-white/10 text-white/50";
  }
}

function getRiskDot(flag: string | null): string {
  switch (flag) {
    case "green":
      return "bg-[#00ff88]";
    case "blue":
      return "bg-[#00d4ff]";
    case "amber":
      return "bg-[#ff6b35]";
    case "red":
      return "bg-[#ff3355]";
    default:
      return "bg-white/30";
  }
}

export function SquadBuilder({
  players,
  tacticalMetrics,
  goalsBySession,
}: SquadBuilderProps) {
  const [formation, setFormation] = useState<Formation>("4-3-3");
  const [opponent, setOpponent] = useState("");
  const [matchDate, setMatchDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedPlayer, setSelectedPlayer] = useState<PitchPlayer | null>(
    null
  );
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AiRecommendation | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Split players into categories
  const excluded = players.filter(
    (p) => p.riskFlag === "red" || p.recentForm === "injured"
  );
  const available = players.filter(
    (p) => p.riskFlag !== "red" && p.recentForm !== "injured"
  );

  // Default starting XI: first 11 available players
  const [startingXIIds, setStartingXIIds] = useState<string[]>(() =>
    available.slice(0, 11).map((p) => p.id)
  );
  const [benchIds, setBenchIds] = useState<string[]>(() =>
    available.slice(11, 18).map((p) => p.id)
  );

  const startingXI = startingXIIds
    .map((id) => players.find((p) => p.id === id))
    .filter(Boolean) as PitchPlayer[];
  const bench = benchIds
    .map((id) => players.find((p) => p.id === id))
    .filter(Boolean) as PitchPlayer[];

  const [dragSource, setDragSource] = useState<{
    id: string;
    from: "starting" | "bench";
  } | null>(null);

  const handleDragStart = useCallback(
    (id: string, from: "starting" | "bench") => {
      setDragSource({ id, from });
    },
    []
  );

  const handleDrop = useCallback(
    (targetId: string, targetList: "starting" | "bench") => {
      if (!dragSource) return;

      const sourceList = dragSource.from;
      const sourceId = dragSource.id;

      if (sourceList === targetList && sourceId === targetId) {
        setDragSource(null);
        return;
      }

      setStartingXIIds((prev) => {
        const next = [...prev];
        if (sourceList === "starting" && targetList === "starting") {
          const si = next.indexOf(sourceId);
          const ti = next.indexOf(targetId);
          if (si !== -1 && ti !== -1) {
            next[si] = targetId;
            next[ti] = sourceId;
          }
        } else if (sourceList === "bench" && targetList === "starting") {
          const ti = next.indexOf(targetId);
          if (ti !== -1) next[ti] = sourceId;
        } else if (sourceList === "starting" && targetList === "bench") {
          const si = next.indexOf(sourceId);
          if (si !== -1) next[si] = targetId;
        }
        return next;
      });

      setBenchIds((prev) => {
        const next = [...prev];
        if (sourceList === "bench" && targetList === "bench") {
          const si = next.indexOf(sourceId);
          const ti = next.indexOf(targetId);
          if (si !== -1 && ti !== -1) {
            next[si] = targetId;
            next[ti] = sourceId;
          }
        } else if (sourceList === "starting" && targetList === "bench") {
          const ti = next.indexOf(targetId);
          if (ti !== -1) next[ti] = sourceId;
        } else if (sourceList === "bench" && targetList === "starting") {
          const si = next.indexOf(sourceId);
          if (si !== -1) next[si] = targetId;
        }
        return next;
      });

      setDragSource(null);
    },
    [dragSource]
  );

  const handleAiRecommend = async () => {
    setAiLoading(true);
    setAiError(null);
    setAiResult(null);

    try {
      const res = await fetch("/api/ai/recommend-squad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formation, opponent, matchDate }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to get AI recommendation");
      }

      const data: AiRecommendation = await res.json();
      setAiResult(data);

      // Apply AI recommendation to the squad
      const aiStartIds = data.startingXI.map((p) => p.playerId);
      const aiBenchIds = data.bench.map((p) => p.playerId);
      if (aiStartIds.length === 11) setStartingXIIds(aiStartIds);
      if (aiBenchIds.length > 0) setBenchIds(aiBenchIds);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setAiLoading(false);
    }
  };

  const handlePlayerClick = (player: PitchPlayer) => {
    setSelectedPlayer(selectedPlayer?.id === player.id ? null : player);
  };

  const formations: Formation[] = ["4-3-3", "4-2-3-1", "4-4-2", "3-5-2"];

  return (
    <div className="space-y-5">
      {/* Match Setup Bar */}
      <div className="glass rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="data-label">Formation</label>
            <div className="relative">
              <select
                value={formation}
                onChange={(e) => setFormation(e.target.value as Formation)}
                className="appearance-none bg-white/[0.06] border border-white/[0.08] rounded-lg px-3 py-1.5 pr-8 text-sm font-mono font-bold text-[#00d4ff] focus:outline-none focus:border-[#00d4ff]/50 cursor-pointer"
              >
                {formations.map((f) => (
                  <option key={f} value={f} className="bg-[#0a0e1a]">
                    {f}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="data-label">Opponent</label>
            <input
              type="text"
              value={opponent}
              onChange={(e) => setOpponent(e.target.value)}
              placeholder="e.g. Al Ahly Academy"
              className="bg-white/[0.06] border border-white/[0.08] rounded-lg px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-[#00d4ff]/50 w-48"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="data-label">Date</label>
            <input
              type="date"
              value={matchDate}
              onChange={(e) => setMatchDate(e.target.value)}
              className="bg-white/[0.06] border border-white/[0.08] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#00d4ff]/50 [color-scheme:dark]"
            />
          </div>

          <div className="ml-auto">
            <button
              onClick={handleAiRecommend}
              disabled={aiLoading}
              className="flex items-center gap-2 px-5 py-2 rounded-lg font-semibold text-sm text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background:
                  "linear-gradient(135deg, #a855f7, #00d4ff)",
              }}
            >
              <Brain
                className={`h-4 w-4 ${aiLoading ? "animate-spin" : ""}`}
              />
              {aiLoading ? "Analyzing..." : "AI Recommend"}
            </button>
          </div>
        </div>
      </div>

      {/* Main Layout: Pitch (60%) + Panel (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Left: Pitch Diagram */}
        <div className="lg:col-span-3 space-y-4">
          <div className="glass rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">
                Pitch View{" "}
                <span className="font-mono text-[#00d4ff]">{formation}</span>
              </h3>
              <span className="text-xs text-muted-foreground">
                Click a player for details
              </span>
            </div>
            <PitchDiagram
              formation={formation}
              startingXI={startingXI}
              onPlayerClick={handlePlayerClick}
            />
          </div>

          {/* Selected player popup */}
          {selectedPlayer && (
            <div className="glass rounded-xl p-4 border border-white/[0.1]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-2xl font-bold text-[#00d4ff]">
                    #{selectedPlayer.jerseyNumber}
                  </span>
                  <div>
                    <h4 className="font-semibold">{selectedPlayer.name}</h4>
                    <span className="text-xs text-muted-foreground">
                      {selectedPlayer.position}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPlayer(null)}
                  className="text-muted-foreground hover:text-white text-sm"
                >
                  Close
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="data-label mb-1">ACWR</p>
                  <p
                    className={`stat-number text-lg ${
                      selectedPlayer.riskFlag === "green"
                        ? "text-[#00ff88]"
                        : selectedPlayer.riskFlag === "amber"
                          ? "text-[#ff6b35]"
                          : selectedPlayer.riskFlag === "red"
                            ? "text-[#ff3355]"
                            : "text-[#00d4ff]"
                    }`}
                  >
                    {selectedPlayer.acwrRatio?.toFixed(2) ?? "N/A"}
                  </p>
                </div>
                <div className="text-center">
                  <p className="data-label mb-1">HR Avg</p>
                  <p className="stat-number text-lg text-white">
                    {selectedPlayer.hrAvg ?? "N/A"}
                    <span className="text-xs text-muted-foreground ml-0.5">
                      bpm
                    </span>
                  </p>
                </div>
                <div className="text-center">
                  <p className="data-label mb-1">TRIMP</p>
                  <p className="stat-number text-lg text-white">
                    {selectedPlayer.trimpScore?.toFixed(0) ?? "N/A"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Formation comparison */}
          <FormationStats
            tacticalMetrics={tacticalMetrics}
            goalsBySession={goalsBySession}
          />
        </div>

        {/* Right: Squad Panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Starting XI */}
          <div className="glass rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#00ff88]" />
              Starting XI
            </h3>
            <div className="space-y-1">
              {startingXI.map((player, i) => (
                <div
                  key={player.id}
                  draggable
                  onDragStart={() => handleDragStart(player.id, "starting")}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(player.id, "starting")}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm bg-white/[0.03] hover:bg-white/[0.06] cursor-grab active:cursor-grabbing transition-colors group"
                >
                  <GripVertical className="h-3 w-3 text-white/20 group-hover:text-white/40" />
                  <span className="text-xs text-muted-foreground w-8 font-mono">
                    {player.position}
                  </span>
                  <span className="font-mono font-bold text-xs text-[#00d4ff] w-6">
                    #{player.jerseyNumber}
                  </span>
                  <span className="flex-1 text-sm truncate">{player.name}</span>
                  <span
                    className={`h-2 w-2 rounded-full ${getRiskDot(player.riskFlag)}`}
                  />
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${getRiskBadgeClass(player.riskFlag)}`}
                  >
                    {player.acwrRatio?.toFixed(2) ?? "---"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Bench */}
          <div className="glass rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#00d4ff]" />
              Bench ({bench.length})
            </h3>
            <div className="space-y-1">
              {bench.map((player) => (
                <div
                  key={player.id}
                  draggable
                  onDragStart={() => handleDragStart(player.id, "bench")}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(player.id, "bench")}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm bg-white/[0.02] hover:bg-white/[0.05] cursor-grab active:cursor-grabbing transition-colors group"
                >
                  <GripVertical className="h-3 w-3 text-white/15 group-hover:text-white/30" />
                  <span className="text-xs text-muted-foreground w-8 font-mono">
                    {player.position}
                  </span>
                  <span className="font-mono text-xs text-white/50 w-6">
                    #{player.jerseyNumber}
                  </span>
                  <span className="flex-1 text-sm text-white/70 truncate">
                    {player.name}
                  </span>
                  <span
                    className={`h-2 w-2 rounded-full ${getRiskDot(player.riskFlag)}`}
                  />
                </div>
              ))}
              {bench.length === 0 && (
                <p className="text-xs text-muted-foreground py-2">
                  No bench players
                </p>
              )}
            </div>
          </div>

          {/* Excluded */}
          {excluded.length > 0 && (
            <div className="glass rounded-xl p-4 border border-[#ff3355]/20">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-[#ff3355]">
                <ShieldAlert className="h-3.5 w-3.5" />
                Excluded ({excluded.length})
              </h3>
              <div className="space-y-1">
                {excluded.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm bg-[#ff3355]/[0.05]"
                  >
                    <AlertTriangle className="h-3 w-3 text-[#ff3355]" />
                    <span className="font-mono text-xs text-white/40 w-6">
                      #{player.jerseyNumber}
                    </span>
                    <span className="flex-1 text-sm text-white/50 truncate">
                      {player.name}
                    </span>
                    <span className="text-[10px] text-[#ff3355]/70 font-mono">
                      {player.riskFlag === "red"
                        ? `ACWR ${player.acwrRatio?.toFixed(2)}`
                        : "Injured"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Error */}
          {aiError && (
            <div className="glass rounded-xl p-4 border border-[#ff3355]/30">
              <p className="text-sm text-[#ff3355]">{aiError}</p>
            </div>
          )}

          {/* AI Recommendation */}
          {aiResult && (
            <div className="glass rounded-xl p-4 border border-[#a855f7]/30">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-[#a855f7]">
                <Brain className="h-3.5 w-3.5" />
                AI Analysis
              </h3>

              {/* Selection reasons */}
              {aiResult.startingXI.length > 0 && (
                <div className="space-y-2 mb-4">
                  <p className="data-label">Selection Reasoning</p>
                  {aiResult.startingXI
                    .filter((p) => p.reason)
                    .map((p, i) => (
                      <div
                        key={i}
                        className="text-xs text-white/70 bg-white/[0.03] rounded-lg px-3 py-2"
                      >
                        <span className="font-mono text-[#00d4ff] font-bold">
                          #{p.jersey} {p.name}
                        </span>{" "}
                        <span className="text-muted-foreground">
                          ({p.position})
                        </span>
                        : {p.reason}
                      </div>
                    ))}
                </div>
              )}

              {/* Sub timing */}
              {aiResult.subTiming.length > 0 && (
                <div className="space-y-1.5 mb-4">
                  <p className="data-label flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Sub Timing
                  </p>
                  {aiResult.subTiming.map((sub, i) => (
                    <div
                      key={i}
                      className="text-xs text-white/60 flex items-center gap-2"
                    >
                      <span className="font-mono text-[#ff6b35] font-bold">
                        {sub.minute}&apos;
                      </span>
                      <span>
                        {sub.playerOut} → {sub.playerIn}
                      </span>
                      <span className="text-muted-foreground">
                        ({sub.reason})
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Overall reasoning */}
              {aiResult.reasoning && (
                <div className="border-t border-white/[0.06] pt-3">
                  <p className="data-label mb-1.5">Overall Strategy</p>
                  <p className="text-xs text-white/60 leading-relaxed">
                    {aiResult.reasoning}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
