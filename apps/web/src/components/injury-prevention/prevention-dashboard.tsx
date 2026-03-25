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
  Scale,
  Brain,
  Eye,
  BedDouble,
  Gauge,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Info,
} from "lucide-react";
import { ExportShareBar } from "@/components/ui/export-share-bar";
import type { ContributingFactor, RecoveryFactor } from "@/lib/injury/risk-engine";

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
  hrRecoveryTrend: number[];
  currentHrRecovery: number | null;
  weeklyTrimp: number;
  highIntensityPct: number;
  daysSinceRest: number;
  amberPlusCount30d: number;
  riskForecast: number[];
  // Enhanced fields
  monotony: number;
  strain: number;
  monotonyRisk: "low" | "moderate" | "high";
  cumulativeLoad14d: number;
  cumulativeThreshold: number;
  cumulativeRisk: "low" | "moderate" | "high";
  ewmaAcwr: number;
  ewmaAcute: number;
  ewmaChronic: number;
  asymmetryScore: number;
  asymmetryDirection: "left" | "right" | "balanced";
  asymmetryRisk: "low" | "moderate" | "high";
  recoveryScore: number | null;
  recoveryFactors: RecoveryFactor[];
  recoveryRisk: "low" | "moderate" | "high";
  multiFactorRiskLevel: "low" | "moderate" | "high" | "critical";
  multiFactorRiskColor: string;
  contributingFactors: ContributingFactor[];
  overallRecommendation: string;
  hasWellnessData: boolean;
  acwrTrend: "rising" | "stable" | "falling";
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
   Utility
   ──────────────────────────────────────────── */

function riskBadge(risk: string) {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    low: { bg: "rgba(0,255,136,0.1)", text: "#00ff88", border: "rgba(0,255,136,0.2)" },
    moderate: { bg: "rgba(245,158,11,0.1)", text: "#f59e0b", border: "rgba(245,158,11,0.2)" },
    high: { bg: "rgba(255,51,85,0.1)", text: "#ff3355", border: "rgba(255,51,85,0.2)" },
    critical: { bg: "rgba(255,51,85,0.2)", text: "#ff3355", border: "rgba(255,51,85,0.4)" },
    safe: { bg: "rgba(0,255,136,0.1)", text: "#00ff88", border: "rgba(0,255,136,0.2)" },
    caution: { bg: "rgba(245,158,11,0.1)", text: "#f59e0b", border: "rgba(245,158,11,0.2)" },
    danger: { bg: "rgba(255,51,85,0.1)", text: "#ff3355", border: "rgba(255,51,85,0.2)" },
  };
  const c = colors[risk] ?? colors["low"];
  return (
    <span
      className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
    >
      {risk}
    </span>
  );
}

function getRiskColor(pct: number) {
  if (pct >= 60) return { bg: "rgba(255,51,85,0.25)", border: "rgba(255,51,85,0.5)", text: "#ff3355", glow: "0 0 12px rgba(255,51,85,0.3)" };
  if (pct >= 35) return { bg: "rgba(245,158,11,0.2)", border: "rgba(245,158,11,0.4)", text: "#f59e0b", glow: "0 0 8px rgba(245,158,11,0.2)" };
  return { bg: "rgba(0,255,136,0.1)", border: "rgba(0,255,136,0.2)", text: "#00ff88", glow: "none" };
}

/* ────────────────────────────────────────────
   Multi-Factor Risk Overview (NEW)
   ──────────────────────────────────────────── */

function MultiFactorRiskOverview({
  players,
  onSelectPlayer,
}: {
  players: PlayerRiskData[];
  onSelectPlayer: (id: string) => void;
}) {
  const sorted = useMemo(
    () => [...players].sort((a, b) => b.riskPct - a.riskPct),
    [players]
  );

  const criticalCount = players.filter((p) => p.multiFactorRiskLevel === "critical").length;
  const highCount = players.filter((p) => p.multiFactorRiskLevel === "high").length;
  const moderateCount = players.filter((p) => p.multiFactorRiskLevel === "moderate").length;
  const lowCount = players.filter((p) => p.multiFactorRiskLevel === "low").length;

  // Top risk contributors across the squad
  const topContributors = useMemo(() => {
    const factorTotals = new Map<string, { total: number; count: number }>();
    for (const p of players) {
      for (const f of p.contributingFactors) {
        const existing = factorTotals.get(f.name) ?? { total: 0, count: 0 };
        existing.total += f.contribution;
        existing.count++;
        factorTotals.set(f.name, existing);
      }
    }
    return [...factorTotals.entries()]
      .map(([name, { total, count }]) => ({ name, avg: total / count }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 4);
  }, [players]);

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Critical", count: criticalCount, color: "#ff3355", glow: "rgba(255,51,85,0.3)" },
          { label: "High", count: highCount, color: "#ff6b35", glow: "rgba(255,107,53,0.3)" },
          { label: "Moderate", count: moderateCount, color: "#f59e0b", glow: "rgba(245,158,11,0.3)" },
          { label: "Low", count: lowCount, color: "#00ff88", glow: "rgba(0,255,136,0.3)" },
        ].map((tier) => (
          <div
            key={tier.label}
            className="rounded-xl p-3 text-center"
            style={{
              background: `${tier.color}08`,
              border: `1px solid ${tier.color}20`,
            }}
          >
            <div className="font-mono text-2xl font-bold" style={{ color: tier.color }}>
              {tier.count}
            </div>
            <div className="text-[10px] text-white/40 uppercase tracking-wider mt-0.5">
              {tier.label} Risk
            </div>
          </div>
        ))}
      </div>

      {/* Top risk contributors across squad */}
      {topContributors.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-[10px] text-white/30 uppercase tracking-wider self-center mr-1">
            Top Squad Risk Factors:
          </span>
          {topContributors.map((c) => (
            <span
              key={c.name}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium"
              style={{
                background: c.avg > 10 ? "rgba(255,51,85,0.1)" : c.avg > 5 ? "rgba(245,158,11,0.1)" : "rgba(0,255,136,0.1)",
                color: c.avg > 10 ? "#ff3355" : c.avg > 5 ? "#f59e0b" : "#00ff88",
                border: `1px solid ${c.avg > 10 ? "rgba(255,51,85,0.2)" : c.avg > 5 ? "rgba(245,158,11,0.2)" : "rgba(0,255,136,0.2)"}`,
              }}
            >
              {c.name}: {c.avg.toFixed(1)}
            </span>
          ))}
        </div>
      )}

      {/* Player risk tiles */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
        {sorted.map((p) => {
          const colors = getRiskColor(p.riskPct);
          return (
            <button
              key={p.id}
              onClick={() => onSelectPlayer(p.id)}
              className="relative flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 hover:scale-105"
              style={{
                background: colors.bg,
                border: `1px solid ${colors.border}`,
                boxShadow: colors.glow,
              }}
            >
              <span className="font-mono text-xs font-bold" style={{ color: colors.text }}>
                #{p.jerseyNumber}
              </span>
              <span className="text-[9px] text-white/50 truncate w-full text-center mt-0.5">
                {p.name.split(" ").pop()}
              </span>
              <span className="font-mono text-lg font-bold mt-0.5" style={{ color: colors.text }}>
                {p.riskPct}
              </span>
              <span
                className="text-[8px] font-bold uppercase tracking-wider"
                style={{ color: p.multiFactorRiskColor }}
              >
                {p.multiFactorRiskLevel}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   Training Monotony Panel (NEW)
   ──────────────────────────────────────────── */

function MonotonyPanel({ players, weeklyLoad }: { players: PlayerRiskData[]; weeklyLoad: WeeklyLoadDay[] }) {
  const squadAvgMonotony = useMemo(() => {
    const vals = players.filter((p) => p.monotony > 0).map((p) => p.monotony);
    return vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
  }, [players]);

  const squadAvgStrain = useMemo(() => {
    const vals = players.filter((p) => p.strain > 0).map((p) => p.strain);
    return vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
  }, [players]);

  const highMonotonyPlayers = useMemo(
    () => players.filter((p) => p.monotony > 2.0).sort((a, b) => b.monotony - a.monotony),
    [players]
  );

  const isMonotonyHigh = squadAvgMonotony > 2.0;
  const isStrainHigh = squadAvgStrain > 6000;

  return (
    <div className="space-y-4">
      {/* Squad monotony + strain cards */}
      <div className="grid grid-cols-2 gap-3">
        <div
          className="rounded-xl p-4"
          style={{
            background: isMonotonyHigh ? "rgba(255,51,85,0.06)" : "rgba(0,255,136,0.04)",
            border: `1px solid ${isMonotonyHigh ? "rgba(255,51,85,0.15)" : "rgba(255,255,255,0.06)"}`,
          }}
        >
          <div className="text-[10px] text-white/30 uppercase tracking-wider mb-1">
            Squad Avg Monotony
          </div>
          <div
            className="font-mono text-2xl font-bold"
            style={{ color: isMonotonyHigh ? "#ff3355" : squadAvgMonotony > 1.5 ? "#f59e0b" : "#00ff88" }}
          >
            {squadAvgMonotony.toFixed(2)}
          </div>
          <div className="text-[10px] text-white/30 mt-1">
            Threshold: 2.0 (Foster 1998)
          </div>
        </div>

        <div
          className="rounded-xl p-4"
          style={{
            background: isStrainHigh ? "rgba(255,51,85,0.06)" : "rgba(0,255,136,0.04)",
            border: `1px solid ${isStrainHigh ? "rgba(255,51,85,0.15)" : "rgba(255,255,255,0.06)"}`,
          }}
        >
          <div className="text-[10px] text-white/30 uppercase tracking-wider mb-1">
            Squad Avg Strain
          </div>
          <div
            className="font-mono text-2xl font-bold"
            style={{ color: isStrainHigh ? "#ff3355" : squadAvgStrain > 4000 ? "#f59e0b" : "#00ff88" }}
          >
            {Math.round(squadAvgStrain).toLocaleString()}
          </div>
          <div className="text-[10px] text-white/30 mt-1">
            Threshold: 6,000 AU
          </div>
        </div>
      </div>

      {/* Warning banner */}
      {(isMonotonyHigh || isStrainHigh) && (
        <div className="rounded-lg bg-[#f59e0b]/8 border border-[#f59e0b]/20 p-3 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-[#f59e0b] shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-[#f59e0b] font-semibold">Vary Your Training More</p>
            <p className="text-[11px] text-white/50 mt-0.5">
              {isMonotonyHigh
                ? `Squad monotony index (${squadAvgMonotony.toFixed(1)}) exceeds the 2.0 threshold. `
                : ""}
              {isStrainHigh
                ? `Training strain (${Math.round(squadAvgStrain)}) is above the 6,000 AU danger zone. `
                : ""}
              Alternate between high, medium, and low intensity days. Include varied session types (technical, tactical, fitness, recovery).
            </p>
          </div>
        </div>
      )}

      {/* Players with high monotony */}
      {highMonotonyPlayers.length > 0 && (
        <div>
          <h5 className="text-[10px] text-white/30 uppercase tracking-wider mb-2">
            Players With High Monotony (&gt;2.0)
          </h5>
          <div className="space-y-1.5">
            {highMonotonyPlayers.slice(0, 6).map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]"
              >
                <span className="font-mono text-xs font-bold text-[#ff3355]">#{p.jerseyNumber}</span>
                <span className="text-xs text-white/70 flex-1">{p.name}</span>
                <span className="font-mono text-xs text-[#ff3355]">{p.monotony.toFixed(2)}</span>
                <span className="text-[9px] text-white/30">monotony</span>
                <span className="font-mono text-xs text-[#f59e0b]">{p.strain.toLocaleString()}</span>
                <span className="text-[9px] text-white/30">strain</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily loads chart */}
      <div>
        <h5 className="text-[10px] text-white/30 uppercase tracking-wider mb-2">
          Daily Load Distribution (This Week)
        </h5>
        <WeeklyLoadChart
          data={weeklyLoad}
          optimalLow={Math.round(weeklyLoad.filter((d) => d.load > 0).reduce((s, d) => s + d.load, 0) / Math.max(1, weeklyLoad.filter((d) => d.load > 0).length) * 0.7)}
          optimalHigh={Math.round(weeklyLoad.filter((d) => d.load > 0).reduce((s, d) => s + d.load, 0) / Math.max(1, weeklyLoad.filter((d) => d.load > 0).length) * 1.3)}
        />
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   Cumulative Load Tracker (NEW)
   ──────────────────────────────────────────── */

function CumulativeLoadTracker({ players }: { players: PlayerRiskData[] }) {
  const atRiskPlayers = useMemo(
    () =>
      players
        .filter((p) => p.cumulativeRisk !== "low")
        .sort((a, b) => b.cumulativeLoad14d - a.cumulativeLoad14d),
    [players]
  );

  const allPlayers = useMemo(
    () => [...players].sort((a, b) => b.cumulativeLoad14d - a.cumulativeLoad14d).slice(0, 12),
    [players]
  );

  const displayPlayers = atRiskPlayers.length > 0 ? atRiskPlayers : allPlayers;

  return (
    <div className="space-y-3">
      {displayPlayers.map((p) => {
        const pct = Math.min(100, (p.cumulativeLoad14d / p.cumulativeThreshold) * 100);
        const isOver = pct >= 100;
        const isClose = pct >= 80;
        const barColor = isOver
          ? "linear-gradient(90deg, #f59e0b, #ff3355)"
          : isClose
          ? "linear-gradient(90deg, #00ff88, #f59e0b)"
          : "linear-gradient(90deg, #00ff88, #22d3ee)";

        return (
          <div key={p.id} className="flex items-center gap-3">
            <div className="w-24 flex items-center gap-2 shrink-0">
              <span
                className="font-mono text-xs font-bold"
                style={{ color: isOver ? "#ff3355" : isClose ? "#f59e0b" : "#00ff88" }}
              >
                #{p.jerseyNumber}
              </span>
              <span className="text-[10px] text-white/50 truncate">{p.name.split(" ").pop()}</span>
            </div>
            <div className="flex-1 h-2 bg-white/[0.06] rounded-full overflow-hidden relative">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, pct)}%`, background: barColor }}
              />
              {/* Threshold marker at 80% */}
              <div
                className="absolute top-0 h-full w-px bg-[#f59e0b]/40"
                style={{ left: "80%" }}
              />
            </div>
            <div className="w-28 text-right shrink-0">
              <span
                className="font-mono text-xs font-bold"
                style={{ color: isOver ? "#ff3355" : isClose ? "#f59e0b" : "#00ff88" }}
              >
                {p.cumulativeLoad14d.toLocaleString()}
              </span>
              <span className="text-[9px] text-white/20">
                /{p.cumulativeThreshold.toLocaleString()}
              </span>
            </div>
          </div>
        );
      })}

      {atRiskPlayers.length === 0 && (
        <p className="text-[11px] text-white/30 text-center py-2">
          No players exceeding 80% of their 14-day cumulative load threshold.
        </p>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────
   Movement Asymmetry Section (NEW)
   ──────────────────────────────────────────── */

function AsymmetrySection({ players }: { players: PlayerRiskData[] }) {
  const flaggedPlayers = useMemo(
    () =>
      players
        .filter((p) => p.asymmetryScore > 15)
        .sort((a, b) => b.asymmetryScore - a.asymmetryScore),
    [players]
  );

  if (flaggedPlayers.length === 0) {
    return (
      <div className="text-center py-6">
        <CheckCircle2 className="h-6 w-6 text-[#00ff88]/30 mx-auto mb-2" />
        <p className="text-xs text-white/30">
          No significant movement asymmetry detected. All players showing balanced patterns.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {flaggedPlayers.map((p) => (
        <div
          key={p.id}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]"
        >
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center font-mono text-xs font-bold shrink-0"
            style={{
              background: p.asymmetryRisk === "high" ? "rgba(255,51,85,0.15)" : "rgba(245,158,11,0.15)",
              color: p.asymmetryRisk === "high" ? "#ff3355" : "#f59e0b",
            }}
          >
            #{p.jerseyNumber}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-sm text-white/80 font-medium">{p.name}</span>
            <p className="text-[10px] text-white/40 mt-0.5">
              Score: <span className="font-mono font-bold" style={{ color: p.asymmetryRisk === "high" ? "#ff3355" : "#f59e0b" }}>
                {p.asymmetryScore}
              </span>
              {" | "}
              Favoring: <span className="text-white/60">{p.asymmetryDirection}</span>
              {p.asymmetryRisk === "high" && " -- Recommend physio assessment"}
            </p>
          </div>
          {riskBadge(p.asymmetryRisk)}
        </div>
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────
   Recovery & Wellness Section (NEW)
   ──────────────────────────────────────────── */

function RecoveryWellnessSection({ players }: { players: PlayerRiskData[] }) {
  const hasAnyWellness = players.some((p) => p.hasWellnessData);

  if (!hasAnyWellness) {
    return (
      <div className="text-center py-6">
        <BedDouble className="h-8 w-8 text-[#a855f7]/20 mx-auto mb-3" />
        <p className="text-sm text-white/40 font-medium">Morning Check-Ins Not Yet Enabled</p>
        <p className="text-xs text-white/25 mt-1 max-w-md mx-auto">
          Enable morning wellness check-ins in the player app for enhanced injury prevention.
          Captures soreness, energy, sleep quality, HRV, and resting heart rate each morning.
        </p>
        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#a855f7]/10 border border-[#a855f7]/20">
          <Info className="h-3.5 w-3.5 text-[#a855f7]" />
          <span className="text-[11px] text-[#a855f7]">
            Wellness data adds 20% weight to the risk model via HRV and recovery metrics
          </span>
        </div>
      </div>
    );
  }

  // Show players with wellness data sorted by recovery score (lowest first)
  const playersWithWellness = players
    .filter((p) => p.hasWellnessData && p.recoveryScore != null)
    .sort((a, b) => (a.recoveryScore ?? 100) - (b.recoveryScore ?? 100));

  return (
    <div className="space-y-2">
      {playersWithWellness.map((p) => {
        const score = p.recoveryScore ?? 50;
        const color = score < 40 ? "#ff3355" : score < 60 ? "#f59e0b" : "#00ff88";

        return (
          <div
            key={p.id}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]"
          >
            <span className="font-mono text-xs font-bold" style={{ color }}>
              #{p.jerseyNumber}
            </span>
            <span className="text-xs text-white/70 flex-1 min-w-0">{p.name}</span>

            {/* Factor badges */}
            <div className="flex items-center gap-1.5">
              {p.recoveryFactors.slice(0, 3).map((f) => (
                <span
                  key={f.name}
                  className="text-[9px] px-1.5 py-0.5 rounded"
                  style={{
                    background: f.status === "poor" ? "rgba(255,51,85,0.1)" : f.status === "warning" ? "rgba(245,158,11,0.1)" : "rgba(0,255,136,0.1)",
                    color: f.status === "poor" ? "#ff3355" : f.status === "warning" ? "#f59e0b" : "#00ff88",
                  }}
                >
                  {f.name}: {f.value}
                </span>
              ))}
            </div>

            <div
              className="font-mono text-sm font-bold w-10 text-right"
              style={{ color }}
            >
              {score}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ────────────────────────────────────────────
   7-Day Risk Forecast (Enhanced) (NEW)
   ──────────────────────────────────────────── */

function EnhancedRiskForecast({ players }: { players: PlayerRiskData[] }) {
  const dayLabels = ["Today", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Get top 5 most at-risk players
  const topRisk = useMemo(
    () => [...players].sort((a, b) => b.riskPct - a.riskPct).slice(0, 5),
    [players]
  );

  // Find players projected to reach critical
  const willReachCritical = useMemo(
    () =>
      topRisk.filter((p) => {
        const maxProjected = Math.max(...p.riskForecast);
        return maxProjected >= 75 && p.riskPct < 75;
      }),
    [topRisk]
  );

  return (
    <div className="space-y-4">
      {/* Alert: players projected to hit critical */}
      {willReachCritical.length > 0 && (
        <div className="rounded-lg bg-[#ff3355]/8 border border-[#ff3355]/20 p-3">
          <div className="flex items-start gap-2">
            <ShieldAlert className="h-4 w-4 text-[#ff3355] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-[#ff3355] font-semibold">Critical Risk Projected</p>
              <p className="text-[11px] text-white/50 mt-0.5">
                {willReachCritical.map((p) => {
                  const critDay = p.riskForecast.findIndex((r) => r >= 75);
                  return `${p.name} reaches critical risk by ${dayLabels[critDay] ?? `day ${critDay}`}`;
                }).join(". ")}
                . If current training pattern continues.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Per-player forecast charts */}
      {topRisk.map((p) => {
        const forecastData = p.riskForecast.map((risk, i) => ({
          day: dayLabels[i] ?? `D${i + 1}`,
          risk,
        }));

        return (
          <div key={p.id} className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-3">
            <div className="flex items-center gap-2 mb-2">
              <span
                className="font-mono text-xs font-bold"
                style={{ color: p.multiFactorRiskColor }}
              >
                #{p.jerseyNumber}
              </span>
              <span className="text-xs text-white/70">{p.name}</span>
              <span className="text-[9px] text-white/30">{p.position}</span>
              <div className="flex-1" />
              <span
                className="font-mono text-sm font-bold"
                style={{ color: p.multiFactorRiskColor }}
              >
                {p.riskPct}
              </span>
              <ArrowUpRight
                className="h-3 w-3"
                style={{
                  color:
                    p.riskForecast[6] > p.riskPct
                      ? "#ff3355"
                      : p.riskForecast[6] < p.riskPct
                      ? "#00ff88"
                      : "#f59e0b",
                }}
              />
            </div>
            <RiskForecastChart data={forecastData} playerName={p.name} />
          </div>
        );
      })}
    </div>
  );
}

/* ────────────────────────────────────────────
   Player Risk Detail Card (Enhanced)
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
  aiProtocol: Record<string, unknown> | null;
}) {
  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const forecastData = (
    (aiProtocol?.riskForecast as number[]) ?? player.riskForecast
  ).map((risk: number, i: number) => ({
    day: dayLabels[i],
    risk,
  }));

  const sevColor = player.multiFactorRiskColor;

  const trendIcon =
    player.acwrTrend === "rising" ? (
      <ArrowUpRight className="h-3 w-3 text-[#ff3355]" />
    ) : player.acwrTrend === "falling" ? (
      <ArrowDownRight className="h-3 w-3 text-[#00ff88]" />
    ) : (
      <Minus className="h-3 w-3 text-white/30" />
    );

  return (
    <div
      className="rounded-xl border transition-all duration-200"
      style={{
        borderColor: `${sevColor}30`,
        background: `linear-gradient(135deg, ${sevColor}08, transparent)`,
      }}
    >
      {/* Header row */}
      <button onClick={onToggle} className="w-full flex items-center gap-3 p-4 text-left">
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
            {riskBadge(player.multiFactorRiskLevel)}
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-[10px] text-white/40">
            <span className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              ACWR {player.currentAcwr?.toFixed(2) ?? "N/A"} {trendIcon}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              Rec {player.currentHrRecovery ?? "N/A"} bpm
            </span>
            <span className="flex items-center gap-1">
              <Gauge className="h-3 w-3" />
              Mon {player.monotony.toFixed(1)}
            </span>
            <span className="flex items-center gap-1">
              <Moon className="h-3 w-3" />
              {player.daysSinceRest}d no rest
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xl font-bold" style={{ color: sevColor }}>
            {player.riskPct}
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
          {/* Contributing factors breakdown */}
          <div>
            <h5 className="text-xs font-semibold text-white/60 mb-3 flex items-center gap-1.5">
              <Brain className="h-3.5 w-3.5 text-[#a855f7]" />
              Risk Factor Breakdown
            </h5>
            <div className="space-y-2">
              {player.contributingFactors
                .sort((a, b) => b.contribution - a.contribution)
                .map((f) => (
                  <div key={f.name} className="flex items-center gap-2">
                    <div className="w-32 shrink-0">
                      <span className="text-[10px] text-white/50">{f.name}</span>
                    </div>
                    <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, f.contribution * 5)}%`,
                          background:
                            f.status === "danger"
                              ? "linear-gradient(90deg, #f59e0b, #ff3355)"
                              : f.status === "caution"
                              ? "linear-gradient(90deg, #00ff88, #f59e0b)"
                              : "#00ff88",
                        }}
                      />
                    </div>
                    <span className="font-mono text-[10px] w-6 text-right" style={{ color: f.status === "danger" ? "#ff3355" : f.status === "caution" ? "#f59e0b" : "#00ff88" }}>
                      {f.contribution}
                    </span>
                    {riskBadge(f.status)}
                  </div>
                ))}
            </div>
          </div>

          {/* Recommendation */}
          <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
            <p className="text-[11px] text-white/50 leading-relaxed">
              {player.overallRecommendation}
            </p>
          </div>

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
              {typeof aiProtocol?.forecastNarrative === "string" && aiProtocol.forecastNarrative.length > 0 && (
                <p className="text-[11px] text-white/40 mt-2 italic leading-relaxed">
                  {aiProtocol.forecastNarrative}
                </p>
              )}
            </div>
          </div>

          {/* Enhanced risk factors grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
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
              <div className="text-[10px] text-white/30 uppercase tracking-wider mb-1">EWMA ACWR</div>
              <div
                className="font-mono text-lg font-bold"
                style={{
                  color:
                    player.ewmaAcwr > 1.5
                      ? "#ff3355"
                      : player.ewmaAcwr > 1.3
                      ? "#f59e0b"
                      : "#00ff88",
                }}
              >
                {player.ewmaAcwr.toFixed(2)}
              </div>
            </div>
            <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] p-3 text-center">
              <div className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Monotony</div>
              <div
                className="font-mono text-lg font-bold"
                style={{ color: player.monotony > 2.0 ? "#ff3355" : player.monotony > 1.5 ? "#f59e0b" : "#00ff88" }}
              >
                {player.monotony.toFixed(1)}
              </div>
            </div>
            <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] p-3 text-center">
              <div className="text-[10px] text-white/30 uppercase tracking-wider mb-1">14d Load</div>
              <div
                className="font-mono text-lg font-bold"
                style={{ color: player.cumulativeRisk === "high" ? "#ff3355" : player.cumulativeRisk === "moderate" ? "#f59e0b" : "#00ff88" }}
              >
                {player.cumulativeLoad14d.toLocaleString()}
              </div>
            </div>
            <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] p-3 text-center">
              <div className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Asymmetry</div>
              <div
                className="font-mono text-lg font-bold"
                style={{ color: player.asymmetryRisk === "high" ? "#ff3355" : player.asymmetryRisk === "moderate" ? "#f59e0b" : "#00ff88" }}
              >
                {player.asymmetryScore}
              </div>
            </div>
            <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] p-3 text-center">
              <div className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Recovery</div>
              <div
                className="font-mono text-lg font-bold"
                style={{
                  color: player.recoveryScore == null
                    ? "white"
                    : player.recoveryScore < 40
                    ? "#ff3355"
                    : player.recoveryScore < 60
                    ? "#f59e0b"
                    : "#00ff88",
                }}
              >
                {player.recoveryScore ?? "N/A"}
              </div>
            </div>
          </div>

          {/* AI Prevention Protocol */}
          {aiProtocol && (
            <div className="space-y-3">
              {(aiProtocol.sessionModifications as string[] | undefined)?.length ? (
                <div className="rounded-lg bg-[#f59e0b]/5 border border-[#f59e0b]/15 p-3">
                  <h6 className="text-[10px] font-bold text-[#f59e0b] uppercase tracking-wider mb-2 flex items-center gap-1">
                    <ShieldAlert className="h-3 w-3" />
                    Session Modifications
                  </h6>
                  <ul className="space-y-1">
                    {(aiProtocol.sessionModifications as string[]).map((mod: string, i: number) => (
                      <li key={i} className="text-xs text-white/60 flex items-start gap-1.5">
                        <XCircle className="h-3 w-3 text-[#f59e0b] shrink-0 mt-0.5" />
                        {mod}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {(aiProtocol.recoveryProtocols as string[] | undefined)?.length ? (
                <div className="rounded-lg bg-[#22d3ee]/5 border border-[#22d3ee]/15 p-3">
                  <h6 className="text-[10px] font-bold text-[#22d3ee] uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    Recovery Protocols
                  </h6>
                  <ul className="space-y-1">
                    {(aiProtocol.recoveryProtocols as string[]).map((rec: string, i: number) => (
                      <li key={i} className="text-xs text-white/60 flex items-start gap-1.5">
                        <CheckCircle2 className="h-3 w-3 text-[#22d3ee] shrink-0 mt-0.5" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {(aiProtocol.returnCriteria as string[] | undefined)?.length ? (
                <div className="rounded-lg bg-[#00ff88]/5 border border-[#00ff88]/15 p-3">
                  <h6 className="text-[10px] font-bold text-[#00ff88] uppercase tracking-wider mb-2 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Return-to-Full-Training Criteria
                  </h6>
                  <ul className="space-y-1">
                    {(aiProtocol.returnCriteria as string[]).map((c: string, i: number) => (
                      <li key={i} className="text-xs text-white/60 flex items-start gap-1.5">
                        <span className="text-[#00ff88] shrink-0">--</span>
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {typeof aiProtocol.aiRecommendation === "string" && aiProtocol.aiRecommendation.length > 0 && (
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
        <p className="text-xs text-white/30">
          No chronic overload patterns detected in the last 30 days.
        </p>
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
              background:
                p.amberPlusCount30d >= 6
                  ? "rgba(255,51,85,0.15)"
                  : "rgba(245,158,11,0.15)",
              color: p.amberPlusCount30d >= 6 ? "#ff3355" : "#f59e0b",
            }}
          >
            #{p.jerseyNumber}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-sm text-white/80 font-medium">{p.name}</span>
            <p className="text-[10px] text-white/40 mt-0.5">
              Amber+ zone{" "}
              <span
                className="font-mono font-bold"
                style={{
                  color: p.amberPlusCount30d >= 6 ? "#ff3355" : "#f59e0b",
                }}
              >
                {p.amberPlusCount30d}x
              </span>{" "}
              in last 30 days
              {p.amberPlusCount30d >= 6 && " -- chronic overload pattern"}
            </p>
          </div>
          <div className="w-20 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(100, (p.amberPlusCount30d / 10) * 100)}%`,
                background:
                  p.amberPlusCount30d >= 6
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
  const [aiProtocols, setAiProtocols] = useState<Record<string, Record<string, unknown>>>({});
  const [aiNarrative, setAiNarrative] = useState<string | null>(null);
  const [aiWeeklyAdvice, setAiWeeklyAdvice] = useState<string | null>(null);
  const [aiHistoricalPattern, setAiHistoricalPattern] = useState<string | null>(null);

  // Stats
  const redCount = players.filter((p) => p.severity === "red").length;
  const amberCount = players.filter((p) => p.severity === "amber").length;
  const greenCount = players.filter((p) => p.severity === "green").length;

  // At-risk players sorted by risk
  const atRiskPlayers = useMemo(
    () =>
      [...players]
        .filter((p) => p.riskPct > 25)
        .sort((a, b) => b.riskPct - a.riskPct),
    [players]
  );

  // Weekly load analysis
  const totalWeekLoad = weeklyLoad.reduce((s, d) => s + d.load, 0);

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
        monotony: p.monotony,
        strain: p.strain,
        cumulativeLoad14d: p.cumulativeLoad14d,
        asymmetryScore: p.asymmetryScore,
        recoveryScore: p.recoveryScore,
        riskLevel: p.multiFactorRiskLevel,
        contributingFactors: p.contributingFactors.map((f) => `${f.name}: ${f.status}`),
      }));

      const res = await fetch("/api/ai/injury-prevention", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          academy_id: academyId,
          playersAtRisk: riskPayload,
        }),
      });

      if (!res.ok) throw new Error("AI prevention analysis failed");
      const data = await res.json();

      setAiNarrative(data.squadNarrative ?? null);
      setAiWeeklyAdvice(data.weeklyLoadAdvice ?? null);
      setAiHistoricalPattern(data.historicalPattern ?? null);

      const protocolMap: Record<string, Record<string, unknown>> = {};
      for (const proto of data.playerProtocols ?? []) {
        const player = atRiskPlayers.find(
          (p) =>
            p.jerseyNumber === proto.jerseyNumber || p.name === proto.name
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
            <div
              className="h-3 w-3 rounded-full bg-[#ff3355]"
              style={{ boxShadow: "0 0 8px rgba(255,51,85,0.5)" }}
            />
            <span className="text-sm font-mono text-white/70">
              <span className="text-[#ff3355] font-bold">{redCount}</span> High Risk
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full bg-[#f59e0b]"
              style={{ boxShadow: "0 0 8px rgba(245,158,11,0.5)" }}
            />
            <span className="text-sm font-mono text-white/70">
              <span className="text-[#f59e0b] font-bold">{amberCount}</span> Moderate
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full bg-[#00ff88]"
              style={{ boxShadow: "0 0 8px rgba(0,255,136,0.5)" }}
            />
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
          content={
            aiNarrative ??
            `Squad Risk: ${redCount} high, ${amberCount} moderate, ${greenCount} safe`
          }
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

      {/* Section 1: Multi-Factor Risk Overview (NEW — top of page) */}
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Shield className="h-4 w-4 text-[#ff3355]" />
          Multi-Factor Risk Overview
          <span className="text-[9px] font-mono text-white/25 ml-2">
            8-factor weighted model
          </span>
        </h3>
        <MultiFactorRiskOverview
          players={players}
          onSelectPlayer={handleSelectPlayer}
        />
      </div>

      {/* Section 2: Training Monotony Panel (NEW) */}
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Scale className="h-4 w-4 text-[#22d3ee]" />
          Training Monotony & Load Periodization
          <span className="text-[9px] font-mono text-white/25 ml-2">
            Foster 1998
          </span>
        </h3>
        <MonotonyPanel players={players} weeklyLoad={weeklyLoad} />
        {aiWeeklyAdvice && (
          <div className="mt-3 rounded-lg bg-[#22d3ee]/5 border border-[#22d3ee]/15 p-3 flex items-start gap-2">
            <Sparkles className="h-3.5 w-3.5 text-[#22d3ee] shrink-0 mt-0.5" />
            <p className="text-xs text-white/50 leading-relaxed">{aiWeeklyAdvice}</p>
          </div>
        )}
      </div>

      {/* Section 3: Cumulative Load Tracker (NEW) */}
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-[#ff6b35]" />
          Cumulative 14-Day Load
          <span className="text-[9px] font-mono text-white/25 ml-2">
            Windt & Gabbett 2017
          </span>
        </h3>
        <CumulativeLoadTracker players={players} />
      </div>

      {/* Section 4: Movement Asymmetry (NEW) */}
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Eye className="h-4 w-4 text-[#a855f7]" />
          Movement Asymmetry
          <span className="text-[9px] font-mono text-white/25 ml-2">
            From CV position data
          </span>
        </h3>
        <AsymmetrySection players={players} />
      </div>

      {/* Section 5: Recovery & Wellness (NEW) */}
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <BedDouble className="h-4 w-4 text-[#00d4ff]" />
          Recovery & Wellness
          <span className="text-[9px] font-mono text-white/25 ml-2">
            Plews et al. 2013 / Saw et al. 2016
          </span>
        </h3>
        <RecoveryWellnessSection players={players} />
      </div>

      {/* Section 6: 7-Day Risk Forecast (Enhanced) (NEW) */}
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-[#ff3355]" />
          7-Day Risk Forecast
          <span className="text-[9px] font-mono text-white/25 ml-2">
            Multi-factor projection
          </span>
        </h3>
        <EnhancedRiskForecast players={players} />
      </div>

      {/* Section 7: Risk Factor Analysis (per player) */}
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-[#f59e0b]" />
          Player Risk Analysis & Prevention Protocols
          <span className="text-[10px] font-mono text-white/30 ml-auto">
            {atRiskPlayers.length} player{atRiskPlayers.length !== 1 ? "s" : ""}{" "}
            flagged
          </span>
        </h3>
        {atRiskPlayers.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="h-8 w-8 text-[#00ff88]/20 mx-auto mb-2" />
            <p className="text-sm text-white/30">
              All players are in the safe zone. No prevention protocols needed.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {atRiskPlayers.map((p) => (
              <PlayerRiskDetail
                key={p.id}
                player={p}
                isExpanded={expandedPlayerId === p.id}
                onToggle={() =>
                  setExpandedPlayerId(
                    expandedPlayerId === p.id ? null : p.id
                  )
                }
                aiProtocol={aiProtocols[p.id] ?? null}
              />
            ))}
          </div>
        )}
      </div>

      {/* Section 8: Historical Injury Patterns */}
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Clock className="h-4 w-4 text-[#a855f7]" />
          Historical Injury Patterns (30 days)
        </h3>
        <HistoricalPatterns players={players} />
        {aiHistoricalPattern && (
          <div className="mt-3 rounded-lg bg-[#a855f7]/5 border border-[#a855f7]/15 p-3 flex items-start gap-2">
            <Sparkles className="h-3.5 w-3.5 text-[#a855f7] shrink-0 mt-0.5" />
            <p className="text-xs text-white/50 leading-relaxed">
              {aiHistoricalPattern}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
