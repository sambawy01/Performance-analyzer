"use client";

import { useState } from "react";
import {
  CalendarDays,
  Loader2,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Activity,
  Heart,
  Users,
  TrendingUp,
} from "lucide-react";
import { ExportShareBar } from "@/components/ui/export-share-bar";

interface DaySession {
  date: string;
  type: string;
  durationMinutes: number;
  playerCount: number;
  avgHr: number;
  avgTrimp: number;
  location: string;
}

interface WeeklyReportProps {
  daySessions: DaySession[];
  weekStats: {
    totalSessions: number;
    avgLoad: number;
    playersTracked: number;
    playersAtRisk: number;
  };
  academyId: string;
}

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
          className="text-sm font-bold text-[#00ff88] mt-6 first:mt-0 uppercase tracking-wider border-b border-[#00ff88]/20 pb-1.5"
        >
          {line.replace(/^##\s*/, "")}
        </h3>
      );
    }

    if (/^\d+\.\s/.test(line.trim())) {
      return (
        <div key={i} className="flex items-start gap-2 text-sm ml-2">
          <span className="text-[#00ff88] font-mono text-xs mt-0.5 shrink-0">
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
          <span className="text-[#00ff88] mt-1.5 shrink-0 text-xs">▸</span>
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

const DAY_COLORS: Record<string, string> = {
  training: "#00d4ff",
  match: "#ff3355",
  friendly: "#ff6b35",
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

export function WeeklyReport({ daySessions, weekStats, academyId }: WeeklyReportProps) {
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reportTitle = `Weekly Training Summary — ${
    daySessions.length > 0
      ? `${formatDate(daySessions[0].date)} – ${formatDate(daySessions[daySessions.length - 1].date)}`
      : "Last 7 Days"
  }`;

  async function generateSummary() {
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const weekContext = `WEEKLY TRAINING SUMMARY REQUEST

Week Overview:
- Total Sessions: ${weekStats.totalSessions}
- Average Load (TRIMP): ${weekStats.avgLoad}
- Players Tracked: ${weekStats.playersTracked}
- Players At Risk: ${weekStats.playersAtRisk}

Daily Breakdown:
${daySessions.map((s) => `- ${formatDate(s.date)}: ${s.type} session | ${s.durationMinutes}min | ${s.playerCount} players | Avg HR: ${s.avgHr}bpm | Avg TRIMP: ${s.avgTrimp} | Location: ${s.location}`).join("\n")}

Generate a weekly training summary with these sections (## headers):

## Week Review
2-3 sentences summarizing the training week — volume, intensity, and key themes.

## Load Distribution
Analysis of how load was distributed across the week. Comment on periodization and recovery balance.

## Player Highlights
Notable individual performances or concerns from the week's data.

## Next Week Recommendations
4-5 specific recommendations for next week's training load, session types, and player management.

Be direct and data-driven. Reference specific days and metrics.`;

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: weekContext }],
          context: "Weekly Training Summary Report page",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate summary");
      setReport(data.reply);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Week Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Sessions", value: weekStats.totalSessions, icon: CalendarDays, color: "#00ff88" },
          { label: "Avg Load", value: weekStats.avgLoad, icon: Activity, color: "#00d4ff" },
          { label: "Players Tracked", value: weekStats.playersTracked, icon: Users, color: "#a855f7" },
          { label: "At Risk", value: weekStats.playersAtRisk, icon: Heart, color: "#ff3355" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 space-y-2">
            <div className="flex items-center gap-2">
              <s.icon className="h-3.5 w-3.5" style={{ color: s.color }} />
              <span className="text-xs text-white/40 uppercase tracking-wider">{s.label}</span>
            </div>
            <p className="text-2xl font-bold font-mono" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Daily Sessions */}
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl overflow-hidden">
        <div className="border-b border-white/[0.06] px-5 py-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-[#00ff88]" />
            Daily Breakdown — Last 7 Days
          </h3>
          <span className="text-xs text-white/30 font-mono">{daySessions.length} sessions</span>
        </div>

        {daySessions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-white/30">No sessions recorded in the last 7 days</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {daySessions.map((session, i) => {
              const typeColor = DAY_COLORS[session.type] ?? "#00d4ff";
              return (
                <div key={i} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                  <div className="w-28 shrink-0">
                    <p className="text-xs font-medium text-white/80">{formatDate(session.date)}</p>
                  </div>
                  <div
                    className="px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider shrink-0"
                    style={{ color: typeColor, background: `${typeColor}15`, border: `1px solid ${typeColor}30` }}
                  >
                    {session.type}
                  </div>
                  <div className="flex-1 grid grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-white/30">Duration</span>
                      <p className="font-mono text-white/70">{session.durationMinutes}min</p>
                    </div>
                    <div>
                      <span className="text-white/30">Players</span>
                      <p className="font-mono text-white/70">{session.playerCount}</p>
                    </div>
                    <div>
                      <span className="text-white/30">Avg HR</span>
                      <p className="font-mono text-[#ff6b35]">{session.avgHr > 0 ? `${session.avgHr}bpm` : "—"}</p>
                    </div>
                    <div>
                      <span className="text-white/30">TRIMP</span>
                      <p className="font-mono text-[#00ff88]">{session.avgTrimp > 0 ? session.avgTrimp : "—"}</p>
                    </div>
                  </div>
                  <span className="text-xs text-white/25 shrink-0">{session.location}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Generate Button */}
      <div className="flex justify-start">
        <button
          onClick={generateSummary}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#00ff88] to-[#00d4ff] px-5 py-2.5 text-sm font-semibold text-[#0a0e1a] hover:shadow-[0_0_25px_rgba(0,255,136,0.35)] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin" />Generating AI Summary...</>
          ) : report ? (
            <><RefreshCw className="h-4 w-4" />Regenerate Summary</>
          ) : (
            <><Sparkles className="h-4 w-4" />Generate AI Summary</>
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
            <div className="rounded-full bg-[#00ff88]/10 p-5 animate-pulse">
              <TrendingUp className="h-8 w-8 text-[#00ff88]" />
            </div>
            <div
              className="absolute inset-0 rounded-full border-2 border-[#00ff88]/20 animate-spin border-t-[#00ff88]"
              style={{ animationDuration: "2s" }}
            />
          </div>
          <p className="text-sm text-[#00ff88] animate-pulse font-medium">Analyzing weekly training data...</p>
        </div>
      )}

      {/* AI Report */}
      {report && !loading && (
        <div className="rounded-2xl border border-[#00ff88]/20 bg-[#00ff88]/[0.03] backdrop-blur-xl overflow-hidden">
          <div className="border-b border-[#00ff88]/10 px-6 py-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#00ff88]" />
                {reportTitle}
              </h3>
              <p className="text-xs text-white/40 mt-0.5">AI-generated weekly analysis</p>
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
