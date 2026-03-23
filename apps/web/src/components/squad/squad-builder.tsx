"use client";

import { useState, useCallback } from "react";
import {
  PitchDiagram,
  type PitchPlayer,
  type Formation,
} from "./pitch-diagram";
import { FormationStats } from "./formation-stats";
import {
  X,
  ArrowRightLeft,
  UserMinus,
  Brain,
  Shield,
  Zap,
  Heart,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  GripVertical,
  ShieldAlert,
  Clock,
  ChevronDown,
} from "lucide-react";
import type { TacticalMetrics } from "@/types";
import { ExportShareBar } from "@/components/ui/export-share-bar";

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

function getSelectionReason(player: PitchPlayer): string {
  const acwr = player.acwrRatio;
  const hr = player.hrAvg;
  const trimp = player.trimpScore;

  const parts: string[] = [];

  if (acwr != null) {
    if (acwr >= 0.8 && acwr <= 1.3) parts.push(`ACWR ${acwr.toFixed(2)} — optimal zone, body is adapted to current load`);
    else if (acwr > 1.3 && acwr <= 1.5) parts.push(`ACWR ${acwr.toFixed(2)} — caution zone, monitor closely but can play`);
    else if (acwr > 1.5) parts.push(`ACWR ${acwr.toFixed(2)} — danger zone, high injury risk, consider resting`);
    else parts.push(`ACWR ${acwr.toFixed(2)} — under-training, needs more game time`);
  }

  if (trimp != null) {
    if (trimp > 150) parts.push(`High work rate (TRIMP ${Math.round(trimp)}) — consistently putting in effort`);
    else if (trimp > 100) parts.push(`Good work rate (TRIMP ${Math.round(trimp)}) — reliable contributor`);
    else parts.push(`Lower session load (TRIMP ${Math.round(trimp)}) — may need more intensity`);
  }

  if (hr != null) {
    if (hr < 150) parts.push(`Efficient HR (${hr} bpm avg) — good fitness level`);
    else if (hr < 165) parts.push(`Moderate HR (${hr} bpm avg) — working hard but sustainable`);
    else parts.push(`High HR (${hr} bpm avg) — pushing limits, check recovery`);
  }

  return parts.join(". ") + ".";
}

function PlayerDetailCard({
  player,
  aiResult,
  allPlayers,
  startingXI,
  bench,
  onClose,
  onBench,
  onSwap,
}: {
  player: PitchPlayer;
  aiResult: AiRecommendation | null;
  allPlayers: PitchPlayer[];
  startingXI: PitchPlayer[];
  bench: PitchPlayer[];
  onClose: () => void;
  onBench: (player: PitchPlayer) => void;
  onSwap: (playerOut: PitchPlayer, playerIn: PitchPlayer) => void;
}) {
  const [showSwapOptions, setShowSwapOptions] = useState(false);

  const riskColor =
    player.riskFlag === "green" ? "text-[#00ff88]" :
    player.riskFlag === "amber" ? "text-[#ff6b35]" :
    player.riskFlag === "red" ? "text-[#ff3355]" :
    "text-[#00d4ff]";

  const riskBg =
    player.riskFlag === "green" ? "bg-[#00ff88]/10 border-[#00ff88]/20" :
    player.riskFlag === "amber" ? "bg-[#ff6b35]/10 border-[#ff6b35]/20" :
    player.riskFlag === "red" ? "bg-[#ff3355]/10 border-[#ff3355]/20" :
    "bg-[#00d4ff]/10 border-[#00d4ff]/20";

  // Find AI reasoning for this player if available
  const aiPlayerReason = aiResult?.startingXI?.find(
    (p: any) => p.playerId === player.id || p.name === player.name
  );

  // Get bench alternatives for the same position type
  const positionGroup = ["GK"].includes(player.position) ? ["GK"] :
    ["CB", "FB", "LB", "RB"].includes(player.position) ? ["CB", "FB", "LB", "RB"] :
    ["CM", "CDM", "CAM"].includes(player.position) ? ["CM", "CDM", "CAM"] :
    ["W", "LW", "RW", "LM", "RM"].includes(player.position) ? ["W", "LW", "RW", "LM", "RM"] :
    ["ST"];

  const swapCandidates = bench.filter((p) =>
    positionGroup.includes(p.position) || p.position === player.position
  );

  // If no position match, show all bench players
  const allSwapOptions = swapCandidates.length > 0 ? swapCandidates : bench;

  return (
    <div className="rounded-xl border border-white/[0.1] bg-[#0f1629]/95 backdrop-blur-xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`h-12 w-12 rounded-full ${riskBg} border flex items-center justify-center`}>
            <span className={`font-mono text-xl font-bold ${riskColor}`}>
              {player.jerseyNumber}
            </span>
          </div>
          <div>
            <h4 className="font-semibold text-white text-lg">{player.name}</h4>
            <span className="text-sm text-white/60">{player.position}</span>
          </div>
        </div>
        <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className={`rounded-lg ${riskBg} border p-2 text-center`}>
          <p className="data-label mb-0.5">ACWR</p>
          <p className={`font-mono text-xl font-bold ${riskColor}`}>
            {player.acwrRatio?.toFixed(2) ?? "N/A"}
          </p>
          <p className="text-xs text-white/50">
            {player.riskFlag === "green" ? "Optimal" : player.riskFlag === "amber" ? "Caution" : player.riskFlag === "red" ? "Danger" : "Low"}
          </p>
        </div>
        <div className="rounded-lg bg-white/[0.04] border border-white/[0.08] p-2 text-center">
          <p className="data-label mb-0.5">Avg HR</p>
          <p className="font-mono text-xl font-bold text-white">{player.hrAvg ?? "—"}</p>
          <p className="text-xs text-white/50">bpm</p>
        </div>
        <div className="rounded-lg bg-white/[0.04] border border-white/[0.08] p-2 text-center">
          <p className="data-label mb-0.5">TRIMP</p>
          <p className="font-mono text-xl font-bold text-white">{player.trimpScore?.toFixed(0) ?? "—"}</p>
          <p className="text-xs text-white/50">load</p>
        </div>
      </div>

      {/* AI Reasoning */}
      <div className="rounded-lg bg-[#a855f7]/5 border border-[#a855f7]/15 p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <Brain className="h-4 w-4 text-[#a855f7]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#a855f7]">
            Why this player
          </span>
        </div>
        <p className="text-sm text-white/80 leading-relaxed">
          {aiPlayerReason?.reason || getSelectionReason(player)}
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => onBench(player)}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-[#ff6b35]/30 bg-[#ff6b35]/10 px-3 py-2.5 text-sm font-medium text-[#ff6b35] hover:bg-[#ff6b35]/20 transition-colors"
        >
          <UserMinus className="h-4 w-4" />
          Move to Bench
        </button>
        <button
          onClick={() => setShowSwapOptions(!showSwapOptions)}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-[#00d4ff]/30 bg-[#00d4ff]/10 px-3 py-2.5 text-sm font-medium text-[#00d4ff] hover:bg-[#00d4ff]/20 transition-colors"
        >
          <ArrowRightLeft className="h-4 w-4" />
          Swap Player
        </button>
      </div>

      {/* Swap options */}
      {showSwapOptions && (
        <div className="space-y-2">
          <p className="text-xs text-white/50 uppercase tracking-wider font-semibold">
            Available replacements ({allSwapOptions.length})
          </p>
          {allSwapOptions.length === 0 ? (
            <p className="text-sm text-white/40 italic">No bench players available for this position.</p>
          ) : (
            <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
              {allSwapOptions.map((candidate) => {
                const candColor =
                  candidate.riskFlag === "green" ? "text-[#00ff88]" :
                  candidate.riskFlag === "amber" ? "text-[#ff6b35]" :
                  candidate.riskFlag === "red" ? "text-[#ff3355]" :
                  "text-[#00d4ff]";

                return (
                  <button
                    key={candidate.id}
                    onClick={() => onSwap(player, candidate)}
                    className="w-full flex items-center justify-between rounded-lg border border-white/[0.08] bg-white/[0.03] p-2.5 hover:bg-[#00d4ff]/10 hover:border-[#00d4ff]/20 transition-all group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white/80">
                        #{candidate.jerseyNumber}
                      </span>
                      <span className="text-sm text-white/80">{candidate.name}</span>
                      <span className="text-xs text-white/40">{candidate.position}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-xs ${candColor}`}>
                        ACWR {candidate.acwrRatio?.toFixed(2) ?? "—"}
                      </span>
                      <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-[#00d4ff] transition-colors" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
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

          <div className="ml-auto flex items-center gap-3">
            <ExportShareBar
              title={`Coach M8 — Match Squad${opponent ? ` vs ${opponent}` : ""} (${matchDate})`}
              content={[
                `## Formation: ${formation}`,
                opponent ? `## Opponent: ${opponent}` : "",
                `## Date: ${matchDate}`,
                "",
                "## Starting XI",
                ...startingXI.map((p) => `${p.position} — #${p.jerseyNumber} ${p.name} | ACWR: ${p.acwrRatio?.toFixed(2) ?? "N/A"} | HR: ${p.hrAvg ?? "N/A"} bpm | TRIMP: ${p.trimpScore?.toFixed(0) ?? "N/A"}`),
                "",
                "## Bench",
                ...bench.map((p) => `#${p.jerseyNumber} ${p.name} (${p.position}) | ACWR: ${p.acwrRatio?.toFixed(2) ?? "N/A"}`),
                "",
                "## Excluded (Rest/Injury Risk)",
                ...excluded.map((p) => `#${p.jerseyNumber} ${p.name} — ${p.riskFlag === "red" ? "HIGH RISK" : "Injured"} (ACWR: ${p.acwrRatio?.toFixed(2) ?? "N/A"})`),
                "",
                aiResult?.reasoning ? `## AI Reasoning\n${aiResult.reasoning}` : "",
                aiResult?.subTiming?.length ? `## Sub Timing\n${aiResult.subTiming.map((s: any) => `${s.minute}' — ${s.playerOut} → ${s.playerIn}: ${s.reason}`).join("\n")}` : "",
              ].filter(Boolean).join("\n")}
            />
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

          {/* Selected player detail card */}
          {selectedPlayer && (
            <PlayerDetailCard
              player={selectedPlayer}
              aiResult={aiResult}
              allPlayers={players}
              startingXI={startingXI}
              bench={bench}
              onClose={() => setSelectedPlayer(null)}
              onBench={(player) => {
                setStartingXIIds((prev) => prev.filter((id) => id !== player.id));
                setBenchIds((prev) => [player.id, ...prev]);
                setSelectedPlayer(null);
              }}
              onSwap={(playerOut, playerIn) => {
                setStartingXIIds((prev) =>
                  prev.map((id) => (id === playerOut.id ? playerIn.id : id))
                );
                setBenchIds((prev) =>
                  prev.map((id) => (id === playerIn.id ? playerOut.id : id))
                );
                setSelectedPlayer(playerIn);
              }}
            />
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
