"use client";

import { useState } from "react";
import {
  HeartPulse,
  Loader2,
  Sparkles,
  RefreshCw,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Minus,
} from "lucide-react";
import { ExportShareBar } from "@/components/ui/export-share-bar";

interface PlayerRisk {
  id: string;
  name: string;
  jerseyNumber: number;
  position: string;
  acwr: number | null;
  riskFlag: string;
  avgHr: number;
  hrRecovery: number | null;
  sessionsMissed: number;
  loadTrend: "up" | "down" | "stable";
}

interface MedicalReportProps {
  players: PlayerRisk[];
}

const RISK_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  red: { color: "#ff3355", bg: "bg-[#ff3355]/10", border: "border-[#ff3355]/30", label: "HIGH RISK" },
  amber: { color: "#ff6b35", bg: "bg-[#ff6b35]/10", border: "border-[#ff6b35]/30", label: "CAUTION" },
  green: { color: "#00ff88", bg: "bg-[#00ff88]/10", border: "border-[#00ff88]/30", label: "OPTIMAL" },
  blue: { color: "#00d4ff", bg: "bg-[#00d4ff]/10", border: "border-[#00d4ff]/30", label: "LOW LOAD" },
};

function parseMarkdown(text: string) {
  return text.split("\n").map((line, i) => {
    if (!line.trim()) return <div key={i} className="h-2" />;

    const formatted = line.replace(
      /\*\*(.*?)\*\*/g,
      '<strong class="text-white font-semibold">$1</strong>'
    );

    if (line.trim().startsWith("## ")) {
      return (
        <h3
          key={i}
          className="text-sm font-bold text-[#ff3355] mt-6 first:mt-0 uppercase tracking-wider border-b border-[#ff3355]/20 pb-1.5"
        >
          {line.replace(/^##\s*/, "")}
        </h3>
      );
    }

    if (/^\d+\.\s/.test(line.trim())) {
      return (
        <div key={i} className="flex items-start gap-2 text-sm ml-2">
          <span className="text-[#ff3355] font-mono text-xs mt-0.5 shrink-0">
            {line.trim().match(/^(\d+)\./)?.[1]}.
          </span>
          <span
            className="text-white/70 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formatted.replace(/^\d+\.\s*/, "") }}
          />
        </div>
      );
    }

    if (line.trim().startsWith("- ") || line.trim().startsWith("• ")) {
      return (
        <div key={i} className="flex items-start gap-2 text-sm ml-2">
          <span className="text-[#ff3355] mt-1.5 shrink-0 text-xs">▸</span>
          <span
            className="text-white/70 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formatted.replace(/^[-•]\s*/, "") }}
          />
        </div>
      );
    }

    return (
      <p
        key={i}
        className="text-sm text-white/70 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: formatted }}
      />
    );
  });
}

export function MedicalReport({ players }: MedicalReportProps) {
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reportTitle = `Medical & Injury Risk Report — ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`;

  const riskCounts = players.reduce<Record<string, number>>((acc, p) => {
    acc[p.riskFlag] = (acc[p.riskFlag] ?? 0) + 1;
    return acc;
  }, {});

  async function generateReport() {
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const highRisk = players.filter((p) => p.riskFlag === "red");
      const amber = players.filter((p) => p.riskFlag === "amber");

      const injuryContext = `MEDICAL & INJURY RISK REPORT REQUEST

Squad Risk Distribution:
- Red (HIGH RISK >1.5 ACWR): ${riskCounts.red ?? 0} players
- Amber (CAUTION 1.3-1.5 ACWR): ${riskCounts.amber ?? 0} players
- Green (OPTIMAL): ${riskCounts.green ?? 0} players
- Blue (LOW LOAD): ${riskCounts.blue ?? 0} players

HIGH RISK PLAYERS (immediate attention required):
${highRisk.length > 0
  ? highRisk.map((p) => `- #${p.jerseyNumber} ${p.name} (${p.position}) | ACWR: ${p.acwr?.toFixed(2) ?? "N/A"} | Avg HR: ${p.avgHr}bpm | Recovery: ${p.hrRecovery ?? "N/A"}bpm/min | Missed sessions: ${p.sessionsMissed}`).join("\n")
  : "None currently flagged as red."}

AMBER PLAYERS (monitor closely):
${amber.length > 0
  ? amber.map((p) => `- #${p.jerseyNumber} ${p.name} (${p.position}) | ACWR: ${p.acwr?.toFixed(2) ?? "N/A"} | Avg HR: ${p.avgHr}bpm | Recovery: ${p.hrRecovery ?? "N/A"}bpm/min | Missed sessions: ${p.sessionsMissed}`).join("\n")
  : "None currently in amber zone."}

ALL PLAYERS SORTED BY RISK:
${players.map((p) => `- #${p.jerseyNumber} ${p.name} | ${p.riskFlag.toUpperCase()} | ACWR: ${p.acwr?.toFixed(2) ?? "N/A"} | Load trend: ${p.loadTrend}`).join("\n")}

Generate a professional medical/injury risk report with these sections (## headers):

## Risk Overview
Summarize the overall squad health status. Highlight the key risk areas and overall trends.

## High Risk Players
For each red-flagged player, provide: current status, ACWR analysis, recommended action (rest days, reduced intensity, full stop).

## Recovery Protocols
Specific recovery recommendations for at-risk players — active recovery, nutrition, sleep, HR zone restrictions.

## Load Modification Plan
Concrete training modifications for the next 7-14 days to bring at-risk players back to optimal ACWR.

## Return-to-Play Notes
Guidelines for any players who have missed sessions — how to reintegrate safely.

Be clinical and specific. Reference exact ACWR values and player names. Give precise recommendations.`;

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: injuryContext }],
          context: "Medical and Injury Risk Report page",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate report");
      setReport(data.reply);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Risk Summary Cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Red", flag: "red" },
          { label: "Amber", flag: "amber" },
          { label: "Green", flag: "green" },
          { label: "Blue", flag: "blue" },
        ].map(({ label, flag }) => {
          const cfg = RISK_CONFIG[flag];
          return (
            <div key={flag} className={`rounded-xl border ${cfg.border} ${cfg.bg} p-4 text-center`}>
              <p className="text-2xl font-bold font-mono" style={{ color: cfg.color }}>
                {riskCounts[flag] ?? 0}
              </p>
              <p className="text-xs text-white/50 mt-1">{label}</p>
              <p className="text-[10px] text-white/25 mt-0.5">{cfg.label}</p>
            </div>
          );
        })}
      </div>

      {/* Player Risk Table */}
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl overflow-hidden">
        <div className="border-b border-white/[0.06] px-5 py-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
            <HeartPulse className="h-4 w-4 text-[#ff3355]" />
            Squad Risk Triage
          </h3>
          <span className="text-xs text-white/30 font-mono">{players.length} players</span>
        </div>

        {players.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-white/30">No player data available</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {/* Header Row */}
            <div className="grid grid-cols-[2rem_1fr_6rem_5rem_5rem_5rem_4rem_4rem] gap-3 px-5 py-2 text-[10px] text-white/25 uppercase tracking-wider">
              <span>#</span>
              <span>Player</span>
              <span>Risk</span>
              <span>ACWR</span>
              <span>Avg HR</span>
              <span>Recovery</span>
              <span>Missed</span>
              <span>Load</span>
            </div>

            {players.map((player) => {
              const cfg = RISK_CONFIG[player.riskFlag] ?? RISK_CONFIG.green;
              const TrendIcon =
                player.loadTrend === "up"
                  ? TrendingUp
                  : player.loadTrend === "down"
                  ? TrendingDown
                  : Minus;
              const trendColor =
                player.loadTrend === "up"
                  ? "#ff3355"
                  : player.loadTrend === "down"
                  ? "#00ff88"
                  : "#ffffff40";

              return (
                <div
                  key={player.id}
                  className="grid grid-cols-[2rem_1fr_6rem_5rem_5rem_5rem_4rem_4rem] gap-3 items-center px-5 py-3 hover:bg-white/[0.02] transition-colors"
                >
                  <span className="text-xs font-mono text-white/40">#{player.jerseyNumber}</span>
                  <div>
                    <p className="text-sm font-medium text-white">{player.name}</p>
                    <p className="text-xs text-white/30">{player.position}</p>
                  </div>
                  <div>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${cfg.bg} border ${cfg.border}`}
                      style={{ color: cfg.color }}
                    >
                      {cfg.label}
                    </span>
                  </div>
                  <span className="text-sm font-mono font-bold" style={{ color: cfg.color }}>
                    {player.acwr?.toFixed(2) ?? "—"}
                  </span>
                  <span className="text-sm font-mono text-[#ff6b35]">
                    {player.avgHr > 0 ? `${player.avgHr}bpm` : "—"}
                  </span>
                  <span className="text-sm font-mono text-white/60">
                    {player.hrRecovery != null ? `${player.hrRecovery}` : "—"}
                  </span>
                  <span className="text-sm font-mono text-white/50">
                    {player.sessionsMissed}
                  </span>
                  <TrendIcon className="h-4 w-4" style={{ color: trendColor }} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Generate Button */}
      <div className="flex justify-start">
        <button
          onClick={generateReport}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff3355] to-[#ff6b35] px-5 py-2.5 text-sm font-semibold text-white hover:shadow-[0_0_25px_rgba(255,51,85,0.35)] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin" />Generating Report...</>
          ) : report ? (
            <><RefreshCw className="h-4 w-4" />Regenerate Report</>
          ) : (
            <><Sparkles className="h-4 w-4" />Generate Medical Report</>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 p-4 rounded-xl border border-[#ff3355]/30 bg-[#ff3355]/10 text-sm">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-[#ff3355]" />
          <div>
            <p className="font-medium text-[#ff3355]">Failed to generate</p>
            <p className="text-xs mt-0.5 text-white/40">{error}</p>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-10 flex flex-col items-center gap-4">
          <div className="relative">
            <div className="rounded-full bg-[#ff3355]/10 p-5 animate-pulse">
              <HeartPulse className="h-8 w-8 text-[#ff3355]" />
            </div>
            <div
              className="absolute inset-0 rounded-full border-2 border-[#ff3355]/20 animate-spin border-t-[#ff3355]"
              style={{ animationDuration: "2s" }}
            />
          </div>
          <p className="text-sm text-[#ff3355] animate-pulse font-medium">
            Analyzing injury risk data...
          </p>
        </div>
      )}

      {/* AI Report */}
      {report && !loading && (
        <div className="rounded-2xl border border-[#ff3355]/20 bg-[#ff3355]/[0.03] backdrop-blur-xl overflow-hidden">
          <div className="border-b border-[#ff3355]/10 px-6 py-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#ff3355]" />
                {reportTitle}
              </h3>
              <p className="text-xs text-white/40 mt-0.5">AI-generated medical & injury analysis</p>
            </div>
            <ExportShareBar title={reportTitle} content={report} />
          </div>
          <div className="p-6 space-y-1.5">{parseMarkdown(report)}</div>
          <div className="border-t border-white/[0.05] px-6 py-3 flex justify-between items-center">
            <span className="text-xs text-white/20">Coach M8 AI · The Maker Football Incubator</span>
            <ExportShareBar title={reportTitle} content={report} />
          </div>
        </div>
      )}
    </div>
  );
}
