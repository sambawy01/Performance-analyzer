"use client";

import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Crosshair,
  ArrowUpRight,
  ArrowDownRight,
  Maximize2,
  Zap,
  Brain,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Shield,
  Swords,
} from "lucide-react";
import { MetricInfo } from "@/components/ui/metric-info";

interface TacticalData {
  avg_formation: string | null;
  compactness_avg: number | null;
  compactness_std: number | null;
  defensive_line_height_avg: number | null;
  team_width_avg: number | null;
  team_length_avg: number | null;
  pressing_intensity: number | null;
  transition_speed_atk_s: number | null;
  transition_speed_def_s: number | null;
  possession_pct: number | null;
  formation_snapshots: Array<{ minute: number; formation: string }> | null;
}

interface TacticalHistory {
  session_id: string;
  date: string;
  type: string;
  pressing_intensity: number | null;
  possession_pct: number | null;
  compactness_avg: number | null;
  transition_speed_atk_s: number | null;
  transition_speed_def_s: number | null;
  avg_formation: string | null;
}

// Assess metric with comparison to history
function assessMetric(current: number, history: number[], label: string): { trend: string; color: string; icon: typeof TrendingUp; insight: string } {
  if (history.length === 0) return { trend: "N/A", color: "text-white/60", icon: Minus, insight: `First recorded value for ${label}.` };
  const avg = history.reduce((s, v) => s + v, 0) / history.length;
  const diff = ((current - avg) / avg) * 100;
  if (diff > 10) return { trend: `+${Math.round(diff)}%`, color: "text-[#00ff88]", icon: TrendingUp, insight: `${label} is ${Math.round(diff)}% above the team's recent average (${avg.toFixed(1)}).` };
  if (diff < -10) return { trend: `${Math.round(diff)}%`, color: "text-[#ff3355]", icon: TrendingDown, insight: `${label} dropped ${Math.abs(Math.round(diff))}% below the recent average (${avg.toFixed(1)}).` };
  return { trend: "Stable", color: "text-[#00d4ff]", icon: Minus, insight: `${label} is consistent with recent sessions (avg ${avg.toFixed(1)}).` };
}

function getPressingAnalysis(ppda: number): { label: string; color: string; analysis: string } {
  if (ppda < 7) return { label: "Aggressive", color: "text-[#ff3355]", analysis: "Very high pressing intensity — the team is winning the ball back quickly but this is physically demanding. Sustainable only for short phases or very fit squads." };
  if (ppda < 9) return { label: "High", color: "text-[#ff6b35]", analysis: "Strong pressing game. The team is proactively hunting the ball in the opponent's half. Good for creating chances but requires high fitness and coordination." };
  if (ppda < 12) return { label: "Medium", color: "text-[#00d4ff]", analysis: "Balanced pressing approach. The team is selectively pressing rather than constantly hunting. Appropriate for most training sessions and matches." };
  return { label: "Low", color: "text-[#00ff88]", analysis: "Conservative defensive approach — the team is sitting deeper and absorbing pressure. Either a deliberate tactical choice or a sign of fatigue." };
}

function getPossessionAnalysis(pct: number, type: string): string {
  if (type === "match" || type === "friendly") {
    if (pct > 60) return "Dominant possession — the team controlled the ball effectively. This suggests good technical quality and composure under pressure.";
    if (pct > 50) return "Slight possession advantage. Competitive match with fairly even ball control.";
    if (pct > 40) return "The opponent had more of the ball. The team relied more on counter-attacking and direct play.";
    return "Low possession — the team was under sustained pressure. Review whether this was tactical or forced by the opposition.";
  }
  if (pct > 55) return "Good ball retention in training. Players are comfortable keeping possession under pressure.";
  if (pct > 45) return "Balanced session — both attacking and defensive phases got equal work.";
  return "Lower possession suggests the drills focused more on defensive work, transitions, or fitness.";
}

function getCompactnessAnalysis(avg: number, std: number): string {
  if (avg < 25) return `Very compact shape (${avg.toFixed(1)}m). The team stayed tight and disciplined. Low variability (±${std.toFixed(1)}m) shows good collective awareness. Risk: can be vulnerable to balls over the top.`;
  if (avg < 30) return `Good compactness (${avg.toFixed(1)}m). The team maintained a solid shape without being too narrow. Variability of ±${std.toFixed(1)}m is normal.`;
  if (avg < 35) return `Moderate compactness (${avg.toFixed(1)}m). The team occasionally stretched, creating gaps. ±${std.toFixed(1)}m variability suggests inconsistency in shape maintenance.`;
  return `Spread out shape (${avg.toFixed(1)}m). The team was stretched, with significant gaps between lines. High variability (±${std.toFixed(1)}m) indicates poor collective positioning. Needs work in team shape drills.`;
}

function getTransitionAnalysis(atk: number, def: number): string {
  const faster = atk < def ? "attacking" : "defensive";
  const diff = Math.abs(atk - def).toFixed(1);
  let analysis = `The team transitions to ${faster} mode ${diff}s faster. `;
  if (atk < 3.5) analysis += "Attacking transitions are very quick — the team counter-attacks effectively. ";
  else if (atk > 4.5) analysis += "Slow attacking transitions — the team takes too long to exploit turnovers. Work on transition drills. ";
  if (def < 3.0) analysis += "Defensive recovery is excellent — players get behind the ball quickly.";
  else if (def > 4.0) analysis += "Slow defensive recovery — vulnerable to counter-attacks. Emphasis needed on defensive transition discipline.";
  return analysis;
}

export function SessionTacticalTab({ tactical, history }: { tactical: TacticalData | null; history: TacticalHistory[] }) {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  if (!tactical) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tactical Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Crosshair className="h-10 w-10 text-white/10 mb-4" />
            <p className="text-white/60 mb-2">No tactical data for this session.</p>
            <p className="text-sm text-white/60">
              Process a video through the CV pipeline to generate formation maps, pressing analysis, and transition metrics.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const histPressing = history.filter(h => h.pressing_intensity != null).map(h => h.pressing_intensity!);
  const histPossession = history.filter(h => h.possession_pct != null).map(h => h.possession_pct!);
  const histCompact = history.filter(h => h.compactness_avg != null).map(h => h.compactness_avg!);
  const histTransAtk = history.filter(h => h.transition_speed_atk_s != null).map(h => h.transition_speed_atk_s!);

  const pressingInfo = tactical.pressing_intensity ? getPressingAnalysis(tactical.pressing_intensity) : null;
  const pressingTrend = tactical.pressing_intensity ? assessMetric(tactical.pressing_intensity, histPressing, "Pressing intensity") : null;
  const possessionTrend = tactical.possession_pct ? assessMetric(tactical.possession_pct, histPossession, "Possession") : null;
  const compactTrend = tactical.compactness_avg ? assessMetric(tactical.compactness_avg, histCompact, "Compactness") : null;

  return (
    <div className="space-y-4">
      {/* Formation + Possession Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Crosshair className="h-4 w-4 text-[#00d4ff]" />
              <MetricInfo term="formation">Formation</MetricInfo>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-mono font-bold text-[#00d4ff] text-glow-blue mb-3">
              {tactical.avg_formation ?? "--"}
            </p>
            {tactical.formation_snapshots && tactical.formation_snapshots.length > 1 && (
              <div className="space-y-2">
                <p className="data-label">Formation Timeline</p>
                <div className="flex flex-wrap gap-1.5">
                  {tactical.formation_snapshots.map((snap, i) => (
                    <Badge key={i} variant="outline" className="font-mono text-xs border-white/10">
                      {snap.minute}&apos; → {snap.formation}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-white/60 italic mt-1">
                  {tactical.formation_snapshots.length - 1} formation change{tactical.formation_snapshots.length > 2 ? "s" : ""} during the session — {tactical.formation_snapshots.length > 3 ? "frequent adjustments suggest reactive coaching or unsettled shape" : "normal in-session adaptation"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Possession with analysis */}
        {tactical.possession_pct !== null && (
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="h-4 w-4 text-[#00d4ff]" />
                  <MetricInfo term="possession">Possession Analysis</MetricInfo>
                </CardTitle>
                {possessionTrend && (
                  <Badge variant="outline" className={`font-mono text-xs ${possessionTrend.color} border-white/10`}>
                    <possessionTrend.icon className="h-3 w-3 mr-1" />
                    {possessionTrend.trend} vs avg
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6 mb-3">
                <p className="metric-value text-[#00d4ff]">{Math.round(tactical.possession_pct)}%</p>
                <div className="flex-1">
                  <div className="h-3 rounded-full overflow-hidden flex bg-white/[0.06]">
                    <div
                      className="h-full bg-gradient-to-r from-[#00d4ff] to-[#00d4ff]/60 rounded-full transition-all"
                      style={{ width: `${tactical.possession_pct}%`, boxShadow: "0 0 10px rgba(0,212,255,0.3)" }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-white/60 mt-1">
                    <span>Our team</span>
                    <span>Opposition</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-white/70 leading-relaxed italic">
                {getPossessionAnalysis(tactical.possession_pct, "training")}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pressing Intelligence */}
      {pressingInfo && tactical.pressing_intensity !== null && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Swords className="h-4 w-4 text-[#ff6b35]" />
                <MetricInfo term="ppda">Pressing Analysis (PPDA)</MetricInfo>
              </CardTitle>
              {pressingTrend && (
                <Badge variant="outline" className={`font-mono text-xs ${pressingTrend.color} border-white/10`}>
                  <pressingTrend.icon className="h-3 w-3 mr-1" />
                  {pressingTrend.trend} vs avg
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-3">
              <p className={`metric-value ${pressingInfo.color}`}>{tactical.pressing_intensity.toFixed(1)}</p>
              <Badge className={`${pressingInfo.color} bg-white/[0.04] border border-white/10`}>
                {pressingInfo.label}
              </Badge>
            </div>
            <p className="text-xs text-white/70 leading-relaxed italic mb-3">{pressingInfo.analysis}</p>
            {pressingTrend && (
              <p className="text-xs text-white/60">{pressingTrend.insight}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Defensive Shape Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {tactical.compactness_avg !== null && tactical.compactness_std !== null && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Shield className="h-4 w-4 text-[#00ff88]" />
                  <MetricInfo term="compactness">Defensive Shape</MetricInfo>
                </CardTitle>
                {compactTrend && (
                  <Badge variant="outline" className={`font-mono text-xs ${compactTrend.color} border-white/10`}>
                    <compactTrend.icon className="h-3 w-3 mr-1" />
                    {compactTrend.trend}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-3">
                <div>
                  <p className="data-label mb-1"><MetricInfo term="compactness">Compactness</MetricInfo></p>
                  <p className="text-xl font-mono font-bold text-white">{tactical.compactness_avg.toFixed(1)}m</p>
                  <p className="text-xs text-white/60">±{tactical.compactness_std.toFixed(1)}m</p>
                </div>
                {tactical.defensive_line_height_avg !== null && (
                  <div>
                    <p className="data-label mb-1"><MetricInfo term="def-line">Def. Line</MetricInfo></p>
                    <p className="text-xl font-mono font-bold text-white">{tactical.defensive_line_height_avg.toFixed(0)}m</p>
                    <p className="text-xs text-white/60">from own goal</p>
                  </div>
                )}
                {tactical.team_width_avg !== null && tactical.team_length_avg !== null && (
                  <div>
                    <p className="data-label mb-1"><MetricInfo term="team-shape">Team Shape</MetricInfo></p>
                    <p className="text-xl font-mono font-bold text-white">{tactical.team_width_avg.toFixed(0)}×{tactical.team_length_avg.toFixed(0)}</p>
                    <p className="text-xs text-white/60">W × L meters</p>
                  </div>
                )}
              </div>
              <p className="text-xs text-white/70 leading-relaxed italic">
                {getCompactnessAnalysis(tactical.compactness_avg, tactical.compactness_std)}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Transitions Intelligence */}
        {tactical.transition_speed_atk_s !== null && tactical.transition_speed_def_s !== null && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="h-4 w-4 text-[#ff6b35]" />
                <MetricInfo term="transition-atk">Transition Analysis</MetricInfo>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-[#00ff88]/10 p-2 shadow-[0_0_10px_rgba(0,255,136,0.15)]">
                    <ArrowUpRight className="h-5 w-5 text-[#00ff88]" />
                  </div>
                  <div>
                    <p className="data-label">Def → Atk</p>
                    <p className="text-xl font-mono font-bold text-[#00ff88]">{tactical.transition_speed_atk_s.toFixed(1)}s</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-[#ff3355]/10 p-2 shadow-[0_0_10px_rgba(255,51,85,0.15)]">
                    <ArrowDownRight className="h-5 w-5 text-[#ff3355]" />
                  </div>
                  <div>
                    <p className="data-label">Atk → Def</p>
                    <p className="text-xl font-mono font-bold text-[#ff3355]">{tactical.transition_speed_def_s.toFixed(1)}s</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-white/70 leading-relaxed italic">
                {getTransitionAnalysis(tactical.transition_speed_atk_s, tactical.transition_speed_def_s)}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* AI Tactical Deep Dive */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Brain className="h-4 w-4 text-[#a855f7] drop-shadow-[0_0_6px_rgba(168,85,247,0.5)]" />
              <span className="text-gradient">AI Tactical Intelligence</span>
            </CardTitle>
            <button
              onClick={async () => {
                setAiLoading(true);
                try {
                  const res = await fetch("/api/ai/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      messages: [{
                        role: "user",
                        content: `Provide a tactical deep-dive analysis for this session. The tactical data is:
Formation: ${tactical.avg_formation}
Formation changes: ${tactical.formation_snapshots?.map(s => `${s.minute}' → ${s.formation}`).join(", ") ?? "none"}
Possession: ${tactical.possession_pct}%
PPDA (pressing intensity): ${tactical.pressing_intensity}
Compactness: ${tactical.compactness_avg}m (±${tactical.compactness_std}m)
Defensive line: ${tactical.defensive_line_height_avg}m
Team shape: ${tactical.team_width_avg}m × ${tactical.team_length_avg}m
Transition Def→Atk: ${tactical.transition_speed_atk_s}s
Transition Atk→Def: ${tactical.transition_speed_def_s}s

Compare these to the team's recent tactical metrics. Give me:
1. What tactical patterns are emerging across recent sessions?
2. What's working and what needs coaching attention?
3. How does this session's tactical profile compare to the best-performing sessions?
4. 3 specific tactical drills to work on based on this data
5. Any concerns about tactical discipline or shape?

Reference specific numbers and compare to previous sessions.`
                      }],
                      context: `Tactical history for comparison:\n${history.map(h => `${h.date} ${h.type}: Formation ${h.avg_formation}, Possession ${h.possession_pct}%, PPDA ${h.pressing_intensity}, Compactness ${h.compactness_avg}m, Transition ${h.transition_speed_atk_s}s/${h.transition_speed_def_s}s`).join("\n")}`,
                    }),
                  });
                  const data = await res.json();
                  setAiAnalysis(data.reply);
                } catch (e) {
                  setAiAnalysis("Failed to generate analysis.");
                } finally {
                  setAiLoading(false);
                }
              }}
              disabled={aiLoading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#a855f7] to-[#00d4ff] px-3 py-1.5 text-xs font-medium text-white hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all duration-300 disabled:opacity-50"
            >
              {aiLoading ? <><Loader2 className="h-3 w-3 animate-spin" /> Analyzing...</> : <><Brain className="h-3 w-3" /> Deep Analysis</>}
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {aiAnalysis ? (
            <div className="space-y-1.5">
              {aiAnalysis.split("\n").map((line, i) => {
                if (!line.trim()) return <div key={i} className="h-2" />;
                if (line.trim().startsWith("**") || line.match(/^\d+\./)) {
                  return <p key={i} className="text-sm font-semibold text-white mt-2 first:mt-0">{line.replace(/\*\*/g, "")}</p>;
                }
                if (line.trim().startsWith("- ") || line.trim().startsWith("• ")) {
                  return (
                    <div key={i} className="flex items-start gap-2 text-sm ml-2">
                      <span className="text-[#a855f7] mt-0.5">•</span>
                      <span className="text-white/60 leading-relaxed">{line.replace(/^[-•]\s*/, "")}</span>
                    </div>
                  );
                }
                return <p key={i} className="text-sm text-white/60 leading-relaxed">{line}</p>;
              })}
              <div className="flex items-center gap-1.5 pt-3 border-t border-white/[0.06] mt-3">
                <Brain className="h-3 w-3 text-[#a855f7]/40" />
                <span className="text-xs text-white/60 italic">Coach M8 AI — tactical analysis based on session data + historical comparison</span>
              </div>
            </div>
          ) : !aiLoading ? (
            <p className="text-sm text-white/60 italic py-4 text-center">
              Click &quot;Deep Analysis&quot; for AI-powered tactical intelligence comparing this session to your team&apos;s patterns.
            </p>
          ) : (
            <div className="flex items-center justify-center py-6 gap-2">
              <Loader2 className="h-5 w-5 text-[#a855f7] animate-spin" />
              <span className="text-sm text-[#a855f7]">Analyzing tactical patterns...</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
