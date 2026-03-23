"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Clock,
  MapPin,
  Target,
  AlertTriangle,
  Users,
  Plus,
  Trophy,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  Heart,
  Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type PlannedSession,
  type SessionIntensity,
  INTENSITY_COLORS,
  INTENSITY_LABELS,
} from "./types";
import { SessionModal } from "./session-modal";

interface DayCardProps {
  dayName: string;
  dayNumber: number;
  month: string;
  dateKey: string;
  session: PlannedSession | null;
  isToday: boolean;
  isMatch: boolean;
  matchOpponent?: string;
  playersAtRisk?: Array<{
    id: string;
    jerseyNumber: number;
    name: string;
    acwr: number;
    riskFlag: string;
  }>;
}

function IntensityDot({ intensity }: { intensity: SessionIntensity }) {
  const color = INTENSITY_COLORS[intensity];
  return (
    <span
      className="inline-block h-2.5 w-2.5 rounded-full"
      style={{
        backgroundColor: color,
        boxShadow: `0 0 6px ${color}80`,
      }}
      aria-label={`${INTENSITY_LABELS[intensity]} intensity`}
    />
  );
}

function SessionTypeIcon({ type }: { type: string }) {
  switch (type) {
    case "match":
      return <Trophy className="h-3.5 w-3.5" />;
    case "recovery":
      return <Heart className="h-3.5 w-3.5" />;
    case "rest":
      return <Moon className="h-3.5 w-3.5" />;
    default:
      return <Dumbbell className="h-3.5 w-3.5" />;
  }
}

function getTypeBadgeColor(type: string): string {
  switch (type) {
    case "match":
      return "#a855f7";
    case "recovery":
      return "#00ff88";
    default:
      return "#3b82f6";
  }
}

export function DayCard({
  dayName,
  dayNumber,
  month,
  dateKey,
  session,
  isToday,
  isMatch,
  matchOpponent,
  playersAtRisk = [],
}: DayCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const intensityColor = session
    ? INTENSITY_COLORS[session.intensity]
    : undefined;

  const typeBadgeColor = session ? getTypeBadgeColor(session.type) : undefined;

  const handleCardClick = () => {
    if (session) {
      setModalOpen(true);
    }
  };

  return (
    <>
      <div
        onClick={handleCardClick}
        className={cn(
          "flex flex-col rounded-xl border transition-all duration-300 min-h-[200px] group",
          // Today glow
          isToday &&
            "ring-1 ring-[#00d4ff]/50 shadow-[0_0_20px_rgba(0,212,255,0.12)]",
          // Match border
          isMatch &&
            "border-[#a855f7]/40 shadow-[0_0_15px_rgba(168,85,247,0.15)]",
          !isMatch && !isToday && "border-white/[0.08]",
          // Session vs empty styling
          session
            ? "glass cursor-pointer hover:scale-[1.02] hover:shadow-[0_0_24px_rgba(0,212,255,0.1)]"
            : "bg-white/[0.02] border-dashed border-white/[0.06]"
        )}
        style={
          session && intensityColor
            ? {
                borderLeftWidth: "3px",
                borderLeftColor: intensityColor,
              }
            : undefined
        }
        role={session ? "button" : undefined}
        tabIndex={session ? 0 : undefined}
        onKeyDown={
          session
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setModalOpen(true);
                }
              }
            : undefined
        }
        aria-label={
          session
            ? `${dayName} ${dayNumber} - ${session.type} session. Click for details.`
            : `${dayName} ${dayNumber} - Rest day`
        }
      >
        {/* Day Header */}
        <div
          className={cn(
            "flex items-center justify-between px-3 py-2 border-b border-white/[0.06] rounded-t-xl",
            isToday && "bg-[#00d4ff]/[0.08]"
          )}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-white/50 uppercase tracking-wider">
              {dayName}
            </span>
            <span
              className={cn(
                "font-mono text-sm font-semibold",
                isToday ? "text-[#00d4ff]" : "text-white/80"
              )}
            >
              {dayNumber}
            </span>
          </div>
          {isToday && (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#00d4ff] bg-[#00d4ff]/10 px-1.5 py-0.5 rounded">
              Today
            </span>
          )}
          {isMatch && !isToday && (
            <Trophy className="h-3.5 w-3.5 text-[#a855f7]" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-3">
          {session ? (
            <div className="space-y-2.5">
              {/* Type Badge + Intensity */}
              <div className="flex items-center justify-between">
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded capitalize"
                  style={{
                    backgroundColor: `${typeBadgeColor}20`,
                    color: typeBadgeColor,
                  }}
                >
                  <SessionTypeIcon type={session.type} />
                  {session.type}
                </span>
                <IntensityDot intensity={session.intensity} />
              </div>

              {/* AI Badge */}
              {session.aiGenerated && (
                <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[#a855f7]/80 bg-[#a855f7]/10 px-1.5 py-0.5 rounded w-fit">
                  <Sparkles className="h-2.5 w-2.5" />
                  AI Generated
                </div>
              )}

              {/* Time */}
              <div className="flex items-center gap-1.5 text-white/60">
                <Clock className="h-3 w-3" />
                <span className="font-mono text-xs">{session.time}</span>
              </div>

              {/* Duration + Location */}
              <div className="flex items-center gap-2 text-xs text-white/50">
                <span className="font-mono">{session.duration} min</span>
                <span className="text-white/20">|</span>
                <div className="flex items-center gap-1">
                  <MapPin className="h-2.5 w-2.5" />
                  <span>{session.location}</span>
                </div>
              </div>

              {/* Match opponent */}
              {isMatch && matchOpponent && (
                <div
                  className="flex items-center gap-1.5 text-xs font-medium text-[#a855f7] bg-[#a855f7]/10 px-2 py-1 rounded"
                  style={{
                    boxShadow: "0 0 8px rgba(168, 85, 247, 0.1)",
                  }}
                >
                  <Trophy className="h-3 w-3" />
                  vs {matchOpponent}
                </div>
              )}

              {/* Focus */}
              {session.focus && (
                <div className="flex items-start gap-1.5 text-xs text-white/60">
                  <Target className="h-3 w-3 mt-0.5 shrink-0" />
                  <span>
                    <span className="text-white/40">Focus:</span>{" "}
                    {session.focus}
                  </span>
                </div>
              )}

              {/* Rest Players Warning */}
              {session.restPlayers.length > 0 && (
                <div className="flex items-start gap-1.5 text-xs text-[#ff6b35]">
                  <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                  <span>
                    Rest:{" "}
                    {session.restPlayers
                      .map((p) => `#${p.jerseyNumber}`)
                      .join(", ")}
                  </span>
                </div>
              )}

              {/* Available Players */}
              {session.availablePlayers !== undefined && (
                <div className="flex items-center gap-1.5 text-xs text-white/40">
                  <Users className="h-3 w-3" />
                  <span>{session.availablePlayers} players avail.</span>
                </div>
              )}

              {/* Predicted Readiness */}
              {session.predictedReadiness !== undefined && (
                <div className="mt-1 pt-2 border-t border-white/[0.06]">
                  <div className="flex items-center justify-between text-[10px] text-white/40 uppercase tracking-wider mb-1">
                    <span>Readiness</span>
                    <span
                      className="font-mono font-semibold"
                      style={{
                        color:
                          session.predictedReadiness >= 80
                            ? "#00ff88"
                            : session.predictedReadiness >= 60
                            ? "#ff6b35"
                            : "#ff3355",
                      }}
                    >
                      {session.predictedReadiness}/100
                    </span>
                  </div>
                  <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${session.predictedReadiness}%`,
                        backgroundColor:
                          session.predictedReadiness >= 80
                            ? "#00ff88"
                            : session.predictedReadiness >= 60
                            ? "#ff6b35"
                            : "#ff3355",
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Expand/Collapse for notes */}
              {session.notes && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpanded(!expanded);
                  }}
                  className="flex items-center gap-1 text-[10px] text-white/30 hover:text-white/50 transition-colors mt-1"
                >
                  {expanded ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                  {expanded ? "Less" : "More"}
                </button>
              )}

              {expanded && session.notes && (
                <div className="text-xs text-white/40 leading-relaxed border-t border-white/[0.04] pt-2 mt-1 bg-white/[0.02] rounded p-2">
                  {session.notes}
                </div>
              )}
            </div>
          ) : (
            /* Rest Day / Empty */
            <div className="flex flex-col items-center justify-center h-full gap-3 py-4">
              <div className="text-center">
                <Moon className="h-5 w-5 text-white/20 mx-auto mb-1.5" />
                <p className="text-xs font-medium text-white/30 uppercase tracking-wider">
                  Rest Day
                </p>
              </div>
              <Link
                href={`/session-design?date=${dateKey}`}
                className="flex items-center gap-1 text-xs text-[#00d4ff]/60 hover:text-[#00d4ff] hover:bg-[#00d4ff]/10 px-2.5 py-1.5 rounded-lg transition-all duration-200 border border-[#00d4ff]/20 hover:border-[#00d4ff]/40 hover:shadow-[0_0_12px_rgba(0,212,255,0.15)]"
              >
                <Plus className="h-3 w-3" />
                Add Session
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Session Detail Modal */}
      {modalOpen && session && (
        <SessionModal
          session={session}
          dayName={dayName}
          dayNumber={dayNumber}
          month={month}
          isMatch={isMatch}
          matchOpponent={matchOpponent}
          playersAtRisk={playersAtRisk}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
