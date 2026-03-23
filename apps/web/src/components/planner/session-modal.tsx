"use client";

import { useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  X,
  Clock,
  MapPin,
  Target,
  AlertTriangle,
  Users,
  Trophy,
  Sparkles,
  Dumbbell,
  Heart,
  Calendar,
  ExternalLink,
  Palette,
} from "lucide-react";
import {
  type PlannedSession,
  type SessionIntensity,
  INTENSITY_COLORS,
  INTENSITY_LABELS,
} from "./types";

interface SessionModalProps {
  session: PlannedSession;
  dayName: string;
  dayNumber: number;
  month: string;
  isMatch: boolean;
  matchOpponent?: string;
  playersAtRisk?: Array<{
    jerseyNumber: number;
    name: string;
    acwr: number;
    riskFlag: string;
  }>;
  onClose: () => void;
}

function SessionTypeIcon({ type }: { type: string }) {
  switch (type) {
    case "match":
      return <Trophy className="h-4 w-4" />;
    case "recovery":
      return <Heart className="h-4 w-4" />;
    default:
      return <Dumbbell className="h-4 w-4" />;
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

export function SessionModal({
  session,
  dayName,
  dayNumber,
  month,
  isMatch,
  matchOpponent,
  playersAtRisk = [],
  onClose,
}: SessionModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const intensityColor = INTENSITY_COLORS[session.intensity];
  const typeBadgeColor = getTypeBadgeColor(session.type);

  const designSessionParams = new URLSearchParams({
    date: session.date,
    type: session.type,
    intensity: session.intensity,
    duration: String(session.duration),
    ...(session.focus ? { focus: session.focus } : {}),
  }).toString();

  const content = (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.7)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Session details"
    >
      {/* Modal Card */}
      <div
        className="relative w-full max-w-md rounded-2xl border border-white/[0.12] p-6 space-y-4"
        style={{
          background:
            "linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.92))",
          backdropFilter: "blur(24px)",
          boxShadow: `0 0 40px rgba(0, 212, 255, 0.08), 0 0 80px rgba(168, 85, 247, 0.05), 0 25px 50px rgba(0, 0, 0, 0.5)`,
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/10 transition-all"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3">
          <div
            className="flex items-center justify-center h-10 w-10 rounded-xl"
            style={{
              backgroundColor: `${typeBadgeColor}20`,
              color: typeBadgeColor,
            }}
          >
            <SessionTypeIcon type={session.type} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white capitalize">
                {session.type === "training" ? "Training Session" : session.type}
              </h3>
              {session.aiGenerated && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[#a855f7]/80 bg-[#a855f7]/10 px-1.5 py-0.5 rounded">
                  <Sparkles className="h-2.5 w-2.5" />
                  AI
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-white/50">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                {dayName}, {month} {dayNumber} &middot; {session.date}
              </span>
            </div>
          </div>
        </div>

        {/* Type Badge + Intensity */}
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg capitalize"
            style={{
              backgroundColor: `${typeBadgeColor}20`,
              color: typeBadgeColor,
            }}
          >
            <SessionTypeIcon type={session.type} />
            {session.type}
          </span>
          <span
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg"
            style={{
              backgroundColor: `${intensityColor}20`,
              color: intensityColor,
            }}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{
                backgroundColor: intensityColor,
                boxShadow: `0 0 6px ${intensityColor}80`,
              }}
            />
            {INTENSITY_LABELS[session.intensity]} Intensity
          </span>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm text-white/60">
            <Clock className="h-3.5 w-3.5 text-white/40" />
            <span>{session.time}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-white/60">
            <span className="font-mono text-white/40 text-xs">DUR</span>
            <span>{session.duration} min</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-white/60 col-span-2">
            <MapPin className="h-3.5 w-3.5 text-white/40" />
            <span>{session.location || "No location set"}</span>
          </div>
        </div>

        {/* Match Opponent */}
        {isMatch && matchOpponent && (
          <div
            className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg"
            style={{
              backgroundColor: "rgba(168, 85, 247, 0.1)",
              color: "#a855f7",
              boxShadow: "0 0 12px rgba(168, 85, 247, 0.1)",
            }}
          >
            <Trophy className="h-4 w-4" />
            vs {matchOpponent}
          </div>
        )}

        {/* Focus / Notes */}
        {(session.focus || session.notes) && (
          <div className="space-y-2 border-t border-white/[0.08] pt-3">
            {session.focus && (
              <div className="flex items-start gap-2">
                <Target className="h-3.5 w-3.5 text-[#00d4ff] mt-0.5 shrink-0" />
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-white/30 font-semibold block">
                    Training Focus
                  </span>
                  <p className="text-sm text-white/70 mt-0.5">{session.focus}</p>
                </div>
              </div>
            )}
            {session.notes && session.notes !== session.focus && (
              <div className="text-xs text-white/50 leading-relaxed bg-white/[0.03] rounded-lg p-2.5 mt-1">
                {session.notes}
              </div>
            )}
          </div>
        )}

        {/* Available Players */}
        {session.availablePlayers !== undefined && (
          <div className="flex items-center gap-2 text-sm text-white/50">
            <Users className="h-3.5 w-3.5" />
            <span>{session.availablePlayers} players available</span>
          </div>
        )}

        {/* Players Who Should Rest */}
        {(session.restPlayers.length > 0 || playersAtRisk.length > 0) && (
          <div className="border-t border-white/[0.08] pt-3">
            <div className="flex items-center gap-1.5 mb-2">
              <AlertTriangle className="h-3.5 w-3.5 text-[#ff6b35]" />
              <span className="text-xs font-semibold text-white/60">
                Players Who Should Rest
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {session.restPlayers.length > 0
                ? session.restPlayers.map((p) => (
                    <span
                      key={p.jerseyNumber}
                      className="inline-flex items-center gap-1 text-[11px] bg-[#ff6b35]/10 text-[#ff6b35] px-2 py-0.5 rounded font-medium"
                    >
                      #{p.jerseyNumber} {p.name}
                    </span>
                  ))
                : playersAtRisk.map((p) => (
                    <span
                      key={p.jerseyNumber}
                      className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded font-medium"
                      style={{
                        backgroundColor:
                          p.riskFlag === "red"
                            ? "rgba(255, 51, 85, 0.1)"
                            : "rgba(255, 107, 53, 0.1)",
                        color:
                          p.riskFlag === "red" ? "#ff3355" : "#ff6b35",
                      }}
                    >
                      #{p.jerseyNumber} {p.name}
                    </span>
                  ))}
            </div>
          </div>
        )}

        {/* Predicted Readiness */}
        {session.predictedReadiness !== undefined && (
          <div className="border-t border-white/[0.08] pt-3">
            <div className="flex items-center justify-between text-xs text-white/40 mb-1.5">
              <span className="uppercase tracking-wider font-semibold">
                Predicted Readiness
              </span>
              <span
                className="font-mono font-bold text-sm"
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
            <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
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

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t border-white/[0.08]">
          {session.id && (
            <Link
              href={`/sessions/${session.id}`}
              onClick={onClose}
              className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-all duration-200 text-[#00d4ff] bg-[#00d4ff]/10 hover:bg-[#00d4ff]/20 border border-[#00d4ff]/20 hover:border-[#00d4ff]/40"
            >
              <ExternalLink className="h-3 w-3" />
              View Full Session
            </Link>
          )}
          <Link
            href={`/session-design?${designSessionParams}`}
            onClick={onClose}
            className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-all duration-200 text-[#a855f7] bg-[#a855f7]/10 hover:bg-[#a855f7]/20 border border-[#a855f7]/20 hover:border-[#a855f7]/40"
          >
            <Palette className="h-3 w-3" />
            Design Session
          </Link>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(content, document.body);
}
