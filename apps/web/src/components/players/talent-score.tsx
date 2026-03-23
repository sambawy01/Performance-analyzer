"use client";

import { useEffect, useState } from "react";
import { Zap, TrendingUp, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface TalentScoreProps {
  playerId: string;
  playerName: string;
  sessionMetrics: Array<{
    sessions: { date: string } | null;
    hr_avg: number;
    trimp_score: number;
    hr_recovery_60s: number | null;
  }>;
  loadHistory: Array<{
    date: string;
    daily_load: number;
    acute_load_7d: number;
    chronic_load_28d: number;
    acwr_ratio: number;
    risk_flag: string;
  }>;
}

function computeTalentScore(
  sessionMetrics: TalentScoreProps["sessionMetrics"],
  loadHistory: TalentScoreProps["loadHistory"]
): { score: number; breakdown: Record<string, number> } {
  if (sessionMetrics.length < 2) {
    return { score: 0, breakdown: {} };
  }

  // Split into old half and new half
  const midpoint = Math.floor(sessionMetrics.length / 2);
  const olderSessions = sessionMetrics.slice(midpoint);
  const newerSessions = sessionMetrics.slice(0, midpoint);

  const avg = (arr: number[]) =>
    arr.length > 0 ? arr.reduce((s, v) => s + v, 0) / arr.length : 0;

  // 1. HR Efficiency — weight 30
  // Base score from absolute efficiency + bonus for improvement
  const avgHr = avg(sessionMetrics.map((m) => m.hr_avg));
  const hrBaseScore = avgHr < 145 ? 20 : avgHr < 155 ? 15 : avgHr < 165 ? 10 : 5;
  const oldHr = avg(olderSessions.map((m) => m.hr_avg));
  const newHr = avg(newerSessions.map((m) => m.hr_avg));
  const hrTrend = oldHr > 0 ? Math.max(0, Math.min(10, ((oldHr - newHr) / oldHr) * 100)) : 5;
  const hrImprovement = hrBaseScore + hrTrend;

  // 2. TRIMP capacity — weight 25
  const avgTrimp = avg(sessionMetrics.map((m) => m.trimp_score));
  const trimpBaseScore = avgTrimp > 180 ? 18 : avgTrimp > 140 ? 14 : avgTrimp > 100 ? 10 : 5;
  const oldTrimp = avg(olderSessions.map((m) => m.trimp_score));
  const newTrimp = avg(newerSessions.map((m) => m.trimp_score));
  const trimpTrend = oldTrimp > 0 ? Math.max(0, Math.min(7, ((newTrimp - oldTrimp) / oldTrimp) * 70)) : 3;
  const trimpImprovement = trimpBaseScore + trimpTrend;

  // 3. Recovery rate — weight 20
  const recoveryMetrics = sessionMetrics.filter((m) => m.hr_recovery_60s !== null);
  let recoveryScore = 10;
  if (recoveryMetrics.length >= 2) {
    const avgRecovery = avg(recoveryMetrics.map((m) => m.hr_recovery_60s!));
    const recoveryBase = avgRecovery > 30 ? 14 : avgRecovery > 22 ? 11 : avgRecovery > 15 ? 8 : 4;
    const oldRecovery = avg(recoveryMetrics.slice(Math.floor(recoveryMetrics.length / 2)).map((m) => m.hr_recovery_60s!));
    const newRecovery = avg(recoveryMetrics.slice(0, Math.floor(recoveryMetrics.length / 2)).map((m) => m.hr_recovery_60s!));
    const recoveryTrend = Math.max(0, Math.min(6, ((newRecovery - oldRecovery) / Math.max(oldRecovery, 1)) * 60));
    recoveryScore = Math.min(20, recoveryBase + recoveryTrend);
  }

  // 4. Attendance consistency (sessions in last 28d vs expected 8) — weight 15
  const twentyEightDaysAgo = new Date();
  twentyEightDaysAgo.setDate(twentyEightDaysAgo.getDate() - 28);
  const recentCount = sessionMetrics.filter(
    (m) => m.sessions?.date && new Date(m.sessions.date) >= twentyEightDaysAgo
  ).length;
  const attendanceScore = Math.min(15, (recentCount / 8) * 15);

  // 5. Load management (ACWR staying in green range) — weight 10
  const latestLoads = loadHistory.slice(0, 10);
  const greenLoads = latestLoads.filter((l) => l.risk_flag === "green" || l.risk_flag === "blue").length;
  const loadScore = latestLoads.length > 0 ? (greenLoads / latestLoads.length) * 10 : 5;

  const total = Math.round(hrImprovement + trimpImprovement + recoveryScore + attendanceScore + loadScore);

  return {
    score: Math.max(0, Math.min(100, total)),
    breakdown: {
      hrEfficiency: Math.round(hrImprovement),
      trimpCapacity: Math.round(trimpImprovement),
      recovery: Math.round(recoveryScore),
      attendance: Math.round(attendanceScore),
      loadManagement: Math.round(loadScore),
    },
  };
}

function CircularProgress({ score, size = 96 }: { score: number; size?: number }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const strokeDashoffset = circumference - progress;

  const color =
    score >= 75 ? "#00d4ff" : score >= 50 ? "#a855f7" : score >= 25 ? "#ff9900" : "#ff3355";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: "rotate(-90deg)" }}
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={10}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{
            filter: `drop-shadow(0 0 6px ${color}80)`,
            transition: "stroke-dashoffset 1s ease",
          }}
        />
      </svg>
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{ color }}
      >
        <span className="text-2xl font-bold leading-none">{score}</span>
        <span className="text-[10px] text-white/40 uppercase tracking-wider mt-0.5">
          / 100
        </span>
      </div>
    </div>
  );
}

const LABELS: Record<number, string> = {
  90: "Elite development trajectory",
  75: "High-potential player",
  60: "Solid improvement curve",
  45: "Steady progress, keep pushing",
  30: "Needs consistent training",
  0: "Insufficient data to score",
};

function getLabel(score: number): string {
  const thresholds = Object.keys(LABELS)
    .map(Number)
    .sort((a, b) => b - a);
  for (const t of thresholds) {
    if (score >= t) return LABELS[t];
  }
  return LABELS[0];
}

export function TalentScore({
  playerId,
  playerName,
  sessionMetrics,
  loadHistory,
}: TalentScoreProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { score, breakdown } = computeTalentScore(sessionMetrics, loadHistory);
  const hasEnoughData = sessionMetrics.length >= 4;

  if (!mounted) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-white/30" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Zap className="h-4 w-4 text-[#ff9900] drop-shadow-[0_0_6px_rgba(255,153,0,0.5)]" />
          <span className="text-gradient">Development Potential</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasEnoughData ? (
          <div className="flex flex-col items-center py-6 text-center gap-2">
            <div className="rounded-full bg-white/[0.04] p-4">
              <TrendingUp className="h-6 w-6 text-white/20" />
            </div>
            <p className="text-sm text-white/40">
              Need at least 4 sessions to calculate development score
            </p>
            <p className="text-xs text-white/25">
              {sessionMetrics.length} session{sessionMetrics.length !== 1 ? "s" : ""} recorded
            </p>
          </div>
        ) : (
          <div className="flex items-start gap-5">
            {/* Ring */}
            <div className="shrink-0">
              <CircularProgress score={score} />
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0 space-y-3">
              <div>
                <p className="text-sm font-semibold text-white">{getLabel(score)}</p>
                <p className="text-xs text-white/40 mt-0.5">
                  Based on {sessionMetrics.length} sessions of performance data
                </p>
              </div>

              {/* Breakdown bars */}
              <div className="space-y-2">
                {[
                  { label: "HR Efficiency", value: breakdown.hrEfficiency, max: 30, color: "#00d4ff" },
                  { label: "Load Capacity", value: breakdown.trimpCapacity, max: 25, color: "#a855f7" },
                  { label: "Recovery Rate", value: breakdown.recovery, max: 20, color: "#00ff88" },
                  { label: "Attendance", value: breakdown.attendance, max: 15, color: "#ff9900" },
                  { label: "Load Mgmt", value: breakdown.loadManagement, max: 10, color: "#ff3355" },
                ].map(({ label, value, max, color }) => (
                  <div key={label} className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/50">{label}</span>
                      <span className="text-xs font-mono" style={{ color }}>
                        {value}/{max}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${(value / max) * 100}%`,
                          backgroundColor: color,
                          boxShadow: `0 0 6px ${color}60`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
