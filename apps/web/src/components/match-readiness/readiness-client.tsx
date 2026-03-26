"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  Brain,
  Loader2,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Zap,
  Eye,
  UserMinus,
  UserPlus,
} from "lucide-react";
import { ExpandableCard } from "@/components/ui/expandable-card";

// Dynamic import Recharts
const PieChart = dynamic(() => import("recharts").then((m) => m.PieChart), { ssr: false });
const Pie = dynamic(() => import("recharts").then((m) => m.Pie), { ssr: false });
const Cell = dynamic(() => import("recharts").then((m) => m.Cell), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((m) => m.ResponsiveContainer), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), { ssr: false });

interface PlayerReadiness {
  id: string;
  name: string;
  jerseyNumber: number;
  position: string;
  ageGroup: string;
  readinessScore: number;
  status: "ready" | "caution" | "fatigued";
  factors: {
    loadTrend: number;
    recoveryQuality: number;
    daysSinceHighIntensity: number;
    acwrProximity: number;
    performanceTrend: number;
  };
  latestAcwr: number | null;
  latestRecovery: number | null;
}

interface ReadinessClientProps {
  players: PlayerReadiness[];
  academyId: string;
}

const POSITION_ORDER: Record<string, number> = {
  GK: 0,
  CB: 1,
  LB: 2,
  RB: 3,
  CDM: 4,
  CM: 5,
  CAM: 6,
  LW: 7,
  RW: 8,
  LM: 7,
  RM: 8,
  ST: 9,
  CF: 9,
};

const COLORS = {
  ready: "#00ff88",
  caution: "#ff6b35",
  fatigued: "#ff3355",
};

function ReadinessBar({ score }: { score: number }) {
  const color = score >= 70 ? COLORS.ready : score >= 45 ? COLORS.caution : COLORS.fatigued;
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-2 rounded-full bg-white/[0.05] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
      <span className="text-xs font-mono font-bold w-8 text-right" style={{ color }}>
        {score}
      </span>
    </div>
  );
}

function StatusBadge({ status }: { status: "ready" | "caution" | "fatigued" }) {
  const config = {
    ready: { icon: CheckCircle, label: "READY", color: COLORS.ready },
    caution: { icon: AlertTriangle, label: "CAUTION", color: COLORS.caution },
    fatigued: { icon: XCircle, label: "FATIGUED", color: COLORS.fatigued },
  };
  const { icon: Icon, label, color } = config[status];
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: `${color}15`, color }}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

function RecommendedXI({ players }: { players: PlayerReadiness[] }) {
  const sorted = [...players]
    .filter((p) => p.status !== "fatigued")
    .sort((a, b) => b.readinessScore - a.readinessScore);

  const positions = ["GK", "CB", "CB", "LB", "RB", "CDM", "CM", "CAM", "LW", "RW", "ST"];
  const selected: PlayerReadiness[] = [];
  const used = new Set<string>();

  for (const pos of positions) {
    const candidate = sorted.find((p) => {
      if (used.has(p.id)) return false;
      const pPos = p.position.toUpperCase();
      if (pPos === pos) return true;
      if (pos === "CB" && ["CB", "DC"].includes(pPos)) return true;
      if (pos === "CDM" && ["CDM", "DM", "CM"].includes(pPos)) return true;
      if (pos === "CM" && ["CM", "CDM", "CAM"].includes(pPos)) return true;
      if (pos === "CAM" && ["CAM", "CM", "AM"].includes(pPos)) return true;
      if (pos === "LW" && ["LW", "LM", "WL"].includes(pPos)) return true;
      if (pos === "RW" && ["RW", "RM", "WR"].includes(pPos)) return true;
      if (pos === "ST" && ["ST", "CF", "FW"].includes(pPos)) return true;
      if (pos === "LB" && ["LB", "LWB"].includes(pPos)) return true;
      if (pos === "RB" && ["RB", "RWB"].includes(pPos)) return true;
      return false;
    });
    if (candidate) {
      selected.push(candidate);
      used.add(candidate.id);
    }
  }

  if (selected.length < 11) {
    const remaining = sorted.filter((p) => !used.has(p.id));
    for (const p of remaining) {
      if (selected.length >= 11) break;
      selected.push(p);
      used.add(p.id);
    }
  }

  return (
    <div
      className="rounded-xl border p-5"
      style={{
        background: "rgba(10,14,26,0.8)",
        borderColor: "rgba(0,212,255,0.12)",
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Shield className="h-4 w-4 text-[#00d4ff]" />
        <h3 className="text-sm font-semibold text-white">Recommended Starting XI</h3>
        <span className="text-xs text-white/30">Based on readiness + position coverage</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {selected.slice(0, 11).map((p, i) => {
          const scoreColor = p.readinessScore >= 70 ? COLORS.ready : p.readinessScore >= 45 ? COLORS.caution : COLORS.fatigued;
          const posIdx = i < positions.length ? positions[i] : p.position;

          return (
            <ExpandableCard
              key={p.id}
              compact
              icon={
                <span className="text-sm font-mono font-bold text-[#00d4ff] w-5">{i + 1}</span>
              }
              title={p.name}
              subtitle={`#${p.jerseyNumber} -- ${p.position}`}
              accentColor={scoreColor}
              preview={
                <span className="text-sm font-mono font-bold" style={{ color: scoreColor }}>
                  {p.readinessScore}
                </span>
              }
              actions={[
                {
                  label: "Add to Starting XI",
                  icon: <UserPlus className="h-3 w-3" />,
                  onClick: () => console.log(`Add to XI: ${p.name}`),
                  variant: "primary",
                  color: "#00d4ff",
                },
                {
                  label: "View Profile",
                  icon: <Eye className="h-3 w-3" />,
                  href: `/players/${p.id}`,
                  variant: "secondary",
                },
              ]}
            >
              <div className="space-y-2">
                <p className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">
                  Why Selected for Position {posIdx}
                </p>
                <p className="text-[11px] text-white/50 leading-relaxed">
                  {p.name} has a readiness score of {p.readinessScore}/100.
                  {p.readinessScore >= 70
                    ? " Strong recovery metrics and balanced load profile make them the best available option for this position."
                    : p.readinessScore >= 45
                      ? " Some fatigue indicators present but still fit to play. Monitor during the match for signs of reduced performance."
                      : " Limited options available for this position. Consider tactical adjustments to reduce their workload during the match."
                  }
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Load", value: p.factors.loadTrend, max: 25 },
                    { label: "Recovery", value: p.factors.recoveryQuality, max: 25 },
                    { label: "Form", value: p.factors.performanceTrend, max: 10 },
                  ].map((f) => (
                    <div key={f.label} className="rounded-lg px-2 py-1.5 bg-white/[0.03] border border-white/[0.05] text-center">
                      <p className="text-[9px] text-white/40">{f.label}</p>
                      <p className="text-xs font-mono font-bold text-white">{f.value}<span className="text-white/20">/{f.max}</span></p>
                    </div>
                  ))}
                </div>
              </div>
            </ExpandableCard>
          );
        })}
      </div>
      {selected.length < 11 && (
        <p className="text-xs text-white/30 mt-3">
          Only {selected.length} players available. Need {11 - selected.length} more for full XI.
        </p>
      )}
    </div>
  );
}

export function ReadinessClient({ players, academyId }: ReadinessClientProps) {
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);
  const [aiNarrative, setAiNarrative] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [sortBy, setSortBy] = useState<"readiness" | "name" | "position">("readiness");

  const counts = useMemo(() => {
    return {
      ready: players.filter((p) => p.status === "ready").length,
      caution: players.filter((p) => p.status === "caution").length,
      fatigued: players.filter((p) => p.status === "fatigued").length,
    };
  }, [players]);

  const pieData = useMemo(
    () => [
      { name: "Ready", value: counts.ready, color: COLORS.ready },
      { name: "Caution", value: counts.caution, color: COLORS.caution },
      { name: "Fatigued", value: counts.fatigued, color: COLORS.fatigued },
    ],
    [counts]
  );

  const sortedPlayers = useMemo(() => {
    const copy = [...players];
    if (sortBy === "readiness") copy.sort((a, b) => b.readinessScore - a.readinessScore);
    else if (sortBy === "name") copy.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === "position")
      copy.sort(
        (a, b) => (POSITION_ORDER[a.position.toUpperCase()] ?? 99) - (POSITION_ORDER[b.position.toUpperCase()] ?? 99)
      );
    return copy;
  }, [players, sortBy]);

  const generateBrief = async () => {
    setAiLoading(true);
    try {
      const readyNames = players
        .filter((p) => p.status === "ready")
        .sort((a, b) => b.readinessScore - a.readinessScore)
        .slice(0, 5)
        .map((p) => `#${p.jerseyNumber} ${p.name} (${p.readinessScore})`);
      const cautionNames = players
        .filter((p) => p.status === "caution")
        .map((p) => `#${p.jerseyNumber} ${p.name} (${p.readinessScore})`);
      const fatiguedNames = players
        .filter((p) => p.status === "fatigued")
        .map((p) => `#${p.jerseyNumber} ${p.name} (${p.readinessScore})`);

      const context = `Squad readiness overview: ${counts.ready} ready, ${counts.caution} caution, ${counts.fatigued} fatigued out of ${players.length} players.
Top ready: ${readyNames.join(", ") || "none"}.
Caution: ${cautionNames.join(", ") || "none"}.
Fatigued: ${fatiguedNames.join(", ") || "none"}.`;

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Generate a pre-match squad readiness brief. Who is peaked and performing well? Who needs rest? Any concerns? Be specific with names and numbers. Keep it 4-5 sentences.\n\n${context}`,
            },
          ],
          context: "Match readiness squad overview",
        }),
      });
      const data = await res.json();
      setAiNarrative(data.reply);
    } catch {
      setAiNarrative("Unable to generate readiness brief at this time.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Match Readiness</h1>
        <p className="text-sm text-white/40 mt-1">
          Pre-match squad readiness based on load, recovery, and performance trends
        </p>
      </div>

      {/* Overview Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Donut Chart */}
        <div
          className="rounded-xl border p-5 flex flex-col items-center justify-center"
          style={{
            background: "rgba(10,14,26,0.8)",
            borderColor: "rgba(255,255,255,0.06)",
          }}
        >
          <h3 className="text-xs text-white/40 uppercase tracking-wider mb-3">Squad Status</h3>
          <div className="w-full" style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {pieData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} opacity={0.85} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#0f1629",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 mt-2">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                <span className="text-xs text-white/50">
                  {d.name} ({d.value})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="md:col-span-2 grid grid-cols-3 gap-3">
          {[
            { label: "Ready", count: counts.ready, color: COLORS.ready, icon: CheckCircle },
            { label: "Caution", count: counts.caution, color: COLORS.caution, icon: AlertTriangle },
            { label: "Fatigued", count: counts.fatigued, color: COLORS.fatigued, icon: XCircle },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border p-4 flex flex-col items-center justify-center"
              style={{
                background: `${stat.color}06`,
                borderColor: `${stat.color}20`,
              }}
            >
              <stat.icon className="h-5 w-5 mb-2" style={{ color: stat.color }} />
              <span className="text-3xl font-bold font-mono" style={{ color: stat.color }}>
                {stat.count}
              </span>
              <span className="text-xs text-white/40 uppercase tracking-wider mt-1">{stat.label}</span>
              <span className="text-xs text-white/20 font-mono mt-0.5">
                {players.length > 0 ? Math.round((stat.count / players.length) * 100) : 0}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* AI Brief */}
      <div
        className="rounded-xl border p-5"
        style={{
          background: "rgba(10,14,26,0.8)",
          borderColor: "rgba(168,85,247,0.12)",
        }}
      >
        {aiNarrative ? (
          <div className="flex items-start gap-3">
            <Brain className="h-5 w-5 shrink-0 mt-0.5 text-[#a855f7]" />
            <div>
              <p className="text-xs text-[#a855f7] font-semibold mb-1.5 uppercase tracking-wider">
                AI Squad Readiness Brief
              </p>
              <p className="text-sm text-white/50 leading-relaxed">{aiNarrative}</p>
            </div>
          </div>
        ) : (
          <button
            onClick={generateBrief}
            disabled={aiLoading}
            className="flex items-center gap-2 text-sm px-4 py-2.5 rounded-lg border transition-all duration-200 disabled:opacity-40 hover:bg-[#a855f7]/10"
            style={{
              borderColor: "rgba(168,85,247,0.25)",
              background: "rgba(168,85,247,0.06)",
              color: "#a855f7",
            }}
          >
            {aiLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Generating squad brief...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4" /> Generate AI Squad Readiness Brief
              </>
            )}
          </button>
        )}
      </div>

      {/* Recommended Starting XI */}
      <RecommendedXI players={players} />

      {/* Player List — expandable rows with factor breakdown + actions */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{
          background: "rgba(10,14,26,0.8)",
          borderColor: "rgba(255,255,255,0.06)",
        }}
      >
        <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-[#00d4ff]" />
            <h3 className="text-sm font-semibold text-white">All Players</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/30">Sort:</span>
            {(["readiness", "name", "position"] as const).map((key) => (
              <button
                key={key}
                onClick={() => setSortBy(key)}
                className={`text-xs px-2 py-1 rounded transition-all ${
                  sortBy === key
                    ? "bg-[#00d4ff]/15 text-[#00d4ff]"
                    : "text-white/30 hover:text-white/60"
                }`}
              >
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-white/[0.04]">
          {sortedPlayers.map((player) => {
            const isExpanded = expandedPlayer === player.id;
            const scoreColor = player.readinessScore >= 70 ? COLORS.ready : player.readinessScore >= 45 ? COLORS.caution : COLORS.fatigued;

            return (
              <div key={player.id}>
                <button
                  onClick={() =>
                    setExpandedPlayer(isExpanded ? null : player.id)
                  }
                  className="w-full px-5 py-3 flex items-center gap-4 hover:bg-white/[0.02] transition-all"
                >
                  <span className="text-xs font-mono text-white/30 w-6">#{player.jerseyNumber}</span>
                  <div className="flex-1 min-w-0 text-left">
                    <a
                      href={`/players/${player.id}`}
                      className="text-sm font-medium text-white hover:text-[#00d4ff] transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {player.name}
                    </a>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-white/30">{player.position}</span>
                      <span className="text-xs text-white/20">{player.ageGroup}</span>
                    </div>
                  </div>
                  <div className="w-32 hidden sm:block">
                    <ReadinessBar score={player.readinessScore} />
                  </div>
                  <StatusBadge status={player.status} />
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-white/20" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-white/20" />
                  )}
                </button>

                {/* Expanded detail with factors + actions */}
                <div
                  className="transition-[max-height,opacity] duration-300 ease-in-out overflow-hidden"
                  style={{
                    maxHeight: isExpanded ? "500px" : "0px",
                    opacity: isExpanded ? 1 : 0,
                  }}
                >
                  <div
                    className="px-5 pb-4 pt-1 ml-10"
                    style={{
                      background: "rgba(255,255,255,0.01)",
                    }}
                  >
                    {/* Factor breakdown */}
                    <p className="text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-2">Factor Breakdown</p>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {[
                        { label: "Load Trend", value: player.factors.loadTrend, max: 25 },
                        { label: "Recovery", value: player.factors.recoveryQuality, max: 25 },
                        { label: "Rest Days", value: player.factors.daysSinceHighIntensity, max: 20 },
                        { label: "ACWR Fit", value: player.factors.acwrProximity, max: 20 },
                        { label: "Performance", value: player.factors.performanceTrend, max: 10 },
                      ].map((f) => (
                        <div
                          key={f.label}
                          className="rounded-lg px-3 py-2"
                          style={{
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.05)",
                          }}
                        >
                          <p className="text-xs text-white/40 mb-1">{f.label}</p>
                          <div className="flex items-baseline gap-1">
                            <span className="text-sm font-mono font-bold text-white">{f.value}</span>
                            <span className="text-xs text-white/20">/{f.max}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Recent form summary */}
                    {player.latestAcwr !== null && (
                      <p className="text-xs text-white/30 mt-2 font-mono">
                        ACWR: {player.latestAcwr.toFixed(2)}
                        {player.latestRecovery !== null && ` | Recovery: ${player.latestRecovery} bpm`}
                      </p>
                    )}

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      <a
                        href={`/players/${player.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                        style={{
                          background: "rgba(0,212,255,0.08)",
                          border: "1px solid rgba(0,212,255,0.20)",
                          color: "#00d4ff",
                        }}
                      >
                        <Eye className="h-3 w-3" />
                        View Profile
                      </a>
                      {player.status === "ready" && (
                        <button
                          onClick={(e) => { e.stopPropagation(); console.log(`Add to XI: ${player.name}`); }}
                          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                          style={{
                            background: "rgba(0,255,136,0.08)",
                            border: "1px solid rgba(0,255,136,0.20)",
                            color: "#00ff88",
                          }}
                        >
                          <UserPlus className="h-3 w-3" />
                          Add to Starting XI
                        </button>
                      )}
                      {player.status === "fatigued" && (
                        <button
                          onClick={(e) => { e.stopPropagation(); console.log(`Rest: ${player.name}`); }}
                          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                          style={{
                            background: "rgba(255,51,85,0.08)",
                            border: "1px solid rgba(255,51,85,0.20)",
                            color: "#ff3355",
                          }}
                        >
                          <UserMinus className="h-3 w-3" />
                          Rest Player
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
