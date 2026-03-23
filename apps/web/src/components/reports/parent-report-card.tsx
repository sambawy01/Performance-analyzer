"use client";

import { useState } from "react";
import { FileText, Loader2, Sparkles, RefreshCw, AlertCircle, Share2, Download, TrendingUp, TrendingDown, Minus, Users, Calendar, Activity } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

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
      '<strong class="text-[#1a1a2e] font-semibold">$1</strong>'
    );

    if (line.trim().startsWith("## ")) {
      return (
        <h3
          key={i}
          className="text-sm font-bold text-[#4f46e5] mt-5 first:mt-0 uppercase tracking-wider border-b border-[#4f46e5]/20 pb-1"
        >
          {line.replace(/^##\s*/, "")}
        </h3>
      );
    }

    if (/^\d+\.\s/.test(line.trim())) {
      return (
        <div key={i} className="flex items-start gap-2 text-sm ml-2">
          <span className="text-[#4f46e5] font-mono text-xs mt-0.5 shrink-0">
            {line.trim().match(/^(\d+)\./)?.[1]}.
          </span>
          <span
            className="text-[#374151] leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formatted.replace(/^\d+\.\s*/, "") }}
          />
        </div>
      );
    }

    if (line.trim().startsWith("- ") || line.trim().startsWith("• ")) {
      return (
        <div key={i} className="flex items-start gap-2 text-sm ml-2">
          <span className="text-[#4f46e5] mt-1 shrink-0">•</span>
          <span
            className="text-[#374151] leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formatted.replace(/^[-•]\s*/, "") }}
          />
        </div>
      );
    }

    return (
      <p
        key={i}
        className="text-sm text-[#374151] leading-relaxed"
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
      ? "text-emerald-600"
      : stats && stats.improvement < 0
      ? "text-amber-600"
      : "text-slate-500";

  return (
    <div className="space-y-6">
      {/* Selector Card */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base text-slate-800">
            <FileText className="h-4 w-4 text-[#4f46e5]" />
            <span>Generate Parent Report</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-500 uppercase tracking-wider">
              Select Player
            </Label>
            <select
              value={selectedPlayerId}
              onChange={(e) => {
                setSelectedPlayerId(e.target.value);
                setReport(null);
                setStats(null);
              }}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#4f46e5]/50 focus:ring-1 focus:ring-[#4f46e5]/20"
            >
              <option value="">Choose a player...</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  #{p.jerseyNumber} {p.name} — {p.position} ({p.ageGroup})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={generateReport}
            disabled={loading || !selectedPlayerId}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] px-4 py-2 text-sm font-medium text-white hover:shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
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
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-red-500" />
          <div>
            <p className="font-medium text-red-600">Failed to generate</p>
            <p className="text-xs mt-0.5 text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="rounded-full bg-[#4f46e5]/10 p-5 animate-pulse">
                  <FileText className="h-8 w-8 text-[#4f46e5]" />
                </div>
                <div
                  className="absolute inset-0 rounded-full border-2 border-[#4f46e5]/30 animate-spin border-t-[#4f46e5]"
                  style={{ animationDuration: "2s" }}
                />
              </div>
              <p className="text-sm text-[#4f46e5] animate-pulse font-medium">
                Writing parent report...
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Card */}
      {report && stats && playerInfo && !loading && (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] px-6 py-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-indigo-200 text-xs uppercase tracking-widest mb-1">
                  Coach M8 — Monthly Development Report
                </p>
                <h2 className="text-2xl font-bold text-white">{playerInfo.name}</h2>
                <p className="text-indigo-200 text-sm mt-0.5">
                  #{playerInfo.jerseyNumber} · {playerInfo.position} · {playerInfo.ageGroup}
                </p>
              </div>
              {/* Player avatar placeholder */}
              <div className="h-14 w-14 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-white text-xl font-bold">
                {playerInfo.name.charAt(0)}
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
            <div className="px-4 py-3 flex items-center gap-3">
              <div className="rounded-lg bg-indigo-50 p-2">
                <Calendar className="h-4 w-4 text-[#4f46e5]" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-800">{stats.sessions}</p>
                <p className="text-xs text-slate-400">Sessions this month</p>
              </div>
            </div>
            <div className="px-4 py-3 flex items-center gap-3">
              <div className="rounded-lg bg-indigo-50 p-2">
                <ImprovementIcon className={`h-4 w-4 ${improvementColor}`} />
              </div>
              <div>
                <p className={`text-lg font-bold ${improvementColor}`}>
                  {stats.improvement > 0 ? "+" : ""}{stats.improvement}%
                </p>
                <p className="text-xs text-slate-400">Fitness improvement</p>
              </div>
            </div>
            <div className="px-4 py-3 flex items-center gap-3">
              <div className="rounded-lg bg-indigo-50 p-2">
                <Activity className="h-4 w-4 text-[#4f46e5]" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-800">{stats.attendance}%</p>
                <p className="text-xs text-slate-400">Attendance rate</p>
              </div>
            </div>
          </div>

          {/* AI Narrative */}
          <div className="p-6">
            <div className="space-y-1.5">{formatMarkdown(report)}</div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 pb-5 flex items-center gap-3 border-t border-slate-100 pt-4">
            <button
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500 cursor-not-allowed opacity-60"
              disabled
              title="Coming soon"
            >
              <Download className="h-3.5 w-3.5" />
              Download PDF
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500 cursor-not-allowed opacity-60"
              disabled
              title="Coming soon"
            >
              <Share2 className="h-3.5 w-3.5" />
              Share via WhatsApp
            </button>
            <span className="text-xs text-slate-300 ml-auto">
              The Maker Football Incubator · Coach M8
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
