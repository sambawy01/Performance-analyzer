"use client";

import { useState } from "react";

interface DayData {
  date: string; // YYYY-MM-DD
  label: string; // "23 Mar"
  avgTrimp: number | null;
  sessionType: string | null;
  isRestDay: boolean;
}

interface LoadHeatmapProps {
  days: DayData[];
  aiInsight: string | null;
}

function getDayColor(day: DayData): { bg: string; border: string; text: string } {
  if (day.isRestDay && day.avgTrimp === null) {
    return {
      bg: "rgba(0,212,255,0.06)",
      border: "rgba(0,212,255,0.25)",
      text: "#00d4ff",
    };
  }
  if (day.avgTrimp === null) {
    return {
      bg: "rgba(255,255,255,0.03)",
      border: "rgba(255,255,255,0.06)",
      text: "rgba(255,255,255,0.2)",
    };
  }
  if (day.avgTrimp < 80) {
    return {
      bg: "rgba(0,255,136,0.15)",
      border: "rgba(0,255,136,0.3)",
      text: "#00ff88",
    };
  }
  if (day.avgTrimp <= 150) {
    return {
      bg: "rgba(255,107,53,0.15)",
      border: "rgba(255,107,53,0.3)",
      text: "#ff6b35",
    };
  }
  return {
    bg: "rgba(255,51,85,0.2)",
    border: "rgba(255,51,85,0.4)",
    text: "#ff3355",
  };
}

function formatMarkdown(text: string) {
  return text.split("\n").map((line, i) => {
    if (!line.trim()) return <span key={i} />;
    const html = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
    return (
      <span key={i} className="text-sm text-white/70" dangerouslySetInnerHTML={{ __html: html }} />
    );
  });
}

export function LoadHeatmap({ days, aiInsight }: LoadHeatmapProps) {
  const [tooltip, setTooltip] = useState<{ day: DayData; x: number; y: number } | null>(null);

  const weeks: DayData[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div
      className="rounded-xl border border-white/[0.08] p-5"
      style={{ background: "rgba(10,14,26,0.8)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold">Training Load Calendar</h3>
          <p className="text-xs text-white/40 mt-0.5">Last 30 days — team average TRIMP per day</p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 flex-wrap justify-end">
          {[
            { label: "No data", bg: "rgba(255,255,255,0.06)", border: "rgba(255,255,255,0.1)" },
            { label: "Low (<80)", bg: "rgba(0,255,136,0.2)", border: "rgba(0,255,136,0.4)" },
            { label: "Med (80-150)", bg: "rgba(255,107,53,0.2)", border: "rgba(255,107,53,0.4)" },
            { label: "High (>150)", bg: "rgba(255,51,85,0.25)", border: "rgba(255,51,85,0.5)" },
            { label: "Rest", bg: "rgba(0,212,255,0.08)", border: "rgba(0,212,255,0.3)" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div
                className="h-3 w-3 rounded-sm border"
                style={{ background: item.bg, borderColor: item.border }}
              />
              <span className="text-xs text-white/40">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="relative">
        <div className="flex flex-wrap gap-1.5">
          {days.map((day) => {
            const colors = getDayColor(day);
            return (
              <div
                key={day.date}
                className="relative h-9 w-9 rounded-md border cursor-pointer transition-all duration-150 hover:scale-110"
                style={{ background: colors.bg, borderColor: colors.border }}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setTooltip({ day, x: rect.left, y: rect.top });
                }}
                onMouseLeave={() => setTooltip(null)}
              >
                <span
                  className="absolute bottom-0.5 right-1 text-[9px] font-mono"
                  style={{ color: colors.text }}
                >
                  {day.avgTrimp !== null ? Math.round(day.avgTrimp) : ""}
                </span>
              </div>
            );
          })}
        </div>

        {/* Day labels below */}
        <div className="flex flex-wrap gap-1.5 mt-1">
          {days.map((day) => (
            <div key={day.date} className="h-4 w-9 flex items-center justify-center">
              <span className="text-[9px] text-white/20">{day.label.split(" ")[0]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 rounded-lg border border-white/10 px-3 py-2 pointer-events-none text-xs shadow-2xl"
          style={{
            background: "rgba(10,14,26,0.98)",
            top: tooltip.y - 80,
            left: tooltip.x - 20,
            minWidth: 160,
          }}
        >
          <p className="font-semibold text-white">{tooltip.day.label}</p>
          {tooltip.day.avgTrimp !== null ? (
            <>
              <p className="text-white/60 mt-0.5">
                Avg TRIMP:{" "}
                <span className="text-white font-mono">{Math.round(tooltip.day.avgTrimp)}</span>
              </p>
              {tooltip.day.sessionType && (
                <p className="text-white/40 capitalize">{tooltip.day.sessionType}</p>
              )}
              <p className="mt-1" style={{
                color:
                  tooltip.day.avgTrimp < 80
                    ? "#00ff88"
                    : tooltip.day.avgTrimp <= 150
                    ? "#ff6b35"
                    : "#ff3355",
              }}>
                {tooltip.day.avgTrimp < 80
                  ? "Low intensity"
                  : tooltip.day.avgTrimp <= 150
                  ? "Moderate intensity"
                  : "High intensity"}
              </p>
            </>
          ) : tooltip.day.isRestDay ? (
            <p className="text-[#00d4ff]/70 mt-0.5">Rest day</p>
          ) : (
            <p className="text-white/30 mt-0.5">No session data</p>
          )}
        </div>
      )}

      {/* AI Insight */}
      {aiInsight && (
        <div
          className="mt-4 rounded-lg border px-3.5 py-3 flex items-start gap-2.5"
          style={{
            background: "rgba(168,85,247,0.06)",
            borderColor: "rgba(168,85,247,0.2)",
          }}
        >
          <span className="text-[#a855f7] text-base mt-0.5">✦</span>
          <div className="flex-1 space-y-0.5">
            {formatMarkdown(aiInsight)}
          </div>
        </div>
      )}
    </div>
  );
}
