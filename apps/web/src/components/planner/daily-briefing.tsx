"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  Clock,
  AlertTriangle,
  Target,
  Activity,
  Loader2,
  Dumbbell,
  Moon,
  Users,
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

interface BriefingData {
  tips: string[];
  loading: boolean;
}

export function DailyBriefing({
  todaySession,
  playersAtRisk,
  teamReadiness,
}: DailyBriefingProps) {
  const [briefing, setBriefing] = useState<BriefingData>({
    tips: [],
    loading: false,
  });

  // Auto-generate tips on mount
  useEffect(() => {
    const tips: string[] = [];

    if (playersAtRisk.length > 0) {
      const redPlayers = playersAtRisk.filter((p) => p.riskFlag === "red");
      const amberPlayers = playersAtRisk.filter((p) => p.riskFlag === "amber");

      if (redPlayers.length > 0) {
        tips.push(
          `${redPlayers.map((p) => `#${p.jerseyNumber} ${p.name}`).join(", ")} ${
            redPlayers.length === 1 ? "has" : "have"
          } high ACWR - reduce load or rest today.`
        );
      }
      if (amberPlayers.length > 0) {
        tips.push(
          `Monitor ${amberPlayers.map((p) => `#${p.jerseyNumber}`).join(", ")} - approaching load threshold.`
        );
      }
    }

    if (todaySession) {
      tips.push(
        `Today's ${todaySession.type} session at ${todaySession.location} - ${todaySession.duration_minutes} min planned.`
      );
    } else {
      tips.push(
        "No session scheduled today - good opportunity for recovery work."
      );
    }

    if (teamReadiness !== null) {
      if (teamReadiness >= 80) {
        tips.push("Team readiness is high - good day for intense work.");
      } else if (teamReadiness >= 60) {
        tips.push("Moderate team readiness - keep intensity controlled.");
      } else {
        tips.push("Low team readiness - consider a lighter session.");
      }
    }

    setBriefing({ tips, loading: false });
  }, [todaySession, playersAtRisk, teamReadiness]);

  const readinessColor =
    teamReadiness !== null
      ? teamReadiness >= 80
        ? "#00ff88"
        : teamReadiness >= 60
        ? "#ff6b35"
        : "#ff3355"
      : "#94a3b8";

  return (
    <div className="glass rounded-xl overflow-hidden">
      {/* Header with gradient */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{
          background:
            "linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(0, 212, 255, 0.05))",
          borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
        }}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#a855f7]" />
          <h3 className="text-sm font-semibold">Daily Briefing</h3>
        </div>
        <span className="text-[10px] font-mono text-white/40">
          {new Date().toLocaleDateString("en-GB", {
            weekday: "short",
            day: "numeric",
            month: "short",
          })}
        </span>
      </div>

      <div className="p-4 space-y-4">
        {/* Today's Session */}
        <div className="flex items-start gap-3">
          {todaySession ? (
            <>
              <div className="p-2 rounded-lg bg-[#00d4ff]/10 shrink-0">
                <Dumbbell className="h-4 w-4 text-[#00d4ff]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-0.5">
                  Today&apos;s Session
                </p>
                <p className="text-sm font-medium text-white/90 capitalize">
                  {todaySession.type} Training
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs text-white/50">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span className="font-mono">
                      {todaySession.duration_minutes} min
                    </span>
                  </span>
                  <span className="text-white/20">|</span>
                  <span>{todaySession.location}</span>
                </div>
                {todaySession.notes && (
                  <p className="text-xs text-white/40 mt-1 italic">
                    {todaySession.notes}
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="p-2 rounded-lg bg-white/[0.04] shrink-0">
                <Moon className="h-4 w-4 text-white/30" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-0.5">
                  Today
                </p>
                <p className="text-sm text-white/50">
                  No session scheduled - Rest day
                </p>
              </div>
            </>
          )}
        </div>

        {/* Team Readiness */}
        {teamReadiness !== null && (
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/[0.04] shrink-0">
              <Activity className="h-4 w-4" style={{ color: readinessColor }} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-white/50 mb-1">Team Readiness</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${teamReadiness}%`,
                      backgroundColor: readinessColor,
                      boxShadow: `0 0 8px ${readinessColor}60`,
                    }}
                  />
                </div>
                <span
                  className="font-mono text-sm font-bold"
                  style={{ color: readinessColor }}
                >
                  {teamReadiness}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Players at Risk */}
        {playersAtRisk.length > 0 && (
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-[#ff6b35]/10 shrink-0">
              <AlertTriangle className="h-4 w-4 text-[#ff6b35]" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-1.5">
                Players to Watch
              </p>
              <div className="space-y-1">
                {playersAtRisk.slice(0, 4).map((p) => (
                  <div
                    key={p.jerseyNumber}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-white/60">
                      #{p.jerseyNumber} {p.name}
                    </span>
                    <span
                      className="font-mono font-semibold"
                      style={{
                        color:
                          p.riskFlag === "red" ? "#ff3355" : "#ff6b35",
                      }}
                    >
                      {p.acwr.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* AI Tips */}
        {briefing.loading ? (
          <div className="flex items-center gap-2 text-xs text-white/30">
            <Loader2 className="h-3 w-3 animate-spin" />
            Loading insights...
          </div>
        ) : (
          briefing.tips.length > 0 && (
            <div className="border-t border-white/[0.06] pt-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Target className="h-3 w-3 text-[#a855f7]" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#a855f7]/60">
                  AI Tips
                </span>
              </div>
              <div className="space-y-1.5">
                {briefing.tips.map((tip, i) => (
                  <p key={i} className="text-xs text-white/45 leading-relaxed">
                    {tip}
                  </p>
                ))}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
