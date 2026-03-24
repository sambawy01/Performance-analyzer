"use client";

import { useState } from "react";
import {
  Sparkles, Clock, AlertTriangle, Target, Activity, Loader2,
  Dumbbell, Moon, Brain, Send, MessageSquare, Calendar,
  Shield, Zap, TrendingUp, TrendingDown, Minus, Trophy,
  Users, ChevronRight, Star,
} from "lucide-react";
import type { Session } from "@/types";

interface DailyBriefingProps {
  todaySession: Session | null;
  playersAtRisk: Array<{ jerseyNumber: number; name: string; acwr: number; riskFlag: string }>;
  teamReadiness: number | null;
  totalPlayers: number;
  totalSessions: number;
  matchesThisMonth: number;
  nextMatch: { date: string; notes: string | null } | null;
  weekAvgTrimp: number | null;
  loadTrend: number | null;
  upcoming: Array<{ date: string; type: string; notes: string | null }>;
  topPerformer: { name: string; jersey: number; trimp: number } | null;
}

export function DailyBriefing({
  todaySession, playersAtRisk, teamReadiness, totalPlayers, totalSessions,
  matchesThisMonth, nextMatch, weekAvgTrimp, loadTrend, upcoming, topPerformer,
}: DailyBriefingProps) {
  const [askOpen, setAskOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const redPlayers = playersAtRisk.filter((p) => p.riskFlag === "red");
  const amberPlayers = playersAtRisk.filter((p) => p.riskFlag === "amber");

  const readinessColor = teamReadiness !== null
    ? teamReadiness >= 80 ? "#00ff88" : teamReadiness >= 60 ? "#ff6b35" : "#ff3355"
    : "#94a3b8";

  const trendIcon = loadTrend !== null
    ? loadTrend > 5 ? TrendingUp : loadTrend < -5 ? TrendingDown : Minus
    : Minus;
  const trendColor = loadTrend !== null
    ? loadTrend > 10 ? "text-[#ff3355]" : loadTrend > 5 ? "text-[#ff6b35]" : loadTrend < -5 ? "text-[#00d4ff]" : "text-[#00ff88]"
    : "text-white/40";

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
          context: "",
        }),
      });
      const data = await res.json();
      setAiAnswer(data.reply);
    } catch {
      setAiAnswer("Failed to get response.");
    } finally {
      setAiLoading(false);
    }
  }

  const daysUntilMatch = nextMatch ? Math.ceil((new Date(nextMatch.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

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
        <button onClick={() => setAskOpen(!askOpen)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-[#a855f7] to-[#00d4ff] text-white text-sm font-medium hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all">
          <MessageSquare className="h-4 w-4" />
          Ask Coach M8
        </button>
      </div>

      <div className="p-5 space-y-5">
        {/* Row 1: Today + Readiness + Next Match + Load Trend */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Today's Session */}
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-[#00d4ff]/10 shrink-0">
              {todaySession ? <Dumbbell className="h-5 w-5 text-[#00d4ff]" /> : <Moon className="h-5 w-5 text-white/40" />}
            </div>
            <div>
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1">Today</p>
              {todaySession ? (
                <>
                  <p className="text-base font-semibold text-white capitalize">{todaySession.type} Session</p>
                  <div className="flex items-center gap-2 mt-0.5 text-sm text-white/60">
                    <Clock className="h-3 w-3" />
                    <span className="font-mono">{todaySession.duration_minutes} min</span>
                    <span className="text-white/30">|</span>
                    <span>{todaySession.location}</span>
                  </div>
                  {todaySession.notes && <p className="text-xs text-white/40 mt-1 italic line-clamp-2">{todaySession.notes}</p>}
                </>
              ) : (
                <p className="text-base font-semibold text-white/50">Rest Day</p>
              )}
            </div>
          </div>

          {/* Team Readiness */}
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-white/[0.04] shrink-0">
              <Activity className="h-5 w-5" style={{ color: readinessColor }} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1">Team Readiness</p>
              <div className="flex items-baseline gap-1">
                <span className="font-mono text-2xl font-bold" style={{ color: readinessColor }}>{teamReadiness ?? "—"}</span>
                <span className="text-sm text-white/40">/100</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden mt-1">
                <div className="h-full rounded-full" style={{ width: `${teamReadiness ?? 0}%`, backgroundColor: readinessColor, boxShadow: `0 0 8px ${readinessColor}60` }} />
              </div>
            </div>
          </div>

          {/* Next Match Countdown */}
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-[#a855f7]/10 shrink-0">
              <Calendar className="h-5 w-5 text-[#a855f7]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1">Next Match</p>
              {nextMatch ? (
                <>
                  <p className="text-base font-semibold text-white">
                    {daysUntilMatch === 0 ? "Today!" : daysUntilMatch === 1 ? "Tomorrow" : `In ${daysUntilMatch} days`}
                  </p>
                  <p className="text-xs text-white/50 mt-0.5">
                    {new Date(nextMatch.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                  </p>
                  {nextMatch.notes && <p className="text-xs text-white/40 italic mt-0.5 line-clamp-1">{nextMatch.notes}</p>}
                </>
              ) : (
                <p className="text-sm text-white/40">No match scheduled</p>
              )}
            </div>
          </div>

          {/* Weekly Load Trend */}
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-white/[0.04] shrink-0">
              <Zap className="h-5 w-5 text-[#ff6b35]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1">Weekly Load</p>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xl font-bold text-white">{weekAvgTrimp ?? "—"}</span>
                <span className="text-xs text-white/40">avg TRIMP</span>
              </div>
              {loadTrend !== null && (
                <div className={`flex items-center gap-1 mt-0.5 text-xs ${trendColor}`}>
                  {(() => { const Icon = trendIcon; return <Icon className="h-3 w-3" />; })()}
                  <span className="font-mono">{loadTrend > 0 ? "+" : ""}{loadTrend}% vs last week</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Row 2: Quick Stats Bar */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
            <Users className="h-3.5 w-3.5 text-[#00d4ff]" />
            <span className="text-xs text-white/60"><span className="font-mono font-bold text-white">{totalPlayers}</span> players</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
            <Calendar className="h-3.5 w-3.5 text-[#00ff88]" />
            <span className="text-xs text-white/60"><span className="font-mono font-bold text-white">{totalSessions}</span> sessions this month</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
            <Trophy className="h-3.5 w-3.5 text-[#a855f7]" />
            <span className="text-xs text-white/60"><span className="font-mono font-bold text-white">{matchesThisMonth}</span> matches</span>
          </div>
          {topPerformer && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#00ff88]/5 border border-[#00ff88]/10">
              <Star className="h-3.5 w-3.5 text-[#00ff88]" />
              <span className="text-xs text-white/60">Top: <span className="font-bold text-[#00ff88]">#{topPerformer.jersey} {topPerformer.name}</span> (TRIMP {topPerformer.trimp})</span>
            </div>
          )}
        </div>

        {/* Row 3: Watch List + Upcoming + AI Insights — 3 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Watch List */}
          <div className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-[#ff3355]" />
              <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Watch List</span>
            </div>
            {playersAtRisk.length === 0 ? (
              <div className="flex items-center gap-2 py-2">
                <Shield className="h-4 w-4 text-[#00ff88]" />
                <span className="text-sm text-[#00ff88] font-medium">All players in safe zone</span>
              </div>
            ) : (
              <div className="space-y-1.5">
                {playersAtRisk.slice(0, 5).map((p) => (
                  <div key={p.jerseyNumber} className="flex items-center justify-between text-sm">
                    <span className="text-white/70">#{p.jerseyNumber} {p.name}</span>
                    <span className="font-mono text-xs font-bold" style={{ color: p.riskFlag === "red" ? "#ff3355" : "#ff6b35" }}>
                      {p.acwr.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Schedule */}
          <div className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-3">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-[#00d4ff]" />
              <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Next 3 Days</span>
            </div>
            {upcoming.length === 0 ? (
              <p className="text-sm text-white/40">No sessions scheduled</p>
            ) : (
              <div className="space-y-1.5">
                {upcoming.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="text-xs font-mono text-white/40 w-12">
                      {new Date(s.date).toLocaleDateString("en-GB", { weekday: "short" })}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${s.type === "match" ? "bg-[#a855f7]/15 text-[#a855f7]" : "bg-[#00d4ff]/10 text-[#00d4ff]"}`}>
                      {s.type}
                    </span>
                    {s.notes && <span className="text-xs text-white/40 truncate">{s.notes.split(".")[0]}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Insights — contextual coaching intelligence */}
          <div className="rounded-lg bg-[#a855f7]/5 border border-[#a855f7]/10 p-3">
            <div className="flex items-center gap-2 mb-2.5">
              <Sparkles className="h-4 w-4 text-[#a855f7]" />
              <span className="text-xs font-semibold text-[#a855f7]/70 uppercase tracking-wider">AI Insights</span>
            </div>
            <div className="space-y-2.5">
              {/* Priority 1: Injury risk */}
              {redPlayers.length > 0 && (
                <div className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#ff3355] mt-1.5 shrink-0" style={{ boxShadow: "0 0 4px #ff3355" }} />
                  <p className="text-xs text-white/60 leading-relaxed">
                    <span className="text-[#ff3355] font-semibold">High injury risk:</span> {redPlayers.slice(0, 3).map(p => `${p.name} (ACWR ${p.acwr.toFixed(2)})`).join(", ")}
                    {redPlayers.length > 3 && ` +${redPlayers.length - 3} more`}. Recommend full rest or light recovery only.
                  </p>
                </div>
              )}

              {/* Priority 2: Load management */}
              {amberPlayers.length > 0 && (
                <div className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#ff6b35] mt-1.5 shrink-0" style={{ boxShadow: "0 0 4px #ff6b35" }} />
                  <p className="text-xs text-white/60 leading-relaxed">
                    <span className="text-[#ff6b35] font-semibold">{amberPlayers.length} players need load monitoring.</span>
                    {" "}Reduce volume for {amberPlayers.slice(0, 2).map(p => p.name).join(" & ")}
                    {amberPlayers.length > 2 && ` and ${amberPlayers.length - 2} others`}.
                    {todaySession ? " Cap their session at 60 minutes." : ""}
                  </p>
                </div>
              )}

              {/* Priority 3: Match prep context */}
              {daysUntilMatch !== null && daysUntilMatch <= 3 && daysUntilMatch > 0 && (
                <div className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#a855f7] mt-1.5 shrink-0" style={{ boxShadow: "0 0 4px #a855f7" }} />
                  <p className="text-xs text-white/60 leading-relaxed">
                    <span className="text-[#a855f7] font-semibold">Match in {daysUntilMatch}d.</span>
                    {daysUntilMatch === 1
                      ? " Today should be activation only — 30min walk-through, set pieces, team shape. No high intensity."
                      : daysUntilMatch === 2
                        ? " Keep today moderate. Focus on tactical patterns and transition drills. Avoid heavy conditioning."
                        : " Good window for a sharp, match-intensity session. Test your starting XI shape."}
                  </p>
                </div>
              )}

              {/* Priority 4: Load trend analysis */}
              {loadTrend !== null && Math.abs(loadTrend) > 10 && (
                <div className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: loadTrend > 10 ? "#ff6b35" : "#00d4ff", boxShadow: `0 0 4px ${loadTrend > 10 ? "#ff6b35" : "#00d4ff"}` }} />
                  <p className="text-xs text-white/60 leading-relaxed">
                    {loadTrend > 10 ? (
                      <><span className="text-[#ff6b35] font-semibold">Load trending up {loadTrend}%.</span> Squad is accumulating fatigue. If no match this week, schedule a recovery session. If match approaching, taper now.</>
                    ) : (
                      <><span className="text-[#00d4ff] font-semibold">Load down {Math.abs(loadTrend)}%.</span> Good deload phase. Squad should feel fresh. Ideal time to push tactical complexity or high-intensity reps.</>
                    )}
                  </p>
                </div>
              )}

              {/* Priority 5: Session recommendation */}
              {todaySession && (
                <div className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#00d4ff] mt-1.5 shrink-0" style={{ boxShadow: "0 0 4px #00d4ff" }} />
                  <p className="text-xs text-white/60 leading-relaxed">
                    <span className="text-[#00d4ff] font-semibold">Today&apos;s {todaySession.type}:</span>
                    {teamReadiness !== null && teamReadiness < 50
                      ? " Squad readiness is low — consider reducing planned intensity by 20-30% and shortening to 60 min."
                      : teamReadiness !== null && teamReadiness >= 80
                        ? " Squad is fresh and ready. Push the intensity — this is a good day for high-tempo tactical work."
                        : ` ${todaySession.duration_minutes} min at ${todaySession.location}. Monitor HR zones closely for flagged players.`}
                  </p>
                </div>
              )}

              {/* All clear */}
              {playersAtRisk.length === 0 && (!loadTrend || Math.abs(loadTrend) <= 10) && !todaySession && (
                <div className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#00ff88] mt-1.5 shrink-0" style={{ boxShadow: "0 0 4px #00ff88" }} />
                  <p className="text-xs text-white/60 leading-relaxed">
                    <span className="text-[#00ff88] font-semibold">All clear.</span> No load alerts, squad is healthy. Rest day — let the body recover. Good time for video review or individual skill sessions.
                  </p>
                </div>
              )}

              {/* Top performer shoutout */}
              {topPerformer && (
                <div className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#ffbb00] mt-1.5 shrink-0" style={{ boxShadow: "0 0 4px #ffbb00" }} />
                  <p className="text-xs text-white/60 leading-relaxed">
                    <span className="text-[#ffbb00] font-semibold">Star performer:</span> #{topPerformer.jersey} {topPerformer.name} leads with TRIMP {topPerformer.trimp} this week. Consider featuring in social media content.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Ask Coach M8 panel */}
      {askOpen && (
        <div className="px-5 pb-5 border-t border-white/[0.06] pt-4">
          <div className="flex gap-2">
            <input value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => e.key === "Enter" && askAI()}
              placeholder="Ask anything... 'Who should rest?', 'Design today's session', 'Injury risk report'"
              className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#a855f7]/50 focus:outline-none" disabled={aiLoading} />
            <button onClick={askAI} disabled={!question.trim() || aiLoading}
              className="shrink-0 h-10 w-10 rounded-lg bg-gradient-to-r from-[#a855f7] to-[#00d4ff] flex items-center justify-center disabled:opacity-30">
              {aiLoading ? <Loader2 className="h-4 w-4 text-white animate-spin" /> : <Send className="h-4 w-4 text-white" />}
            </button>
          </div>
          {!aiAnswer && !aiLoading && (
            <div className="flex flex-wrap gap-2 mt-3">
              {["Who should rest today?", "Design today's session", "Squad fitness ranking", "Injury risk report", "Best formation for next match"].map((q) => (
                <button key={q} onClick={() => { setQuestion(q); setTimeout(askAI, 50); }}
                  className="text-xs px-3 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] text-white/50 hover:text-[#a855f7] hover:border-[#a855f7]/30 transition-all">
                  {q}
                </button>
              ))}
            </div>
          )}
          {aiAnswer && (
            <div className="mt-3 rounded-lg bg-white/[0.03] border border-white/[0.06] p-4">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="h-4 w-4 text-[#a855f7]" />
                <span className="text-xs font-semibold text-[#a855f7]">Coach M8 AI</span>
              </div>
              {aiAnswer.split("\n").map((line, i) => {
                if (!line.trim()) return <div key={i} className="h-1.5" />;
                return <p key={i} className="text-sm text-white/80 leading-relaxed">{line}</p>;
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
