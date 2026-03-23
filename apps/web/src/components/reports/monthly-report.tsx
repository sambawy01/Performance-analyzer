"use client";

import { useState } from "react";
import {
  BarChart3,
  Loader2,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Activity,
  Heart,
  Ruler,
  Shield,
  Trophy,
} from "lucide-react";
import { ExportShareBar } from "@/components/ui/export-share-bar";

interface TopPerformer {
  name: string;
  jerseyNumber: number;
  position: string;
  avgTrimp: number;
  sessions: number;
}

interface MonthlyStats {
  sessionCount: number;
  sessionTypeBreakdown: Record<string, number>;
  avgTrimp: number;
  avgHr: number;
  avgDistance: number;
  riskCounts: { red: number; amber: number; green: number; blue: number };
  topPerformers: TopPerformer[];
  playersAtRisk: number;
}

interface MonthlyReportProps {
  academyId: string;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

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
          className="text-sm font-bold text-[#00d4ff] mt-6 first:mt-0 uppercase tracking-wider border-b border-[#00d4ff]/20 pb-1.5"
        >
          {line.replace(/^##\s*/, "")}
        </h3>
      );
    }

    if (/^\d+\.\s/.test(line.trim())) {
      return (
        <div key={i} className="flex items-start gap-2 text-sm ml-2">
          <span className="text-[#00d4ff] font-mono text-xs mt-0.5 shrink-0">
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
          <span className="text-[#00d4ff] mt-1.5 shrink-0 text-xs">▸</span>
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

export function MonthlyReport({ academyId }: MonthlyReportProps) {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [report, setReport] = useState<string | null>(null);
  const [stats, setStats] = useState<MonthlyStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateReport() {
    setLoading(true);
    setError(null);
    setReport(null);
    setStats(null);
    try {
      const res = await fetch("/api/ai/monthly-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ academyId, month: selectedMonth, year: selectedYear }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate report");
      setReport(data.report);
      setStats(data.stats);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const monthName = MONTHS[selectedMonth - 1];
  const reportTitle = `Monthly Team Report — ${monthName} ${selectedYear}`;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-5">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          <div className="flex gap-3 flex-1">
            <div className="space-y-1.5">
              <label className="text-xs text-white/40 uppercase tracking-wider">Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => { setSelectedMonth(Number(e.target.value)); setReport(null); }}
                className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00d4ff]/40 focus:ring-1 focus:ring-[#00d4ff]/20 transition-colors"
              >
                {MONTHS.map((m, i) => (
                  <option key={m} value={i + 1} className="bg-[#0a0e1a]">{m}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-white/40 uppercase tracking-wider">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => { setSelectedYear(Number(e.target.value)); setReport(null); }}
                className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00d4ff]/40 focus:ring-1 focus:ring-[#00d4ff]/20 transition-colors"
              >
                {[2024, 2025, 2026].map((y) => (
                  <option key={y} value={y} className="bg-[#0a0e1a]">{y}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={generateReport}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#00d4ff] to-[#a855f7] px-5 py-2.5 text-sm font-semibold text-[#0a0e1a] hover:shadow-[0_0_25px_rgba(0,212,255,0.35)] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" />Generating...</>
            ) : report ? (
              <><RefreshCw className="h-4 w-4" />Regenerate</>
            ) : (
              <><Sparkles className="h-4 w-4" />Generate Full Report</>
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
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-12 flex flex-col items-center gap-4">
          <div className="relative">
            <div className="rounded-full bg-[#00d4ff]/10 p-5 animate-pulse">
              <BarChart3 className="h-8 w-8 text-[#00d4ff]" />
            </div>
            <div
              className="absolute inset-0 rounded-full border-2 border-[#00d4ff]/20 animate-spin border-t-[#00d4ff]"
              style={{ animationDuration: "2s" }}
            />
          </div>
          <p className="text-sm text-[#00d4ff] animate-pulse font-medium">
            Analyzing {monthName} performance data...
          </p>
        </div>
      )}

      {/* Stats Overview (shown before report generation too) */}
      {stats && !loading && (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: "Sessions", value: stats.sessionCount, icon: BarChart3, color: "#00d4ff" },
              { label: "Avg TRIMP", value: stats.avgTrimp, icon: Activity, color: "#00ff88" },
              { label: "Avg HR", value: `${stats.avgHr} bpm`, icon: Heart, color: "#ff6b35" },
              { label: "Avg Distance", value: `${(stats.avgDistance / 1000).toFixed(1)}km`, icon: Ruler, color: "#a855f7" },
              { label: "At Risk", value: stats.playersAtRisk, icon: Shield, color: "#ff3355" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <stat.icon className="h-3.5 w-3.5" style={{ color: stat.color }} />
                  <span className="text-xs text-white/40 uppercase tracking-wider">{stat.label}</span>
                </div>
                <p className="text-xl font-bold font-mono" style={{ color: stat.color }}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {/* Top Performers */}
          {stats.topPerformers.length > 0 && (
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-5">
              <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2 mb-4">
                <Trophy className="h-4 w-4 text-[#ff6b35]" />
                Top Performers — {monthName}
              </h3>
              <div className="space-y-2">
                {stats.topPerformers.map((p, i) => (
                  <div
                    key={p.name}
                    className="flex items-center gap-3 rounded-lg border border-white/[0.05] bg-white/[0.02] px-4 py-2.5"
                  >
                    <span className="text-xs font-bold font-mono text-white/30 w-4">{i + 1}</span>
                    <span className="text-xs font-mono text-[#00d4ff] w-6">#{p.jerseyNumber}</span>
                    <span className="text-sm font-medium text-white flex-1">{p.name}</span>
                    <span className="text-xs text-white/40">{p.position}</span>
                    <span className="text-sm font-bold font-mono text-[#00ff88]">{p.avgTrimp}</span>
                    <span className="text-xs text-white/30">TRIMP avg</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risk Overview */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-5">
            <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2 mb-4">
              <Shield className="h-4 w-4 text-[#ff3355]" />
              Squad Risk Distribution
            </h3>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Red", count: stats.riskCounts.red, color: "#ff3355", bg: "bg-[#ff3355]/10 border-[#ff3355]/20" },
                { label: "Amber", count: stats.riskCounts.amber, color: "#ff6b35", bg: "bg-[#ff6b35]/10 border-[#ff6b35]/20" },
                { label: "Green", count: stats.riskCounts.green, color: "#00ff88", bg: "bg-[#00ff88]/10 border-[#00ff88]/20" },
                { label: "Blue", count: stats.riskCounts.blue, color: "#00d4ff", bg: "bg-[#00d4ff]/10 border-[#00d4ff]/20" },
              ].map((r) => (
                <div key={r.label} className={`rounded-xl border p-3 text-center ${r.bg}`}>
                  <p className="text-2xl font-bold font-mono" style={{ color: r.color }}>{r.count}</p>
                  <p className="text-xs text-white/50 mt-1">{r.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* AI Report */}
          {report && (
            <div className="rounded-2xl border border-[#00d4ff]/20 bg-[#00d4ff]/[0.03] backdrop-blur-xl overflow-hidden">
              <div className="border-b border-[#00d4ff]/10 px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#00d4ff]" />
                    {reportTitle}
                  </h3>
                  <p className="text-xs text-white/40 mt-0.5">AI-generated performance analysis</p>
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
        </>
      )}
    </div>
  );
}
