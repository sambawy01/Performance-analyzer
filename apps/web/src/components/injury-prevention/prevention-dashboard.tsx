"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  Shield,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Sparkles,
  Activity,
  Heart,
  Zap,
  Moon,
  TrendingUp,
  TrendingDown,
  Clock,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  BarChart3,
  Calendar,
} from "lucide-react";
import { ExportShareBar } from "@/components/ui/export-share-bar";

// Dynamic import Recharts components (SSR: false)
const AcwrTrendChart = dynamic(
  () => import("./acwr-trend-chart").then((m) => m.AcwrTrendChart),
  { ssr: false }
);
const WeeklyLoadChart = dynamic(
  () => import("./weekly-load-chart").then((m) => m.WeeklyLoadChart),
  { ssr: false }
);
const RiskForecastChart = dynamic(
  () => import("./risk-forecast-chart").then((m) => m.RiskForecastChart),
  { ssr: false }
);

/* ────────────────────────────────────────────
   Types
   ──────────────────────────────────────────── */

export interface PlayerRiskData {
  id: string;
  name: string;
  jerseyNumber: number;
  position: string;
  ageGroup: string;
  riskPct: number;
  severity: "green" | "amber" | "red";
  acwrHistory: { week: string; acwr: number }[];
  currentAcwr: number | null;
  hrRecoveryTrend: number[]; // last 5 recovery values
  currentHrRecovery: number | null;
  weeklyTrimp: number;
  highIntensityPct: number;
  daysSinceRest: number;
  amberPlusCount30d: number;
  // 7-day forecast (computed client side as baseline, AI can override)
  riskForecast: number[];
}

export interface WeeklyLoadDay {
  day: string;
  date: string;
  load: number;
  type: string | null;
}

export interface PreventionDashboardProps {
  players: PlayerRiskData[];
  weeklyLoad: WeeklyLoadDay[];
  academyId: string;
}

/* ────────────────────────────────────────────
   Risk Heatmap Grid
   ──────────────────────────────────────────── */

function SquadRiskHeatmap({
  players,
  selectedPlayerId,
  onSelectPlayer,
}: {
  players: PlayerRiskData[];
  selectedPlayerId: string | null;
  onSelectPlayer: (id: string) => void;
}) {
  const sorted = useMemo(
    () => [...players].sort((a, b) => b.riskPct - a.riskPct),
    [players]
  );

  const getRiskColor = (pct: number) => {
    if (pct >= 60) return { bg: "rgba(255,51,85,0.25)", border: "rgba(255,51,85,0.5)", text: "#ff3355", glow: "0 0 12px rgba(255,51,85,0.3)" };
    if (pct >= 35) return { bg: "rgba(245,158,11,0.2)", border: "rgba(245,158,11,0.4)", text: "#f59e0b", glow: "0 0 8px rgba(245,158,11,0.2)" };
    return { bg: "rgba(0,255,136,0.1)", border: "rgba(0,255,136,0.2)", text: "#00ff88", glow: "none" };
  };

  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
      {sorted.map((p) => {
        const colors = getRiskColor(p.riskPct);
        const isSelected = selectedPlayerId === p.id;
        return (
          <button
            key={p.id}
            onClick={() => onSelectPlayer(p.id)}
            className={`relative flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 ${
              isSelected ? "ring-2 ring-white/30 scale-105" : "hover:scale-105"
            }`}
            style={{
              background: colors.bg,
              border: `1px solid ${colors.border}`,
              boxShadow: isSelected ? `${colors.glow}, 0 0 20px rgba(255,255,255,0.05)` : colors.glow,
            }}
          >
            <span className="font-mono text-xs font-bold" style={{ color: colors.text }}>
              #{p.jerseyNumber}
            </span>
            <span className="text-[9px] text-white/50 truncate w-full text-center mt-0.5">
              {p.name.split(" ").pop()}
            </span>
            <span className="font-mono text-lg font-bold mt-0.5" style={{ color: colors.text }}>
              {p.riskPct}%
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ────────────────────────────────────────────
   Player Risk Detail Card (expandable)
   ──────────────────────────────────────────── */

function PlayerRiskDetail({
  player,
  isExpanded,
  onToggle,
  aiProtocol,
}: {
  player: PlayerRiskData;
  isExpanded: boolean;
  onToggle: () => void;
  aiProtocol: any | null;
}) {
  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const forecastData = (aiProtocol?.riskForecast ?? player.riskForecast).map(
    (risk: number, i: number) => ({
      day: dayLabels[i],
      risk,
    })
  );

  const sevColor =
    player.severity === "red"
      ? "#ff3355"
      : player.severity === "amber"
      ? "#f59e0b"
      : "#00ff88";

  // HR Recovery trend direction
  const recoveryTrend = player.hrRecoveryTrend;
  const isRecoveryDeclining =
    recoveryTrend.length >= 3 &&
    recoveryTrend[recoveryTrend.length - 1] < recoveryTrend[0];

  return (
    <div
      className="rounded-xl border transition-all duration-200"
      style={{
        borderColor: `${sevColor}30`,
        background: `linear-gradient(135deg, ${sevColor}08, transparent)`,
      }}
    >
      {/* Header row */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        <div
          className="h-10 w-10 rounded-xl flex items-center justify-center font-mono text-sm font-bold shrink-0"
          style={{ background: `${sevColor}20`, color: sevColor }}
        >
          #{player.jerseyNumber}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">{player.name}</span>
            <span className="text-xs text-white/30">{player.position}</span>
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-[10px] text-white/40">
            <span className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              ACWR {player.currentAcwr?.toFixed(2) ?? "N/A"}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              Rec {player.currentHrRecovery ?? "N/A"} bpm
            </span>
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Z4+5: {player.highIntensityPct.toFixed(0)}%
            </span>
            <span className="flex items-center gap-1">
              <Moon className="h-3 w-3" />
              {player.daysSinceRest}d no rest
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xl font-bold" style={{ color: sevColor }}>
            {player.riskPct}%
          </span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-white/30" />
          ) : (
            <ChevronDown className="h-4 w-4 text-white/30" />
          )}
        </div>
      </button>

      {/* Expanded detail */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-white/[0.06] pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* ACWR Trend */}
            <div>
              <h5 className="text-xs font-semibold text-white/60 mb-2 flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-[#22d3ee]" />
                ACWR Trend (4 weeks)
              </h5>
              <AcwrTrendChart data={player.acwrHistory} playerName={player.name} />
            </div>

            {/* 7-day Risk Forecast */}
            <div>
              <h5 className="text-xs font-semibold text-white/60 mb-2 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-[#ff3355]" />
                7-Day Risk Forecast
              </h5>
              <RiskForecastChart data={forecastData} playerName={player.name} />
              {aiProtocol?.forecastNarrative && (
                <p className="text-[11px] text-white/40 mt-2 italic leading-relaxed">
                  {aiProtocol.forecastNarrative}
                </p>
              )}
            </div>
          </div>

          {/* Risk factors grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] p-3 text-center">
              <div className="text-[10px] text-white/30 uppercase tracking-wider mb-1">ACWR</div>
              <div
                className="font-mono text-lg font-bold"
                style={{
                  color:
                    (player.currentAcwr ?? 1) > 1.5
                      ? "#ff3355"
                      : (player.currentAcwr ?? 1) > 1.3
                      ? "#f59e0b"
                      : "#00ff88",
                }}
              >
                {player.currentAcwr?.toFixed(2) ?? "N/A"}
              </div>
            </div>
            <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] p-3 text-center">
              <div className="text-[10px] text-white/30 uppercase tracking-wider mb-1">HR Recovery</div>
              <div className="flex items-center justify-center gap-1">
                <span
                  className="font-mono text-lg font-bold"
                  style={{ color: isRecoveryDeclining ? "#ff3355" : "#00ff88" }}
                >
                  {player.currentHrRecovery ?? "N/A"}
                </span>
                {isRecoveryDeclining ? (
                  <TrendingDown className="h-3.5 w-3.5 text-[#ff3355]" />
                ) : (
                  <TrendingUp className="h-3.5 w-3.5 text-[#00ff88]" />
                )}
              </div>
            </div>
            <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] p-3 text-center">
              <div className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Weekly TRIMP</div>
              <div
                className="font-mono text-lg font-bold"
                style={{ color: player.weeklyTrimp > 700 ? "#ff3355" : player.weeklyTrimp > 500 ? "#f59e0b" : "#00ff88" }}
              >
                {Math.round(player.weeklyTrimp)}
              </div>
            </div>
            <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] p-3 text-center">
              <div className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Amber+ (30d)</div>
              <div
                className="font-mono text-lg font-bold"
                style={{ color: player.amberPlusCount30d >= 6 ? "#ff3355" : player.amberPlusCount30d >= 3 ? "#f59e0b" : "#00ff88" }}
              >
                {player.amberPlusCount30d}x
              </div>
            </div>
          </div>

          {/* AI Prevention Protocol */}
          {aiProtocol && (
            <div className="space-y-3">
              {/* Session Modifications */}
              {aiProtocol.sessionModifications?.length > 0 && (
                <div className="rounded-lg bg-[#f59e0b]/5 border border-[#f59e0b]/15 p-3">
                  <h6 className="text-[10px] font-bold text-[#f59e0b] uppercase tracking-wider mb-2 flex items-center gap-1">
                    <ShieldAlert className="h-3 w-3" />
                    Session Modifications
                  </h6>
                  <ul className="space-y-1">
                    {aiProtocol.sessionModifications.map((mod: string, i: number) => (
                      <li key={i} className="text-xs text-white/60 flex items-start gap-1.5">
                        <XCircle className="h-3 w-3 text-[#f59e0b] shrink-0 mt-0.5" />
                        {mod}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recovery Protocols */}
              {aiProtocol.recoveryProtocols?.length > 0 && (
                <div className="rounded-lg bg-[#22d3ee]/5 border border-[#22d3ee]/15 p-3">
                  <h6 className="text-[10px] font-bold text-[#22d3ee] uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    Recovery Protocols
                  </h6>
                  <ul className="space-y-1">
                    {aiProtocol.recoveryProtocols.map((rec: string, i: number) => (
                      <li key={i} className="text-xs text-white/60 flex items-start gap-1.5">
                        <CheckCircle2 className="h-3 w-3 text-[#22d3ee] shrink-0 mt-0.5" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Return Criteria */}
              {aiProtocol.returnCriteria?.length > 0 && (
                <div className="rounded-lg bg-[#00ff88]/5 border border-[#00ff88]/15 p-3">
                  <h6 className="text-[10px] font-bold text-[#00ff88] uppercase tracking-wider mb-2 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Return-to-Full-Training Criteria
                  </h6>
                  <ul className="space-y-1">
                    {aiProtocol.returnCriteria.map((c: string, i: number) => (
                      <li key={i} className="text-xs text-white/60 flex items-start gap-1.5">
                        <span className="text-[#00ff88] shrink-0">--</span>
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* AI Recommendation */}
              {aiProtocol.aiRecommendation && (
                <div className="rounded-lg bg-[#a855f7]/5 border border-[#a855f7]/15 p-3">
                  <h6 className="text-[10px] font-bold text-[#a855f7] uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    AI Recommendation
                  </h6>
                  <p className="text-xs text-white/60 leading-relaxed">
                    {aiProtocol.aiRecommendation}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────
   Historical Patterns
   ──────────────────────────────────────────── */

function HistoricalPatterns({ players }: { players: PlayerRiskData[] }) {
  const frequentRisk = useMemo(
    () =>
      [...players]
        .filter((p) => p.amberPlusCount30d >= 3)
        .sort((a, b) => b.amberPlusCount30d - a.amberPlusCount30d)
        .slice(0, 8),
    [players]
  );

  if (frequentRisk.length === 0) {
    return (
      <div className="text-center py-6">
        <CheckCircle2 className="h-6 w-6 text-[#00ff88]/30 mx-auto mb-2" />
        <p className="text-xs text-white/30">No chronic overload patterns detected in the last 30 days.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {frequentRisk.map((p) => (
        <div
          key={p.id}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]"
        >
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center font-mono text-xs font-bold shrink-0"
            style={{
              background: p.amberPlusCount30d >= 6 ? "rgba(255,51,85,0.15)" : "rgba(245,158,11,0.15)",
              color: p.amberPlusCount30d >= 6 ? "#ff3355" : "#f59e0b",
            }}
          >
            #{p.jerseyNumber}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-sm text-white/80 font-medium">{p.name}</span>
            <p className="text-[10px] text-white/40 mt-0.5">
              Amber+ zone <span className="font-mono font-bold" style={{ color: p.amberPlusCount30d >= 6 ? "#ff3355" : "#f59e0b" }}>{p.amberPlusCount30d}x</span> in last 30 days
              {p.amberPlusCount30d >= 6 && " — chronic overload pattern"}
            </p>
          </div>
          <div className="w-20 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(100, (p.amberPlusCount30d / 10) * 100)}%`,
                background: p.amberPlusCount30d >= 6
                  ? "linear-gradient(90deg, #f59e0b, #ff3355)"
                  : "linear-gradient(90deg, #00ff88, #f59e0b)",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────
   Main Prevention Dashboard
   ──────────────────────────────────────────── */

export function PreventionDashboard({
  players,
  weeklyLoad,
  academyId,
}: PreventionDashboardProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiProtocols, setAiProtocols] = useState<Record<string, any>>({});
  const [aiNarrative, setAiNarrative] = useState<string | null>(null);
  const [aiWeeklyAdvice, setAiWeeklyAdvice] = useState<string | null>(null);
  const [aiHistoricalPattern, setAiHistoricalPattern] = useState<string | null>(null);

  // Stats
  const redCount = players.filter((p) => p.severity === "red").length;
  const amberCount = players.filter((p) => p.severity === "amber").length;
  const greenCount = players.filter((p) => p.severity === "green").length;

  // At-risk players sorted by risk
  const atRiskPlayers = useMemo(
    () => [...players].filter((p) => p.riskPct > 25).sort((a, b) => b.riskPct - a.riskPct),
    [players]
  );

  // Weekly load analysis
  const totalWeekLoad = weeklyLoad.reduce((s, d) => s + d.load, 0);
  const avgDayLoad = weeklyLoad.length > 0 ? Math.round(totalWeekLoad / weeklyLoad.filter((d) => d.load > 0).length || 1) : 0;
  const optimalLow = Math.round(avgDayLoad * 0.7);
  const optimalHigh = Math.round(avgDayLoad * 1.3);

  // Load distribution analysis
  const firstHalf = weeklyLoad.slice(0, 3).reduce((s, d) => s + d.load, 0);
  const secondHalf = weeklyLoad.slice(3).reduce((s, d) => s + d.load, 0);
  const loadDistribution =
    firstHalf > secondHalf * 1.5
      ? "front-loaded"
      : secondHalf > firstHalf * 1.5
      ? "back-loaded"
      : "balanced";

  const handleRunAI = async () => {
    setAiLoading(true);
    try {
      const riskPayload = atRiskPlayers.map((p) => ({
        name: p.name,
        jerseyNumber: p.jerseyNumber,
        position: p.position,
        riskPct: p.riskPct,
        severity: p.severity,
        acwr: p.currentAcwr,
        hrRecovery: p.currentHrRecovery,
        weeklyTrimp: p.weeklyTrimp,
        highIntensityPct: p.highIntensityPct,
        daysSinceRest: p.daysSinceRest,
        amberCount: p.amberPlusCount30d,
      }));

      const res = await fetch("/api/ai/injury-prevention", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ academy_id: academyId, playersAtRisk: riskPayload }),
      });

      if (!res.ok) throw new Error("AI prevention analysis failed");
      const data = await res.json();

      setAiNarrative(data.squadNarrative ?? null);
      setAiWeeklyAdvice(data.weeklyLoadAdvice ?? null);
      setAiHistoricalPattern(data.historicalPattern ?? null);

      // Map protocols by player name
      const protocolMap: Record<string, any> = {};
      for (const proto of data.playerProtocols ?? []) {
        const player = atRiskPlayers.find(
          (p) => p.jerseyNumber === proto.jerseyNumber || p.name === proto.name
        );
        if (player) {
          protocolMap[player.id] = proto;
        }
      }
      setAiProtocols(protocolMap);
    } catch (err) {
      console.error("AI prevention error:", err);
    } finally {
      setAiLoading(false);
    }
  };

  // When a player is clicked in heatmap, scroll to and expand their detail
  const handleSelectPlayer = (id: string) => {
    setSelectedPlayerId(id);
    setExpandedPlayerId(id);
  };

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-[#ff3355]" style={{ boxShadow: "0 0 8px rgba(255,51,85,0.5)" }} />
            <span className="text-sm font-mono text-white/70">
              <span className="text-[#ff3355] font-bold">{redCount}</span> High Risk
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-[#f59e0b]" style={{ boxShadow: "0 0 8px rgba(245,158,11,0.5)" }} />
            <span className="text-sm font-mono text-white/70">
              <span className="text-[#f59e0b] font-bold">{amberCount}</span> Moderate
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-[#00ff88]" style={{ boxShadow: "0 0 8px rgba(0,255,136,0.5)" }} />
            <span className="text-sm font-mono text-white/70">
              <span className="text-[#00ff88] font-bold">{greenCount}</span> Safe
            </span>
          </div>
        </div>

        <div className="flex-1" />

        <button
          onClick={handleRunAI}
          disabled={aiLoading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
          style={{
            background: aiLoading
              ? "rgba(168,85,247,0.15)"
              : "linear-gradient(135deg, rgba(255,51,85,0.25), rgba(168,85,247,0.15))",
            border: "1px solid rgba(255,51,85,0.3)",
            color: "white",
          }}
        >
          {aiLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 text-[#a855f7]" />
              Generate AI Prevention Plan
            </>
          )}
        </button>

        <ExportShareBar
          title="Injury Prevention Report"
          content={aiNarrative ?? `Squad Risk: ${redCount} high, ${amberCount} moderate, ${greenCount} safe`}
        />
      </div>

      {/* AI Narrative */}
      {aiNarrative && (
        <div className="rounded-xl border border-[#a855f7]/20 bg-[#a855f7]/5 p-4">
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-[#a855f7] shrink-0 mt-0.5" />
            <p className="text-sm text-white/70 leading-relaxed">{aiNarrative}</p>
          </div>
        </div>
      )}

      {/* Section 1: Squad Risk Heatmap */}
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Shield className="h-4 w-4 text-[#ff3355]" />
          Squad Risk Heatmap
        </h3>
        <SquadRiskHeatmap
          players={players}
          selectedPlayerId={selectedPlayerId}
          onSelectPlayer={handleSelectPlayer}
        />
      </div>

      {/* Section 2: Weekly Load Periodization */}
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[#22d3ee]" />
              Weekly Load Periodization
            </h3>
            <p className="text-[11px] text-white/40 mt-0.5">
              Team avg TRIMP per day &middot; Green band = optimal zone &middot; Distribution: <span className={
                loadDistribution === "balanced" ? "text-[#00ff88]" : "text-[#f59e0b]"
              }>{loadDistribution}</span>
            </p>
          </div>
          <div className="text-right">
            <span className="font-mono text-lg font-bold text-white">{totalWeekLoad}</span>
            <span className="text-[10px] text-white/30 block">Total TRIMP</span>
          </div>
        </div>
        <WeeklyLoadChart data={weeklyLoad} optimalLow={optimalLow} optimalHigh={optimalHigh} />
        {aiWeeklyAdvice && (
          <div className="mt-3 rounded-lg bg-[#22d3ee]/5 border border-[#22d3ee]/15 p-3 flex items-start gap-2">
            <Sparkles className="h-3.5 w-3.5 text-[#22d3ee] shrink-0 mt-0.5" />
            <p className="text-xs text-white/50 leading-relaxed">{aiWeeklyAdvice}</p>
          </div>
        )}
      </div>

      {/* Section 3: Risk Factor Analysis (per player) */}
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-[#f59e0b]" />
          Risk Factor Analysis &amp; Prevention Protocols
          <span className="text-[10px] font-mono text-white/30 ml-auto">
            {atRiskPlayers.length} player{atRiskPlayers.length !== 1 ? "s" : ""} flagged
          </span>
        </h3>
        {atRiskPlayers.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="h-8 w-8 text-[#00ff88]/20 mx-auto mb-2" />
            <p className="text-sm text-white/30">All players are in the safe zone. No prevention protocols needed.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {atRiskPlayers.map((p) => (
              <PlayerRiskDetail
                key={p.id}
                player={p}
                isExpanded={expandedPlayerId === p.id}
                onToggle={() =>
                  setExpandedPlayerId(expandedPlayerId === p.id ? null : p.id)
                }
                aiProtocol={aiProtocols[p.id] ?? null}
              />
            ))}
          </div>
        )}
      </div>

      {/* Section 4: Historical Injury Patterns */}
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Clock className="h-4 w-4 text-[#a855f7]" />
          Historical Injury Patterns (30 days)
        </h3>
        <HistoricalPatterns players={players} />
        {aiHistoricalPattern && (
          <div className="mt-3 rounded-lg bg-[#a855f7]/5 border border-[#a855f7]/15 p-3 flex items-start gap-2">
            <Sparkles className="h-3.5 w-3.5 text-[#a855f7] shrink-0 mt-0.5" />
            <p className="text-xs text-white/50 leading-relaxed">{aiHistoricalPattern}</p>
          </div>
        )}
      </div>
    </div>
  );
}
