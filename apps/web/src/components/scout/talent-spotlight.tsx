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
} from "lucide-react";
import { ExportShareBar } from "@/components/ui/export-share-bar";

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

function TopCard({ player, rank }: { player: TalentPlayer; rank: number }) {
  const scoreColor = getScoreColor(player.compositeScore);
  const posColor = POSITION_COLORS[player.position] || "#00d4ff";
  const isFirst = rank === 1;

  return (
    <Link
      href={`/players/${player.id}`}
      className={`glass rounded-xl p-4 transition-all duration-300 hover:scale-[1.02] hover:border-white/20 relative overflow-hidden group ${
        isFirst ? "col-span-2 sm:col-span-1" : ""
      }`}
      style={{
        borderColor: isFirst ? `${scoreColor}30` : undefined,
        boxShadow: isFirst ? `0 0 30px ${scoreColor}10` : undefined,
      }}
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
          <div className="text-sm font-bold text-white truncate group-hover:text-[#00d4ff] transition-colors">
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

      {/* Sessions played */}
      <div className="mt-2 text-[10px] text-white/30 text-center">
        {player.sessions} sessions &middot; {player.matchSessions} matches
      </div>
    </Link>
  );
}

function PlayerRow({ player, rank }: { player: TalentPlayer; rank: number }) {
  const scoreColor = getScoreColor(player.compositeScore);
  const posColor = POSITION_COLORS[player.position] || "#00d4ff";

  return (
    <Link
      href={`/players/${player.id}`}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-white/[0.04] group"
    >
      <RankBadge rank={rank} />

      <div className="min-w-0 flex-1">
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
    </Link>
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
        `${i + 1}. #${p.jerseyNumber} ${p.name} (${p.position}) — Score: ${p.compositeScore}/100 | TRIMP: ${p.avgTrimp} | Speed: ${p.maxSpeed} km/h`
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
          title="Talent Spotlight — Top Performers"
          content={shareContent}
        />
      </div>

      {/* Top 3 Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {top3.map((p, i) => (
          <TopCard key={p.id} player={p} rank={i + 1} />
        ))}
      </div>

      {/* Rest of the list */}
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
