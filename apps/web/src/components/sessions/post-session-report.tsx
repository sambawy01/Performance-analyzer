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
} from "lucide-react";

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
  type: "cardiac_stress" | "extreme_load" | "risk_escalation";
  detail: string;
  severity: "amber" | "red";
}

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

  // Only show for completed/reviewed sessions with metrics
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

  // Auto-load or auto-generate on mount
  useEffect(() => {
    if (!shouldShow || report) return;

    // No cached report passed from server — check API then auto-generate
    async function loadOrGenerate() {
      try {
        // Check if cached report exists
        const res = await fetch(
          `/api/ai/cached-report?sessionId=${sessionId}&type=session_summary`
        );
        const data = await res.json();

        if (data.cached && data.content) {
          setReport(data.content);
          return;
        }

        // No cache — auto-generate
        generateReport(false);
      } catch {
        // Silently fail the cache check, try generating
        generateReport(false);
      }
    }

    loadOrGenerate();
  }, [sessionId, shouldShow, report, generateReport]);

  if (!shouldShow) {
    return null;
  }

  // Generate alerts
  const alerts: Alert[] = [];
  for (const m of metrics) {
    const name = m.players?.name ?? "Unknown";

    if (m.hr_avg && m.hr_max && m.hr_avg > m.hr_max * 0.9) {
      alerts.push({
        playerName: name,
        type: "cardiac_stress",
        detail: `HR avg ${m.hr_avg} bpm (${Math.round((m.hr_avg / m.hr_max) * 100)}% of max)`,
        severity: "red",
      });
    }

    if (m.trimp_score > 200) {
      alerts.push({
        playerName: name,
        type: "extreme_load",
        detail: `TRIMP ${m.trimp_score} (extreme)`,
        severity: m.trimp_score > 300 ? "red" : "amber",
      });
    }
  }

  for (const lr of loadRecords) {
    const name = lr.players?.name ?? "Unknown";
    if (lr.risk_flag === "amber" || lr.risk_flag === "red") {
      alerts.push({
        playerName: name,
        type: "risk_escalation",
        detail: `ACWR ${lr.acwr_ratio} (${lr.risk_flag} zone)`,
        severity: lr.risk_flag as "amber" | "red",
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
      {/* Alert Panel */}
      {alerts.length > 0 && (
        <div className="rounded-xl bg-white/[0.04] border border-white/[0.08] p-4 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[#ff6b35]" />
            <h3 className="text-sm font-semibold text-white">
              Player Alerts ({alerts.length})
            </h3>
          </div>
          <div className="space-y-2">
            {alerts.map((alert, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${
                  alert.severity === "red"
                    ? "bg-[#ff3355]/10 border-[#ff3355]/20"
                    : "bg-[#ff6b35]/10 border-[#ff6b35]/20"
                }`}
              >
                {alert.type === "cardiac_stress" && (
                  <Heart
                    className="h-4 w-4 shrink-0"
                    style={{
                      color:
                        alert.severity === "red"
                          ? "#ff3355"
                          : "#ff6b35",
                    }}
                  />
                )}
                {alert.type === "extreme_load" && (
                  <Activity
                    className="h-4 w-4 shrink-0"
                    style={{
                      color:
                        alert.severity === "red"
                          ? "#ff3355"
                          : "#ff6b35",
                    }}
                  />
                )}
                {alert.type === "risk_escalation" && (
                  <Shield
                    className="h-4 w-4 shrink-0"
                    style={{
                      color:
                        alert.severity === "red"
                          ? "#ff3355"
                          : "#ff6b35",
                    }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold text-white">
                    {alert.playerName}
                  </span>
                  <span className="text-xs text-white/40 ml-2">
                    {alert.detail}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    alert.severity === "red"
                      ? "bg-[#ff3355]/20 text-[#ff3355]"
                      : "bg-[#ff6b35]/20 text-[#ff6b35]"
                  }`}
                >
                  {alert.type === "cardiac_stress"
                    ? "High Cardiac Stress"
                    : alert.type === "extreme_load"
                      ? "Extreme Load"
                      : "ACWR Risk"}
                </span>
              </div>
            ))}
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
