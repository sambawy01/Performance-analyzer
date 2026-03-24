"use client";

import {
  Heart,
  Footprints,
  Zap,
  Activity,
  TrendingUp,
  TrendingDown,
  Calendar,
  MapPin,
} from "lucide-react";
import { PerformanceRing } from "./performance-ring";
import { MotivationCard } from "./motivation-card";

interface PlayerHomeClientProps {
  player: {
    id: string;
    name: string;
    jersey_number: number | null;
    position: string | null;
  };
  compositeScore: number;
  sessionsThisMonth: number;
  nextSession: { date: string; type: string; location: string | null } | null;
  weeklyStats: {
    avgHr: number;
    avgHrTrend: number;
    totalDistanceKm: number;
    distanceTrend: number;
    totalSprints: number;
    sprintsTrend: number;
    recoveryScore: number;
    recoveryTrend: number;
  };
  recentSessions: Array<{
    session_id: string;
    date: string;
    type: string;
    duration: number;
    hr_avg: number;
    trimp: number;
    distance_m: number;
  }>;
}

function TrendArrow({ value }: { value: number }) {
  if (value === 0) return null;
  const isUp = value > 0;
  return (
    <span
      className={`inline-flex items-center text-[10px] font-mono font-semibold ${
        isUp ? "text-[#00ff88]" : "text-[#ff3355]"
      }`}
    >
      {isUp ? <TrendingUp size={10} className="mr-0.5" /> : <TrendingDown size={10} className="mr-0.5" />}
      {isUp ? "+" : ""}
      {typeof value === "number" && !Number.isInteger(value)
        ? value.toFixed(1)
        : value}
    </span>
  );
}

function getIntensityColor(trimp: number) {
  if (trimp >= 150) return { bg: "bg-[#ff3355]/10", border: "border-[#ff3355]/20", dot: "bg-[#ff3355]", label: "High" };
  if (trimp >= 80) return { bg: "bg-[#ff6b35]/10", border: "border-[#ff6b35]/20", dot: "bg-[#ff6b35]", label: "Medium" };
  return { bg: "bg-[#00ff88]/10", border: "border-[#00ff88]/20", dot: "bg-[#00ff88]", label: "Light" };
}

export function PlayerHomeClient({
  player,
  compositeScore,
  sessionsThisMonth,
  nextSession,
  weeklyStats,
  recentSessions,
}: PlayerHomeClientProps) {
  return (
    <div className="space-y-5">
      {/* Hero Card */}
      <div className="glass rounded-2xl p-6 relative overflow-hidden">
        {/* Gradient accent */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00d4ff] via-[#a855f7] to-[#00ff88]" />

        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-white">{player.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              {player.jersey_number != null && (
                <span className="font-mono text-lg font-bold text-[#00d4ff]">
                  #{player.jersey_number}
                </span>
              )}
              {player.position && (
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-white/[0.06] text-white/60 px-2 py-0.5 rounded-full">
                  {player.position}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <PerformanceRing score={compositeScore} />
          <div className="space-y-3 flex-1">
            <div>
              <p className="data-label mb-0.5">Your Performance Score</p>
              <p className="text-xs text-white/50">
                Based on endurance, speed, intensity, and recovery
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/40">
              <Calendar size={12} />
              <span className="font-mono font-semibold text-white/70">
                {sessionsThisMonth}
              </span>
              <span>sessions this month</span>
            </div>
            {nextSession && (
              <div className="flex items-center gap-2 text-xs text-white/40">
                <MapPin size={12} />
                <span>
                  Next:{" "}
                  <span className="text-white/70">
                    {nextSession.type} &middot;{" "}
                    {new Date(nextSession.date).toLocaleDateString("en-GB", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 gap-3">
        {[
          {
            label: "Avg HR",
            value: weeklyStats.avgHr,
            unit: "bpm",
            trend: weeklyStats.avgHrTrend,
            icon: Heart,
            color: "#ff3355",
          },
          {
            label: "Distance",
            value: weeklyStats.totalDistanceKm,
            unit: "km",
            trend: weeklyStats.distanceTrend,
            icon: Footprints,
            color: "#00d4ff",
          },
          {
            label: "Sprints",
            value: weeklyStats.totalSprints,
            unit: "",
            trend: weeklyStats.sprintsTrend,
            icon: Zap,
            color: "#ff6b35",
          },
          {
            label: "Recovery",
            value: weeklyStats.recoveryScore,
            unit: "bpm/60s",
            trend: weeklyStats.recoveryTrend,
            icon: Activity,
            color: "#00ff88",
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="glass rounded-xl p-4 hover:bg-white/[0.06] transition-colors"
            >
              <div className="flex items-center gap-1.5 mb-2">
                <Icon size={12} style={{ color: stat.color }} />
                <span className="data-label">{stat.label}</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-xl font-bold text-white">
                  {stat.value}
                </span>
                {stat.unit && (
                  <span className="text-[10px] text-white/30">{stat.unit}</span>
                )}
              </div>
              <div className="mt-1">
                <TrendArrow value={stat.trend} />
                {stat.trend !== 0 && (
                  <span className="text-[10px] text-white/25 ml-1">vs last week</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Motivation Card */}
      <MotivationCard playerId={player.id} context="motivation" />

      {/* Recent Sessions */}
      <div>
        <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
          Recent Sessions
        </h2>
        <div className="space-y-2">
          {recentSessions.map((session) => {
            const intensity = getIntensityColor(session.trimp);
            return (
              <div
                key={session.session_id}
                className={`glass rounded-xl p-4 border ${intensity.border} ${intensity.bg} transition-all duration-200`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${intensity.dot}`} />
                    <span className="text-sm font-semibold text-white">
                      {session.type}
                    </span>
                    <span className="text-[10px] font-semibold uppercase text-white/25 bg-white/[0.04] px-1.5 py-0.5 rounded">
                      {intensity.label}
                    </span>
                  </div>
                  <span className="text-xs text-white/30 font-mono">
                    {session.date
                      ? new Date(session.date).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })
                      : ""}
                  </span>
                </div>
                <div className="flex gap-4 text-xs text-white/50">
                  {session.duration > 0 && (
                    <span>
                      <span className="font-mono text-white/70">
                        {session.duration}
                      </span>{" "}
                      min
                    </span>
                  )}
                  <span>
                    HR{" "}
                    <span className="font-mono text-white/70">
                      {session.hr_avg}
                    </span>{" "}
                    bpm
                  </span>
                  <span>
                    TRIMP{" "}
                    <span className="font-mono text-white/70">
                      {session.trimp}
                    </span>
                  </span>
                  {session.distance_m > 0 && (
                    <span>
                      <span className="font-mono text-white/70">
                        {(session.distance_m / 1000).toFixed(1)}
                      </span>{" "}
                      km
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          {recentSessions.length === 0 && (
            <div className="glass rounded-xl p-6 text-center text-sm text-white/30">
              No sessions recorded yet. Get out there!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
