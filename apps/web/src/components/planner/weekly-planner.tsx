"use client";

import { useState, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Loader2,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DayCard } from "./day-card";
import { WeekSummary } from "./week-summary";
import type { PlannedSession, WeekPlan } from "./types";
import type { Session } from "@/types";

interface WeeklyPlannerProps {
  initialSessions: Session[];
  playersAtRisk: Array<{
    jerseyNumber: number;
    name: string;
    acwr: number;
    riskFlag: string;
  }>;
  nextMatch: {
    date: string;
    opponent: string;
  } | null;
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatWeekRange(monday: Date): string {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const monthFmt = new Intl.DateTimeFormat("en-US", { month: "short" });
  const monMonth = monthFmt.format(monday);
  const sunMonth = monthFmt.format(sunday);

  if (monMonth === sunMonth) {
    return `${monMonth} ${monday.getDate()} - ${sunday.getDate()}, ${monday.getFullYear()}`;
  }
  return `${monMonth} ${monday.getDate()} - ${sunMonth} ${sunday.getDate()}, ${sunday.getFullYear()}`;
}

function toDateKey(date: Date): string {
  return date.toISOString().split("T")[0];
}

function sessionToPlanned(session: Session): PlannedSession {
  const intensityMap: Record<string, PlannedSession["intensity"]> = {
    training: "medium",
    match: "match",
    friendly: "medium",
  };
  return {
    id: session.id,
    date: session.date,
    type: session.type === "match" || session.type === "friendly" ? "match" : "training",
    intensity: intensityMap[session.type] ?? "medium",
    duration: session.duration_minutes,
    location: session.location,
    time: "4:00 PM",
    focus: session.notes ?? "",
    restPlayers: [],
    notes: session.notes ?? "",
    aiGenerated: false,
  };
}

export function WeeklyPlanner({
  initialSessions,
  playersAtRisk,
  nextMatch,
}: WeeklyPlannerProps) {
  const today = new Date();
  const [currentMonday, setCurrentMonday] = useState<Date>(getMonday(today));
  const [aiPlan, setAiPlan] = useState<WeekPlan | null>(null);
  const [aiSessions, setAiSessions] = useState<Map<string, PlannedSession>>(
    new Map()
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Build session map from existing sessions
  const existingSessionMap = new Map<string, PlannedSession>();
  for (const s of initialSessions) {
    existingSessionMap.set(s.date, sessionToPlanned(s));
  }

  const navigateWeek = useCallback(
    (direction: -1 | 1) => {
      setCurrentMonday((prev) => {
        const next = new Date(prev);
        next.setDate(prev.getDate() + direction * 7);
        return next;
      });
    },
    []
  );

  const goToThisWeek = useCallback(() => {
    setCurrentMonday(getMonday(new Date()));
  }, []);

  const generateAIPlan = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/plan-week", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekStart: toDateKey(currentMonday),
          matchSchedule: nextMatch
            ? [{ date: nextMatch.date, opponent: nextMatch.opponent }]
            : [],
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to generate plan");
      }

      const data = await res.json();
      const plan = data as WeekPlan;
      setAiPlan(plan);

      // Populate AI sessions into the map
      const newAiSessions = new Map<string, PlannedSession>();
      for (const day of plan.days) {
        newAiSessions.set(day.date, { ...day, aiGenerated: true });
      }
      setAiSessions(newAiSessions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate plan");
    } finally {
      setLoading(false);
    }
  }, [currentMonday, nextMatch]);

  // Build the 7 days for the current week
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(currentMonday);
    day.setDate(currentMonday.getDate() + i);
    const dateKey = toDateKey(day);

    // AI sessions take priority over existing sessions for display
    const session =
      aiSessions.get(dateKey) ?? existingSessionMap.get(dateKey) ?? null;

    const isMatch =
      session?.type === "match" ||
      (nextMatch && nextMatch.date === dateKey);

    return {
      date: day,
      dateKey,
      dayName: DAY_NAMES[i],
      dayNumber: day.getDate(),
      month: new Intl.DateTimeFormat("en-US", { month: "short" }).format(day),
      session: session?.type === "rest" ? null : session,
      isToday: toDateKey(day) === toDateKey(today),
      isMatch: !!isMatch,
      matchOpponent:
        nextMatch && nextMatch.date === dateKey
          ? nextMatch.opponent
          : undefined,
    };
  });

  const isCurrentWeek =
    toDateKey(getMonday(today)) === toDateKey(currentMonday);

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Week Navigation */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => navigateWeek(-1)}
              aria-label="Previous week"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-2 px-3">
              <CalendarDays className="h-4 w-4 text-[#00d4ff]" />
              <span className="font-mono text-sm font-semibold text-white/90">
                {formatWeekRange(currentMonday)}
              </span>
            </div>

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => navigateWeek(1)}
              aria-label="Next week"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {!isCurrentWeek && (
            <Button
              variant="outline"
              size="sm"
              onClick={goToThisWeek}
              className="text-xs"
            >
              This Week
            </Button>
          )}
        </div>

        {/* AI Generate Button */}
        <button
          onClick={generateAIPlan}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: loading
              ? "rgba(168, 85, 247, 0.2)"
              : "linear-gradient(135deg, #a855f7, #00d4ff)",
            boxShadow: loading
              ? "none"
              : "0 0 20px rgba(168, 85, 247, 0.3), 0 0 40px rgba(0, 212, 255, 0.1)",
          }}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating Plan...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              AI Generate Week Plan
            </>
          )}
        </button>
      </div>

      {/* Players at Risk Banner */}
      {playersAtRisk.length > 0 && (
        <div className="glass rounded-lg px-4 py-2.5 border-l-2 border-[#ff6b35]">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#ff6b35] font-semibold uppercase tracking-wider">
              Players at Risk:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {playersAtRisk.map((p) => (
                <span
                  key={p.jerseyNumber}
                  className="font-mono text-white/70"
                  style={{
                    color:
                      p.riskFlag === "red" ? "#ff3355" : "#ff6b35",
                  }}
                >
                  #{p.jerseyNumber} {p.name} ({p.acwr.toFixed(2)})
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="glass rounded-lg px-4 py-2.5 border-l-2 border-[#ff3355]">
          <p className="text-xs text-[#ff3355]">{error}</p>
        </div>
      )}

      {/* 7-Day Grid */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => (
          <DayCard
            key={day.dateKey}
            dayName={day.dayName}
            dayNumber={day.dayNumber}
            month={day.month}
            session={day.session}
            isToday={day.isToday}
            isMatch={day.isMatch}
            matchOpponent={day.matchOpponent}
          />
        ))}
      </div>

      {/* Week Summary */}
      <WeekSummary plan={aiPlan} />
    </div>
  );
}
