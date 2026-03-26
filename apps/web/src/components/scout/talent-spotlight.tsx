"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Star,
  Trophy,
  Zap,
  Heart,
  Gauge,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Share2,
  Crown,
  Medal,
  Award,
  Eye,
  Users,
  Target,
} from "lucide-react";
import { ExportShareBar } from "@/components/ui/export-share-bar";
import { ExpandableCard } from "@/components/ui/expandable-card";

interface TalentPlayer {
  id: string;
  name: string;
  jerseyNumber: number;
  position: string;
  ageGroup: string;
  sessions: number;
  matchSessions: number;
  avgTrimp: number;
  avgHr: number;
  maxHr: number;
  avgHighIntensity: number;
  avgRecovery: number;
  avgSpeed: number;
  maxSpeed: number;
  avgDistance: number;
  sprintCount: number;
  acwr: number | null;
  riskFlag: string | null;
  compositeScore: number;
}

interface TalentSpotlightProps {
  players: TalentPlayer[];
}

const POSITION_COLORS: Record<string, string> = {
  GK: "#ffbb00",
  CB: "#3b82f6",
  LB: "#3b82f6",
  RB: "#3b82f6",
  CDM: "#00d4ff",
  CM: "#00d4ff",
  CAM: "#a855f7",
  LW: "#ff6b35",
  RW: "#ff6b35",
  LM: "#ff6b35",
  RM: "#ff6b35",
  ST: "#ff3355",
  CF: "#ff3355",
};

function getScoreColor(score: number): string {
  if (score >= 80) return "#00ff88";
  if (score >= 65) return "#00d4ff";
  if (score >= 50) return "#ff6b35";
  return "#ff3355";
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <div className="flex items-center justify-center h-7 w-7 rounded-full bg-[#ffbb00]/20 border border-[#ffbb00]/40">
        <Crown className="h-3.5 w-3.5 text-[#ffbb00]" />
      </div>
    );
  if (rank === 2)
    return (
      <div className="flex items-center justify-center h-7 w-7 rounded-full bg-white/10 border border-white/20">
        <Medal className="h-3.5 w-3.5 text-white/70" />
      </div>
    );
  if (rank === 3)
    return (
      <div className="flex items-center justify-center h-7 w-7 rounded-full bg-[#cd7f32]/20 border border-[#cd7f32]/40">
        <Award className="h-3.5 w-3.5 text-[#cd7f32]" />
      </div>
    );
  return (
    <div className="flex items-center justify-center h-7 w-7 rounded-full bg-white/[0.04] border border-white/[0.08]">
      <span className="text-xs font-mono font-bold text-white/40">{rank}</span>
    </div>
  );
}

function getPositionAnalysis(player: TalentPlayer): string {
  const pos = player.position.toUpperCase();

  if (["ST", "CF"].includes(pos)) {
    return `As a striker, ${player.name}'s sprint count of ${player.sprintCount} per session and max speed of ${player.maxSpeed} km/h indicate ${player.maxSpeed > 28 ? "elite" : player.maxSpeed > 25 ? "good" : "developing"} attacking threat. High-intensity zone time of ${player.avgHighIntensity}% shows ${player.avgHighIntensity > 15 ? "excellent pressing ability" : "room to improve pressing intensity"}.`;
  }
  if (["LW", "RW", "LM", "RM"].includes(pos)) {
    return `Wide player analysis: ${player.name} covers ${player.avgDistance}m per session with ${player.sprintCount} sprints. Max speed ${player.maxSpeed} km/h ${player.maxSpeed > 27 ? "gives them a genuine pace advantage" : "is adequate for the position"}. Average speed ${player.avgSpeed} km/h reflects consistent work rate across the pitch.`;
  }
  if (["CAM", "CM", "CDM"].includes(pos)) {
    return `Midfield engine analysis: ${player.name} averages ${player.avgDistance}m distance covered, reflecting ${player.avgDistance > 5000 ? "excellent" : "solid"} ground coverage. TRIMP of ${player.avgTrimp} shows cardiovascular capacity for sustained mid-intensity effort. Recovery rate of ${player.avgRecovery} bpm indicates ${player.avgRecovery > 25 ? "strong" : "average"} cardiac fitness.`;
  }
  if (["CB", "LB", "RB"].includes(pos)) {
    return `Defensive metrics: ${player.name} shows ${player.avgHighIntensity}% high-intensity time, important for recovery runs and tracking. Sprint count of ${player.sprintCount} per session reflects ${pos === "CB" ? "aerial/positional recovery demands" : "overlapping run frequency"}. Max speed ${player.maxSpeed} km/h ${player.maxSpeed > 26 ? "is strong for a defender" : "could be improved for recovery speed"}.`;
  }
  if (pos === "GK") {
    return `Goalkeeper metrics focus on decision-making and distribution. ${player.name}'s cardiovascular base (avg HR ${player.avgHr} bpm, TRIMP ${player.avgTrimp}) reflects training involvement level. Recovery rate of ${player.avgRecovery} bpm and ${player.sessions} sessions indicate consistent development.`;
  }
  return `${player.name} shows a balanced physical profile with TRIMP ${player.avgTrimp}, max speed ${player.maxSpeed} km/h, and ${player.avgHighIntensity}% high-intensity output across ${player.sessions} sessions.`;
}

function TopCard({ player, rank }: { player: TalentPlayer; rank: number }) {
  const [expanded, setExpanded] = useState(false);
  const scoreColor = getScoreColor(player.compositeScore);
  const posColor = POSITION_COLORS[player.position] || "#00d4ff";
  const isFirst = rank === 1;

  return (
    <div
      className={`glass rounded-xl transition-all duration-300 relative overflow-hidden ${
        isFirst ? "col-span-2 sm:col-span-1" : ""
      }`}
      style={{
        borderColor: isFirst ? `${scoreColor}30` : undefined,
        boxShadow: isFirst ? `0 0 30px ${scoreColor}10` : undefined,
      }}
    >
      {/* Clickable header area */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 text-left hover:bg-white/[0.02] transition-colors"
      >
        {/* Rank badge */}
        <div className="absolute top-3 right-3">
          <RankBadge rank={rank} />
        </div>

        {/* Score ring */}
        <div className="flex items-center gap-3 mb-3">
          <div className="relative">
            <svg width="52" height="52" viewBox="0 0 52 52">
              <circle cx="26" cy="26" r="22" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
              <circle
                cx="26"
                cy="26"
                r="22"
                fill="none"
                stroke={scoreColor}
                strokeWidth="3"
                strokeDasharray={`${(player.compositeScore / 100) * 138.2} 138.2`}
                strokeLinecap="round"
                transform="rotate(-90 26 26)"
                style={{ filter: `drop-shadow(0 0 4px ${scoreColor}60)` }}
              />
            </svg>
            <span
              className="absolute inset-0 flex items-center justify-center font-mono text-sm font-bold"
              style={{ color: scoreColor }}
            >
              {player.compositeScore}
            </span>
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-white truncate">
              {player.name}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono text-xs text-white/40">#{player.jerseyNumber}</span>
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: `${posColor}15`,
                  color: posColor,
                }}
              >
                {player.position}
              </span>
            </div>
          </div>
        </div>

        {/* Key stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="font-mono text-xs font-bold text-white/80">{player.avgTrimp}</div>
            <div className="text-[9px] text-white/30 uppercase">TRIMP</div>
          </div>
          <div>
            <div className="font-mono text-xs font-bold text-white/80">{player.maxSpeed}</div>
            <div className="text-[9px] text-white/30 uppercase">km/h</div>
          </div>
          <div>
            <div className="font-mono text-xs font-bold text-white/80">{player.avgHighIntensity}%</div>
            <div className="text-[9px] text-white/30 uppercase">Z4+Z5</div>
          </div>
        </div>

        {/* Sessions + expand hint */}
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[10px] text-white/30">
            {player.sessions} sessions &middot; {player.matchSessions} matches
          </span>
          <ChevronDown className={`h-3 w-3 text-white/20 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`} />
        </div>
      </button>

      {/* Expanded detail */}
      <div
        className="transition-[max-height,opacity] duration-300 ease-in-out overflow-hidden"
        style={{
          maxHeight: expanded ? "400px" : "0px",
          opacity: expanded ? 1 : 0,
        }}
      >
        <div className="px-4 pb-4 border-t border-white/[0.04] pt-3 space-y-3">
          {/* Full stat breakdown */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Avg HR", value: `${player.avgHr}`, unit: "bpm" },
              { label: "Max HR", value: `${player.maxHr}`, unit: "bpm" },
              { label: "Avg Speed", value: `${player.avgSpeed}`, unit: "km/h" },
              { label: "Distance", value: `${player.avgDistance}`, unit: "m" },
              { label: "Sprints", value: `${player.sprintCount}`, unit: "/session" },
              { label: "Recovery", value: `${player.avgRecovery}`, unit: "bpm" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-lg px-2 py-1.5 bg-white/[0.03] border border-white/[0.05] text-center">
                <p className="text-[8px] text-white/30 uppercase">{stat.label}</p>
                <p className="text-[11px] font-mono font-bold text-white/80">{stat.value}</p>
                <p className="text-[8px] text-white/20">{stat.unit}</p>
              </div>
            ))}
          </div>

          {/* Position-specific analysis */}
          <div className="rounded-lg bg-white/[0.03] border border-white/[0.04] p-2.5">
            <p className="text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1">Position Analysis</p>
            <p className="text-[11px] text-white/50 leading-relaxed">{getPositionAnalysis(player)}</p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/players/${player.id}`}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: "rgba(0,212,255,0.08)",
                border: "1px solid rgba(0,212,255,0.20)",
                color: "#00d4ff",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <Eye className="h-3 w-3" />
              View Profile
            </Link>
            <button
              onClick={(e) => { e.stopPropagation(); console.log(`Share: ${player.name}`); }}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: "rgba(168,85,247,0.08)",
                border: "1px solid rgba(168,85,247,0.20)",
                color: "#a855f7",
              }}
            >
              <Share2 className="h-3 w-3" />
              Share to Social
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); console.log(`Scout list: ${player.name}`); }}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.10)",
                color: "rgba(255,255,255,0.7)",
              }}
            >
              <Target className="h-3 w-3" />
              Add to Scout List
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlayerRow({ player, rank }: { player: TalentPlayer; rank: number }) {
  const [expanded, setExpanded] = useState(false);
  const scoreColor = getScoreColor(player.compositeScore);
  const posColor = POSITION_COLORS[player.position] || "#00d4ff";

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-white/[0.04] group"
      >
        <RankBadge rank={rank} />

        <div className="min-w-0 flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white/80 group-hover:text-white truncate">
              {player.name}
            </span>
            <span className="font-mono text-[10px] text-white/30">#{player.jerseyNumber}</span>
            <span
              className="text-[9px] font-semibold px-1.5 py-0.5 rounded shrink-0"
              style={{ backgroundColor: `${posColor}15`, color: posColor }}
            >
              {player.position}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="hidden sm:flex items-center gap-4 text-[11px] font-mono text-white/50 shrink-0">
          <span title="Avg TRIMP">{player.avgTrimp}</span>
          <span title="Max Speed">{player.maxSpeed} km/h</span>
          <span title="High Intensity">{player.avgHighIntensity}%</span>
          <span title="Sessions">{player.sessions}s</span>
        </div>

        {/* Score */}
        <div
          className="font-mono text-sm font-bold shrink-0 w-10 text-right"
          style={{ color: scoreColor }}
        >
          {player.compositeScore}
        </div>

        <ChevronDown className={`h-3 w-3 text-white/20 shrink-0 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`} />
      </button>

      {/* Expanded detail */}
      <div
        className="transition-[max-height,opacity] duration-300 ease-in-out overflow-hidden"
        style={{
          maxHeight: expanded ? "350px" : "0px",
          opacity: expanded ? 1 : 0,
        }}
      >
        <div className="px-3 pb-3 ml-10 space-y-3">
          {/* Full stat grid */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {[
              { label: "Avg TRIMP", value: player.avgTrimp },
              { label: "Avg HR", value: `${player.avgHr} bpm` },
              { label: "Max Speed", value: `${player.maxSpeed} km/h` },
              { label: "Avg Distance", value: `${player.avgDistance}m` },
              { label: "Sprints", value: `${player.sprintCount}/s` },
              { label: "Recovery", value: `${player.avgRecovery} bpm` },
            ].map((s) => (
              <div key={s.label} className="rounded-lg px-2 py-1.5 bg-white/[0.03] border border-white/[0.05] text-center">
                <p className="text-[8px] text-white/30 uppercase">{s.label}</p>
                <p className="text-[11px] font-mono font-bold text-white/70">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Position analysis */}
          <div className="rounded-lg bg-white/[0.03] border border-white/[0.04] p-2.5">
            <p className="text-[11px] text-white/50 leading-relaxed">{getPositionAnalysis(player)}</p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/players/${player.id}`}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
              style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.20)", color: "#00d4ff" }}
              onClick={(e) => e.stopPropagation()}
            >
              <Eye className="h-3 w-3" /> View Profile
            </Link>
            <button
              onClick={(e) => { e.stopPropagation(); console.log(`Share: ${player.name}`); }}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
              style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.20)", color: "#a855f7" }}
            >
              <Share2 className="h-3 w-3" /> Share to Social
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); console.log(`Scout: ${player.name}`); }}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.7)" }}
            >
              <Target className="h-3 w-3" /> Add to Scout List
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TalentSpotlight({ players }: TalentSpotlightProps) {
  const [showAll, setShowAll] = useState(false);
  const [filter, setFilter] = useState<"all" | "DEF" | "MID" | "ATK">("all");

  const positionGroups: Record<string, "DEF" | "MID" | "ATK"> = {
    GK: "DEF", CB: "DEF", LB: "DEF", RB: "DEF",
    CDM: "MID", CM: "MID", CAM: "MID",
    LW: "ATK", RW: "ATK", LM: "ATK", RM: "ATK", ST: "ATK", CF: "ATK",
  };

  const filtered =
    filter === "all"
      ? players
      : players.filter((p) => positionGroups[p.position] === filter);

  const top3 = filtered.slice(0, 3);
  const rest = showAll ? filtered.slice(3) : filtered.slice(3, 10);
  const hasMore = filtered.length > 10;

  // Build share content for top 10
  const shareContent = filtered
    .slice(0, 10)
    .map(
      (p, i) =>
        `${i + 1}. #${p.jerseyNumber} ${p.name} (${p.position}) -- Score: ${p.compositeScore}/100 | TRIMP: ${p.avgTrimp} | Speed: ${p.maxSpeed} km/h`
    )
    .join("\n");

  return (
    <div className="space-y-4">
      {/* Filter tabs + share */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-white/[0.04]">
          {(["all", "DEF", "MID", "ATK"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-all ${
                filter === f
                  ? "bg-white/10 text-white"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              {f === "all" ? "All" : f}
            </button>
          ))}
        </div>
        <ExportShareBar
          title="Talent Spotlight -- Top Performers"
          content={shareContent}
        />
      </div>

      {/* Top 3 Cards — expandable */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {top3.map((p, i) => (
          <TopCard key={p.id} player={p} rank={i + 1} />
        ))}
      </div>

      {/* Rest of the list — expandable rows */}
      {rest.length > 0 && (
        <div className="glass rounded-xl divide-y divide-white/[0.04]">
          {rest.map((p, i) => (
            <PlayerRow key={p.id} player={p} rank={i + 4} />
          ))}
        </div>
      )}

      {/* Show more / less */}
      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="flex items-center gap-1.5 mx-auto text-xs text-white/40 hover:text-white/60 font-medium transition-colors"
        >
          {showAll ? (
            <>
              Show Less <ChevronUp className="h-3 w-3" />
            </>
          ) : (
            <>
              Show All {filtered.length} Players <ChevronDown className="h-3 w-3" />
            </>
          )}
        </button>
      )}
    </div>
  );
}
