"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Heart,
  Activity,
  Shield,
  FileCheck,
  RefreshCw,
  Eye,
  Dumbbell,
  Stethoscope,
} from "lucide-react";
import { ExpandableCard } from "@/components/ui/expandable-card";

interface PlayerMetric {
  player_id: string;
  hr_avg: number;
  hr_max: number;
  trimp_score: number;
  players?: {
    id: string;
    name: string;
    jersey_number: number;
    position: string;
  } | null;
}

interface LoadRecord {
  player_id: string;
  acwr_ratio: number;
  risk_flag: string;
  players?: {
    id: string;
    name: string;
    jersey_number: number;
  } | null;
}

interface PostSessionReportProps {
  sessionId: string;
  sessionStatus: string;
  metrics: PlayerMetric[];
  loadRecords: LoadRecord[];
  previousLoadRecords?: LoadRecord[];
  cachedReport?: string | null;
}

interface Alert {
  playerName: string;
  playerId: string | null;
  type: "cardiac_stress" | "extreme_load" | "risk_escalation";
  detail: string;
  severity: "amber" | "red";
  explanation: string;
  cause: string;
  recommendation: string;
}

const ALERT_META: Record<Alert["type"], { label: string; icon: typeof Heart; explanation: string; cause: string; recommendation: string }> = {
  cardiac_stress: {
    label: "High Cardiac Stress",
    icon: Heart,
    explanation: "The player's average heart rate during the session was above 90% of their recorded maximum heart rate. This indicates sustained high cardiovascular demand, which increases the risk of overtraining and cardiac fatigue if repeated without adequate recovery.",
    cause: "Typically caused by high-intensity drills, insufficient recovery periods between exercises, environmental heat stress, or the player not being adequately conditioned for the session intensity.",
    recommendation: "Allow 48-72 hours of reduced intensity before the next high-demand session. Monitor resting HR the following morning -- if elevated by more than 5-8 bpm above baseline, extend rest. Consider a lighter technical session for the next training day.",
  },
  extreme_load: {
    label: "Extreme Load",
    icon: Activity,
    explanation: "The player's TRIMP (Training Impulse) score exceeded 200, which represents an extreme training load. TRIMP values above 200 in a single session significantly increase the risk of soft-tissue injury if the player's chronic load has not prepared them for this level of exertion.",
    cause: "This can result from extended session duration, high-intensity intervals without recovery, or the player compensating for missed sessions by overtraining in a single session.",
    recommendation: "Reduce the next session load by 30-40% for this player. Ensure adequate nutrition and hydration protocols are followed post-session. Consider implementing individual load caps for future sessions based on chronic training load.",
  },
  risk_escalation: {
    label: "ACWR Risk",
    icon: Shield,
    explanation: "The player's Acute:Chronic Workload Ratio (ACWR) has entered the amber or red zone. An ACWR above 1.25 indicates the acute (recent) training load is outpacing the chronic (long-term) adaptation, increasing injury probability by 2-4x according to Gabbett's research.",
    cause: "Usually caused by a rapid increase in training load, return from injury or absence without gradual reintegration, or consecutive high-intensity sessions without adequate recovery days.",
    recommendation: "For amber zone (1.25-1.5): reduce training intensity by 20-30% for the next 2-3 sessions. For red zone (>1.5): recommend full rest or light recovery-only sessions until ACWR drops below 1.3. Monitor daily to track progression.",
  },
};

export function PostSessionReport({
  sessionId,
  sessionStatus,
  metrics,
  loadRecords,
  cachedReport,
}: PostSessionReportProps) {
  const [report, setReport] = useState<string | null>(cachedReport ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markingReviewed, setMarkingReviewed] = useState(false);
  const [isReviewed, setIsReviewed] = useState(
    sessionStatus === "reviewed"
  );

  const shouldShow =
    ["completed", "reviewed"].includes(sessionStatus) &&
    metrics.length > 0;

  const generateReport = useCallback(
    async (force = false) => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/ai/cached-report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            type: "session_summary",
            force,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error ?? "Failed to generate report");
          return;
        }

        setReport(data.content);
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [sessionId]
  );

  useEffect(() => {
    if (!shouldShow || report) return;

    async function loadOrGenerate() {
      try {
        const res = await fetch(
          `/api/ai/cached-report?sessionId=${sessionId}&type=session_summary`
        );
        const data = await res.json();

        if (data.cached && data.content) {
          setReport(data.content);
          return;
        }

        generateReport(false);
      } catch {
        generateReport(false);
      }
    }

    loadOrGenerate();
  }, [sessionId, shouldShow, report, generateReport]);

  if (!shouldShow) {
    return null;
  }

  // Generate alerts with enhanced metadata
  const alerts: Alert[] = [];
  for (const m of metrics) {
    const name = m.players?.name ?? "Unknown";
    const playerId = m.players?.id ?? null;

    if (m.hr_avg && m.hr_max && m.hr_avg > m.hr_max * 0.9) {
      const meta = ALERT_META.cardiac_stress;
      alerts.push({
        playerName: name,
        playerId,
        type: "cardiac_stress",
        detail: `HR avg ${m.hr_avg} bpm (${Math.round((m.hr_avg / m.hr_max) * 100)}% of max)`,
        severity: "red",
        explanation: meta.explanation,
        cause: `${name}'s average HR of ${m.hr_avg} bpm was ${Math.round((m.hr_avg / m.hr_max) * 100)}% of their recorded max (${m.hr_max} bpm). ${meta.cause}`,
        recommendation: meta.recommendation,
      });
    }

    if (m.trimp_score > 200) {
      const meta = ALERT_META.extreme_load;
      alerts.push({
        playerName: name,
        playerId,
        type: "extreme_load",
        detail: `TRIMP ${m.trimp_score} (extreme)`,
        severity: m.trimp_score > 300 ? "red" : "amber",
        explanation: meta.explanation,
        cause: `${name} accumulated a TRIMP of ${m.trimp_score} in this session${m.trimp_score > 300 ? ", which is critically high and far above the 200 threshold" : ""}. ${meta.cause}`,
        recommendation: meta.recommendation,
      });
    }
  }

  for (const lr of loadRecords) {
    const name = lr.players?.name ?? "Unknown";
    const playerId = (lr as LoadRecord & { players?: { id?: string } }).players?.id ?? null;
    if (lr.risk_flag === "amber" || lr.risk_flag === "red") {
      const meta = ALERT_META.risk_escalation;
      alerts.push({
        playerName: name,
        playerId,
        type: "risk_escalation",
        detail: `ACWR ${lr.acwr_ratio} (${lr.risk_flag} zone)`,
        severity: lr.risk_flag as "amber" | "red",
        explanation: meta.explanation,
        cause: `${name}'s ACWR is ${lr.acwr_ratio}, placing them in the ${lr.risk_flag} zone. ${meta.cause}`,
        recommendation: lr.risk_flag === "red"
          ? "Recommend full rest or light recovery-only sessions until ACWR drops below 1.3. Do not include in high-intensity drills for the next 2-3 sessions."
          : meta.recommendation,
      });
    }
  }

  async function markAsReviewed() {
    setMarkingReviewed(true);

    try {
      const res = await fetch("/api/sessions/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          status: "reviewed",
        }),
      });

      if (res.ok) {
        setIsReviewed(true);
      }
    } catch {
      // Silent fail
    } finally {
      setMarkingReviewed(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Alert Panel — expandable cards */}
      {alerts.length > 0 && (
        <div className="rounded-xl bg-white/[0.04] border border-white/[0.08] p-4 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[#ff6b35]" />
            <h3 className="text-sm font-semibold text-white">
              Player Alerts ({alerts.length})
            </h3>
          </div>
          <div className="space-y-2">
            {alerts.map((alert, i) => {
              const AlertIcon = ALERT_META[alert.type].icon;
              const alertColor = alert.severity === "red" ? "#ff3355" : "#ff6b35";

              return (
                <ExpandableCard
                  key={i}
                  icon={<AlertIcon className="h-4 w-4" style={{ color: alertColor }} />}
                  title={alert.playerName}
                  subtitle={alert.detail}
                  badge={{
                    text: ALERT_META[alert.type].label,
                    color: alertColor,
                  }}
                  accentColor={alertColor}
                  compact
                  actions={[
                    ...(alert.playerId
                      ? [{
                          label: "View Player Profile",
                          icon: <Eye className="h-3 w-3" />,
                          href: `/players/${alert.playerId}`,
                          variant: "primary" as const,
                        }]
                      : []),
                    {
                      label: "Modify Next Session",
                      icon: <Dumbbell className="h-3 w-3" />,
                      onClick: () => console.log(`Modify session for: ${alert.playerName}`),
                      variant: "secondary" as const,
                      color: "#ff6b35",
                    },
                    {
                      label: "Flag for Medical",
                      icon: <Stethoscope className="h-3 w-3" />,
                      onClick: () => console.log(`Flag medical: ${alert.playerName}`),
                      variant: "danger" as const,
                    },
                  ]}
                >
                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1">What This Means</p>
                      <p className="text-[11px] text-white/60 leading-relaxed">{alert.explanation}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1">What Caused It</p>
                      <p className="text-[11px] text-white/60 leading-relaxed">{alert.cause}</p>
                    </div>
                    <div className="rounded-lg bg-white/[0.03] border border-white/[0.04] p-2.5">
                      <p className="text-[10px] text-white/40 uppercase tracking-wider font-semibold mb-1">Recommended Action</p>
                      <p className="text-[11px] text-white/60 leading-relaxed">{alert.recommendation}</p>
                    </div>
                  </div>
                </ExpandableCard>
              );
            })}
          </div>
        </div>
      )}

      {/* AI Report */}
      <div className="rounded-xl bg-white/[0.04] border border-white/[0.08] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#a855f7]" />
            <h3 className="text-sm font-semibold text-white">
              AI Session Report
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {report && !loading && (
              <button
                onClick={() => generateReport(true)}
                className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
                title="Regenerate report"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Regenerate
              </button>
            )}
            {isReviewed && (
              <span className="flex items-center gap-1.5 text-xs text-[#a855f7] font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Reviewed
              </span>
            )}
          </div>
        </div>

        <div className="p-4">
          {loading && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 text-[#a855f7] animate-spin mx-auto mb-3" />
              <p className="text-sm text-white/40">
                Analyzing session data...
              </p>
            </div>
          )}

          {error && !loading && (
            <div className="rounded-lg bg-[#ff3355]/10 border border-[#ff3355]/20 px-4 py-3">
              <p className="text-sm text-[#ff3355]">{error}</p>
              <button
                onClick={() => generateReport(false)}
                className="text-xs text-[#ff3355]/70 hover:text-[#ff3355] mt-1 underline"
              >
                Try again
              </button>
            </div>
          )}

          {report && !loading && (
            <div className="space-y-4">
              <div className="prose prose-invert prose-sm max-w-none [&_h1]:text-lg [&_h2]:text-base [&_h3]:text-sm [&_p]:text-white/70 [&_li]:text-white/70 [&_strong]:text-white">
                <div
                  dangerouslySetInnerHTML={{
                    __html: report
                      .replace(/\n/g, "<br/>")
                      .replace(
                        /\*\*(.*?)\*\*/g,
                        "<strong>$1</strong>"
                      )
                      .replace(/#{3}\s(.*?)(?:<br\/>|$)/g, "<h3>$1</h3>")
                      .replace(/#{2}\s(.*?)(?:<br\/>|$)/g, "<h2>$1</h2>")
                      .replace(/#{1}\s(.*?)(?:<br\/>|$)/g, "<h1>$1</h1>"),
                  }}
                />
              </div>

              {!isReviewed && (
                <button
                  onClick={markAsReviewed}
                  disabled={markingReviewed}
                  className="h-11 px-5 rounded-xl bg-[#a855f7]/15 border border-[#a855f7]/30 text-[#a855f7] font-semibold text-sm transition-all hover:bg-[#a855f7]/25 active:scale-95 flex items-center gap-2 disabled:opacity-50"
                >
                  {markingReviewed ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileCheck className="h-4 w-4" />
                  )}
                  Mark as Reviewed
                </button>
              )}
            </div>
          )}

          {!report && !loading && !error && (
            <div className="text-center py-6">
              <Sparkles className="h-8 w-8 text-[#a855f7]/40 mx-auto mb-3" />
              <p className="text-sm text-white/40 mb-4">
                Preparing AI session analysis...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
