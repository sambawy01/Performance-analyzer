"use client";

import { useState } from "react";
import {
  Sparkles,
  Clock,
  AlertTriangle,
  Target,
  Activity,
  Loader2,
  Dumbbell,
  Moon,
  Brain,
  Send,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Calendar,
  Shield,
  Zap,
} from "lucide-react";
import type { Session } from "@/types";

interface DailyBriefingProps {
  todaySession: Session | null;
  playersAtRisk: Array<{
    jerseyNumber: number;
    name: string;
    acwr: number;
    riskFlag: string;
  }>;
  teamReadiness: number | null;
}

export function DailyBriefing({
  todaySession,
  playersAtRisk,
  teamReadiness,
}: DailyBriefingProps) {
  const [askOpen, setAskOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const redPlayers = playersAtRisk.filter((p) => p.riskFlag === "red");
  const amberPlayers = playersAtRisk.filter((p) => p.riskFlag === "amber");

  const readinessColor =
    teamReadiness !== null
      ? teamReadiness >= 80
        ? "#00ff88"
        : teamReadiness >= 60
          ? "#ff6b35"
          : "#ff3355"
      : "#94a3b8";

  const readinessLabel =
    teamReadiness !== null
      ? teamReadiness >= 80
        ? "High — ready for intensity"
        : teamReadiness >= 60
          ? "Moderate — control the intensity"
          : "Low — consider lighter session"
      : "Calculating...";

  async function askAI() {
    if (!question.trim() || aiLoading) return;
    setAiLoading(true);
    setAiAnswer(null);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: question }],
          context: `Daily briefing context: Today's date is ${new Date().toLocaleDateString()}. ${todaySession ? `Today's session: ${todaySession.type} at ${todaySession.location}, ${todaySession.duration_minutes} min.` : "No session today."} ${redPlayers.length} players in red zone, ${amberPlayers.length} in amber. Team readiness: ${teamReadiness}/100.`,
        }),
      });
      const data = await res.json();
      setAiAnswer(data.reply);
    } catch {
      setAiAnswer("Failed to get response. Check your connection.");
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div className="rounded-xl overflow-hidden border border-[#a855f7]/20" style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.08) 0%, rgba(0,212,255,0.04) 50%, rgba(0,255,136,0.04) 100%)" }}>
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#a855f7] to-[#00d4ff] flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.3)]">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Coach M8 AI — Daily Briefing</h3>
            <p className="text-xs text-white/50">
              {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>
        <button
          onClick={() => setAskOpen(!askOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-[#a855f7] to-[#00d4ff] text-white text-sm font-medium hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all"
        >
          <MessageSquare className="h-4 w-4" />
          Ask Coach M8
        </button>
      </div>

      {/* Body */}
      <div className="p-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Today's Session */}
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-[#00d4ff]/10 shrink-0">
              {todaySession ? (
                <Dumbbell className="h-5 w-5 text-[#00d4ff]" />
              ) : (
                <Moon className="h-5 w-5 text-white/40" />
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1">
                Today
              </p>
              {todaySession ? (
                <>
                  <p className="text-base font-semibold text-white capitalize">
                    {todaySession.type} Session
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-sm text-white/60">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {todaySession.duration_minutes} min
                    </span>
                    <span>{todaySession.location}</span>
                  </div>
                  {todaySession.notes && (
                    <p className="text-sm text-white/50 mt-1 italic">{todaySession.notes}</p>
                  )}
                </>
              ) : (
                <>
                  <p className="text-base font-semibold text-white/60">Rest Day</p>
                  <p className="text-sm text-white/40 mt-1">No session scheduled — recovery opportunity</p>
                </>
              )}
            </div>
          </div>

          {/* Team Readiness */}
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-white/[0.04] shrink-0">
              <Activity className="h-5 w-5" style={{ color: readinessColor }} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1">
                Team Readiness
              </p>
              <div className="flex items-center gap-3">
                <span className="font-mono text-2xl font-bold" style={{ color: readinessColor }}>
                  {teamReadiness ?? "—"}
                </span>
                <span className="text-sm text-white/60">/100</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden mt-2">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${teamReadiness ?? 0}%`,
                    backgroundColor: readinessColor,
                    boxShadow: `0 0 10px ${readinessColor}60`,
                  }}
                />
              </div>
              <p className="text-xs text-white/50 mt-1">{readinessLabel}</p>
            </div>
          </div>

          {/* Players at Risk */}
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-[#ff3355]/10 shrink-0">
              <AlertTriangle className="h-5 w-5 text-[#ff3355]" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1">
                Watch List
              </p>
              {playersAtRisk.length === 0 ? (
                <p className="text-base font-semibold text-[#00ff88]">All clear</p>
              ) : (
                <div className="space-y-1.5">
                  {playersAtRisk.slice(0, 4).map((p) => (
                    <div key={p.jerseyNumber} className="flex items-center justify-between">
                      <span className="text-sm text-white/70">
                        #{p.jerseyNumber} {p.name}
                      </span>
                      <span
                        className="font-mono text-sm font-bold"
                        style={{ color: p.riskFlag === "red" ? "#ff3355" : "#ff6b35" }}
                      >
                        {p.acwr.toFixed(2)}
                      </span>
                    </div>
                  ))}
                  {playersAtRisk.length > 4 && (
                    <p className="text-xs text-white/40">+{playersAtRisk.length - 4} more</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI Quick Tips */}
        <div className="mt-4 pt-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-[#a855f7]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[#a855f7]/70">AI Insights</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {redPlayers.length > 0 && (
              <div className="flex items-start gap-2 text-sm text-white/70 bg-[#ff3355]/5 rounded-lg p-2.5 border border-[#ff3355]/10">
                <Shield className="h-4 w-4 text-[#ff3355] shrink-0 mt-0.5" />
                <span>
                  <strong className="text-[#ff3355]">{redPlayers.length} player{redPlayers.length > 1 ? "s" : ""} in danger zone</strong> — rest {redPlayers.map(p => `#${p.jerseyNumber}`).join(", ")} today or risk injury.
                </span>
              </div>
            )}
            {amberPlayers.length > 0 && (
              <div className="flex items-start gap-2 text-sm text-white/70 bg-[#ff6b35]/5 rounded-lg p-2.5 border border-[#ff6b35]/10">
                <Zap className="h-4 w-4 text-[#ff6b35] shrink-0 mt-0.5" />
                <span>
                  <strong className="text-[#ff6b35]">{amberPlayers.length} approaching threshold</strong> — monitor {amberPlayers.map(p => `#${p.jerseyNumber}`).join(", ")} and reduce intensity if needed.
                </span>
              </div>
            )}
            <div className="flex items-start gap-2 text-sm text-white/70 bg-[#00d4ff]/5 rounded-lg p-2.5 border border-[#00d4ff]/10">
              <Target className="h-4 w-4 text-[#00d4ff] shrink-0 mt-0.5" />
              <span>
                {todaySession
                  ? `${todaySession.type === "match" ? "Match day" : "Training"} intensity should match team readiness (${teamReadiness}/100).`
                  : "Rest day — players should focus on sleep and nutrition for tomorrow's session."}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Ask Coach M8 panel */}
      {askOpen && (
        <div className="px-5 pb-5 border-t border-white/[0.06] pt-4">
          <div className="flex gap-2">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && askAI()}
              placeholder="Ask anything... 'Who should rest today?', 'Design today's session', 'Compare last 2 matches'"
              className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#a855f7]/50 focus:outline-none focus:ring-1 focus:ring-[#a855f7]/20"
              disabled={aiLoading}
            />
            <button
              onClick={askAI}
              disabled={!question.trim() || aiLoading}
              className="shrink-0 h-10 w-10 rounded-lg bg-gradient-to-r from-[#a855f7] to-[#00d4ff] flex items-center justify-center hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all disabled:opacity-30"
            >
              {aiLoading ? <Loader2 className="h-4 w-4 text-white animate-spin" /> : <Send className="h-4 w-4 text-white" />}
            </button>
          </div>

          {/* Quick questions */}
          {!aiAnswer && !aiLoading && (
            <div className="flex flex-wrap gap-2 mt-3">
              {[
                "Who should rest today?",
                "Design today's training session",
                "Squad fitness ranking",
                "Injury risk report",
                "Best formation for next match",
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => { setQuestion(q); setTimeout(askAI, 100); }}
                  className="text-xs px-3 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] text-white/50 hover:text-[#a855f7] hover:border-[#a855f7]/30 transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* AI Response */}
          {aiAnswer && (
            <div className="mt-3 rounded-lg bg-white/[0.03] border border-white/[0.06] p-4">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="h-4 w-4 text-[#a855f7]" />
                <span className="text-xs font-semibold text-[#a855f7]">Coach M8 AI</span>
              </div>
              <div className="space-y-1.5">
                {aiAnswer.split("\n").map((line, i) => {
                  if (!line.trim()) return <div key={i} className="h-1.5" />;
                  if (line.trim().startsWith("- ") || line.trim().startsWith("• ")) {
                    return <p key={i} className="text-sm text-white/80 flex gap-2"><span className="text-[#a855f7]">•</span>{line.replace(/^[-•]\s*/, "")}</p>;
                  }
                  if (line.trim().startsWith("**") || line.match(/^\d+\./)) {
                    return <p key={i} className="text-sm font-semibold text-white mt-2">{line.replace(/\*\*/g, "")}</p>;
                  }
                  return <p key={i} className="text-sm text-white/80 leading-relaxed">{line}</p>;
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
