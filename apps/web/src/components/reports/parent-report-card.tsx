"use client";

import { useState } from "react";
import {
  FileText,
  Loader2,
  Sparkles,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Activity,
} from "lucide-react";
import { ExportShareBar } from "@/components/ui/export-share-bar";

interface PlayerOption {
  id: string;
  name: string;
  position: string;
  jerseyNumber: number;
  ageGroup: string;
}

interface ReportStats {
  sessions: number;
  improvement: number;
  attendance: number;
}

interface ReportPlayer {
  name: string;
  position: string;
  ageGroup: string;
  jerseyNumber: number;
}

interface ParentReportCardProps {
  players: PlayerOption[];
}

function formatMarkdown(text: string) {
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
          className="text-sm font-bold text-[#a855f7] mt-5 first:mt-0 uppercase tracking-wider border-b border-[#a855f7]/20 pb-1"
        >
          {line.replace(/^##\s*/, "")}
        </h3>
      );
    }

    if (/^\d+\.\s/.test(line.trim())) {
      return (
        <div key={i} className="flex items-start gap-2 text-sm ml-2">
          <span className="text-[#a855f7] font-mono text-xs mt-0.5 shrink-0">
            {line.trim().match(/^(\d+)\./)?.[1]}.
          </span>
          <span
            className="text-white/50 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formatted.replace(/^\d+\.\s*/, "") }}
          />
        </div>
      );
    }

    if (line.trim().startsWith("- ") || line.trim().startsWith("• ")) {
      return (
        <div key={i} className="flex items-start gap-2 text-sm ml-2">
          <span className="text-[#a855f7] mt-1.5 shrink-0 text-xs">▸</span>
          <span
            className="text-white/50 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formatted.replace(/^[-•]\s*/, "") }}
          />
        </div>
      );
    }

    return (
      <p
        key={i}
        className="text-sm text-white/50 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: formatted }}
      />
    );
  });
}

export function ParentReportCard({ players }: ParentReportCardProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [report, setReport] = useState<string | null>(null);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [playerInfo, setPlayerInfo] = useState<ReportPlayer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateReport() {
    if (!selectedPlayerId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/parent-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: selectedPlayerId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate");
      setReport(data.report);
      setStats(data.stats);
      setPlayerInfo(data.player);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const ImprovementIcon =
    stats && stats.improvement > 0
      ? TrendingUp
      : stats && stats.improvement < 0
      ? TrendingDown
      : Minus;
  const improvementColor =
    stats && stats.improvement > 0
      ? "#00ff88"
      : stats && stats.improvement < 0
      ? "#ff6b35"
      : "#ffffff40";

  const reportTitle = playerInfo
    ? `Coach M8 Parent Report — ${playerInfo.name}`
    : "Coach M8 Parent Report";

  return (
    <div className="space-y-6">
      {/* Selector Card */}
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-5">
        <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2 mb-4">
          <FileText className="h-4 w-4 text-[#a855f7]" />
          Generate Parent Report
        </h3>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-white/40 uppercase tracking-wider">
              Select Player
            </label>
            <select
              value={selectedPlayerId}
              onChange={(e) => {
                setSelectedPlayerId(e.target.value);
                setReport(null);
                setStats(null);
              }}
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white focus:outline-none focus:border-[#a855f7]/40 focus:ring-1 focus:ring-[#a855f7]/20 transition-colors"
            >
              <option value="" className="bg-[#0a0e1a]">Choose a player...</option>
              {players.map((p) => (
                <option key={p.id} value={p.id} className="bg-[#0a0e1a]">
                  #{p.jerseyNumber} {p.name} — {p.position} ({p.ageGroup})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={generateReport}
            disabled={loading || !selectedPlayerId}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#a855f7] to-[#00d4ff] px-5 py-2.5 text-sm font-semibold text-white hover:shadow-[0_0_25px_rgba(168,85,247,0.35)] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating Report...
              </>
            ) : report ? (
              <>
                <RefreshCw className="h-4 w-4" />
                Regenerate Report
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate Parent Report
              </>
            )}
          </button>
        </div>
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
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-12 flex flex-col items-center gap-4">
          <div className="relative">
            <div className="rounded-full bg-[#a855f7]/10 p-5 animate-pulse">
              <FileText className="h-8 w-8 text-[#a855f7]" />
            </div>
            <div
              className="absolute inset-0 rounded-full border-2 border-[#a855f7]/20 animate-spin border-t-[#a855f7]"
              style={{ animationDuration: "2s" }}
            />
          </div>
          <p className="text-sm text-[#a855f7] animate-pulse font-medium">
            Writing parent report...
          </p>
        </div>
      )}

      {/* Report Card */}
      {report && stats && playerInfo && !loading && (
        <div className="rounded-2xl border border-[#a855f7]/20 bg-[#a855f7]/[0.03] backdrop-blur-xl overflow-hidden">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-[#a855f7]/30 to-[#00d4ff]/20 border-b border-[#a855f7]/20 px-6 py-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[#a855f7] text-xs uppercase tracking-widest mb-1">
                  Coach M8 — Monthly Development Report
                </p>
                <h2 className="text-2xl font-bold text-white">{playerInfo.name}</h2>
                <p className="text-white/50 text-sm mt-0.5">
                  #{playerInfo.jerseyNumber} · {playerInfo.position} · {playerInfo.ageGroup}
                </p>
              </div>
              <div className="h-14 w-14 rounded-full bg-[#a855f7]/20 border-2 border-[#a855f7]/40 flex items-center justify-center text-[#a855f7] text-xl font-bold">
                {playerInfo.name.charAt(0)}
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 divide-x divide-white/[0.06] border-b border-white/[0.06]">
            <div className="px-4 py-4 flex items-center gap-3">
              <div className="rounded-lg bg-[#a855f7]/10 p-2">
                <Calendar className="h-4 w-4 text-[#a855f7]" />
              </div>
              <div>
                <p className="text-lg font-bold font-mono text-white">{stats.sessions}</p>
                <p className="text-xs text-white/40">Sessions this month</p>
              </div>
            </div>
            <div className="px-4 py-4 flex items-center gap-3">
              <div className="rounded-lg bg-[#00ff88]/10 p-2">
                <ImprovementIcon className="h-4 w-4" style={{ color: improvementColor }} />
              </div>
              <div>
                <p className="text-lg font-bold font-mono" style={{ color: improvementColor }}>
                  {stats.improvement > 0 ? "+" : ""}{stats.improvement}%
                </p>
                <p className="text-xs text-white/40">Fitness improvement</p>
              </div>
            </div>
            <div className="px-4 py-4 flex items-center gap-3">
              <div className="rounded-lg bg-[#00d4ff]/10 p-2">
                <Activity className="h-4 w-4 text-[#00d4ff]" />
              </div>
              <div>
                <p className="text-lg font-bold font-mono text-[#00d4ff]">{stats.attendance}%</p>
                <p className="text-xs text-white/40">Attendance rate</p>
              </div>
            </div>
          </div>

          {/* AI Narrative */}
          <div className="p-6 space-y-1.5">{formatMarkdown(report)}</div>

          {/* Footer Actions */}
          <div className="px-6 pb-5 flex items-center gap-3 border-t border-white/[0.05] pt-4">
            <ExportShareBar title={reportTitle} content={report} />
            <span className="text-xs text-white/20 ml-auto">
              The Maker Football Incubator · Coach M8
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
