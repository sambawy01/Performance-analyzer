"use client";

import { useState, useMemo } from "react";
import { Brain, Loader2, Zap, TrendingUp, TrendingDown, Minus, Dumbbell, StickyNote } from "lucide-react";
import { ExpandableCard } from "@/components/ui/expandable-card";

interface LoadRecord {
  date: string;
  acwr_ratio: number;
  daily_load: number;
  acute_load_7d: number;
  chronic_load_28d: number;
  risk_flag: string;
}

interface WearableMetric {
  hr_recovery_60s: number | null;
  trimp_score: number;
  created_at: string;
}

interface InjuryRiskPanelProps {
  playerName: string;
  loadHistory: LoadRecord[];
  recentMetrics: WearableMetric[];
}

function computeRiskScore(
  loadHistory: LoadRecord[],
  recentMetrics: WearableMetric[]
): {
  score: number;
  acwrTrend: "rising" | "stable" | "falling";
  recoveryTrend: "improving" | "stable" | "declining";
  loadConsistency: "consistent" | "spike" | "gradual";
  breakdown: { label: string; value: number; weight: number }[];
} {
  const recent = loadHistory.slice(0, 7);
  const older = loadHistory.slice(7, 14);

  // ACWR trend over 7 sessions
  let acwrTrend: "rising" | "stable" | "falling" = "stable";
  if (recent.length >= 3) {
    const recentAvg = recent.slice(0, 3).reduce((s, r) => s + r.acwr_ratio, 0) / 3;
    const olderAvg = recent.slice(-3).reduce((s, r) => s + r.acwr_ratio, 0) / Math.min(3, recent.slice(-3).length);
    const diff = recentAvg - olderAvg;
    if (diff > 0.08) acwrTrend = "rising";
    else if (diff < -0.08) acwrTrend = "falling";
  }

  // Recovery trend
  let recoveryTrend: "improving" | "stable" | "declining" = "stable";
  const recoveryVals = recentMetrics
    .filter((m) => m.hr_recovery_60s !== null)
    .map((m) => m.hr_recovery_60s as number);
  if (recoveryVals.length >= 4) {
    const recentRec = recoveryVals.slice(0, 2).reduce((s, v) => s + v, 0) / 2;
    const olderRec = recoveryVals.slice(-2).reduce((s, v) => s + v, 0) / 2;
    if (recentRec - olderRec > 3) recoveryTrend = "improving";
    else if (olderRec - recentRec > 3) recoveryTrend = "declining";
  }

  // Load consistency: spike detection
  let loadConsistency: "consistent" | "spike" | "gradual" = "consistent";
  if (recent.length >= 2) {
    const loads = recent.map((r) => r.daily_load);
    const maxLoad = Math.max(...loads);
    const avgLoad = loads.reduce((s, v) => s + v, 0) / loads.length;
    if (maxLoad > avgLoad * 1.5 && maxLoad > avgLoad + 50) {
      loadConsistency = "spike";
    } else {
      const diffs = loads.slice(1).map((v, i) => v - loads[i]);
      const allPositive = diffs.every((d) => d >= 0);
      if (allPositive && diffs.some((d) => d > 10)) loadConsistency = "gradual";
    }
  }

  // Score components (0-100 scale, higher = more risk)
  const latestAcwr = recent[0]?.acwr_ratio ?? 1.0;
  const acwrScore =
    latestAcwr > 1.5
      ? 80
      : latestAcwr > 1.3
      ? 55
      : latestAcwr > 1.1
      ? 30
      : latestAcwr < 0.7
      ? 20
      : 10;

  const acwrTrendScore = acwrTrend === "rising" ? 25 : acwrTrend === "stable" ? 5 : 0;
  const recoveryScore = recoveryTrend === "declining" ? 20 : recoveryTrend === "stable" ? 8 : 0;
  const consistencyScore = loadConsistency === "spike" ? 20 : loadConsistency === "gradual" ? 8 : 0;

  // Red flag bonus
  const riskFlagBonus = recent[0]?.risk_flag === "red" ? 15 : recent[0]?.risk_flag === "amber" ? 8 : 0;

  const rawScore = acwrScore + acwrTrendScore + recoveryScore + consistencyScore + riskFlagBonus;
  const score = Math.min(100, Math.max(0, rawScore));

  return {
    score,
    acwrTrend,
    recoveryTrend,
    loadConsistency,
    breakdown: [
      { label: "Current ACWR level", value: acwrScore, weight: 35 },
      { label: "ACWR trend (7 sessions)", value: acwrTrendScore, weight: 25 },
      { label: "Recovery trend", value: recoveryScore, weight: 20 },
      { label: "Load consistency", value: consistencyScore, weight: 20 },
    ],
  };
}

function RiskGauge({ score }: { score: number }) {
  // Semicircle gauge using SVG
  const radius = 70;
  const cx = 90;
  const cy = 90;
  const startAngle = -180;
  const endAngle = 0;
  const totalArc = endAngle - startAngle; // 180 degrees

  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const arcPath = (start: number, end: number, r: number) => {
    const s = { x: cx + r * Math.cos(toRad(start)), y: cy + r * Math.sin(toRad(start)) };
    const e = { x: cx + r * Math.cos(toRad(end)), y: cy + r * Math.sin(toRad(end)) };
    const large = end - start > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
  };

  // Needle angle: -180 (left, 0%) to 0 (right, 100%)
  const needleAngle = startAngle + (score / 100) * totalArc;
  const needleLength = 55;
  const needleX = cx + needleLength * Math.cos(toRad(needleAngle));
  const needleY = cy + needleLength * Math.sin(toRad(needleAngle));

  const color = score <= 30 ? "#00ff88" : score <= 60 ? "#ff6b35" : "#ff3355";
  const label = score <= 30 ? "LOW RISK" : score <= 60 ? "MODERATE" : "HIGH RISK";

  return (
    <div className="flex flex-col items-center">
      <svg width="180" height="100" viewBox="0 0 180 100">
        {/* Background track — green zone */}
        <path
          d={arcPath(-180, -120, radius)}
          fill="none"
          stroke="rgba(0,255,136,0.2)"
          strokeWidth="14"
          strokeLinecap="round"
        />
        {/* Amber zone */}
        <path
          d={arcPath(-120, -60, radius)}
          fill="none"
          stroke="rgba(255,107,53,0.2)"
          strokeWidth="14"
          strokeLinecap="round"
        />
        {/* Red zone */}
        <path
          d={arcPath(-60, 0, radius)}
          fill="none"
          stroke="rgba(255,51,85,0.2)"
          strokeWidth="14"
          strokeLinecap="round"
        />

        {/* Active fill */}
        {score > 0 && (
          <path
            d={arcPath(-180, needleAngle, radius)}
            fill="none"
            stroke={color}
            strokeWidth="14"
            strokeLinecap="round"
            opacity={0.8}
          />
        )}

        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={needleX}
          y2={needleY}
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Center dot */}
        <circle cx={cx} cy={cy} r="5" fill="white" opacity={0.9} />

        {/* Zone labels */}
        <text x="14" y="90" fill="rgba(0,255,136,0.6)" fontSize="8" textAnchor="middle">0</text>
        <text x="90" y="20" fill="rgba(255,107,53,0.6)" fontSize="8" textAnchor="middle">50</text>
        <text x="166" y="90" fill="rgba(255,51,85,0.6)" fontSize="8" textAnchor="middle">100</text>
      </svg>

      <div className="text-center -mt-2">
        <p className="text-3xl font-bold" style={{ color }}>{score}</p>
        <p className="text-xs font-semibold tracking-widest mt-0.5" style={{ color }}>{label}</p>
      </div>
    </div>
  );
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "rising" || trend === "declining") return <TrendingUp className="h-3.5 w-3.5 text-[#ff3355]" />;
  if (trend === "falling" || trend === "improving") return <TrendingDown className="h-3.5 w-3.5 text-[#00ff88]" />;
  return <Minus className="h-3.5 w-3.5 text-white/40" />;
}

export function InjuryRiskPanel({
  playerName,
  loadHistory,
  recentMetrics,
}: InjuryRiskPanelProps) {
  const [whatIfTrimp, setWhatIfTrimp] = useState(100);
  const [showWhatIf, setShowWhatIf] = useState(false);
  const [aiNarrative, setAiNarrative] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const { score, acwrTrend, recoveryTrend, loadConsistency, breakdown } = useMemo(
    () => computeRiskScore(loadHistory, recentMetrics),
    [loadHistory, recentMetrics]
  );

  const latest = loadHistory[0];

  // What-if: predict ACWR if player trains tomorrow
  const predictedAcwr = useMemo(() => {
    if (!latest) return null;
    // New acute load = (current 7d acute + tomorrow's load) / 8 * 7 (rolling avg approximation)
    const newAcute = (latest.acute_load_7d * 7 + whatIfTrimp) / 7;
    const chronic = latest.chronic_load_28d > 0 ? latest.chronic_load_28d : 100;
    return (newAcute / chronic).toFixed(2);
  }, [latest, whatIfTrimp]);

  const generateNarrative = async () => {
    setAiLoading(true);
    try {
      const context = `Player: ${playerName}. Risk score: ${score}/100. ACWR: ${latest?.acwr_ratio ?? "N/A"} (${latest?.risk_flag ?? "N/A"}). ACWR trend: ${acwrTrend}. Recovery trend: ${recoveryTrend}. Load consistency: ${loadConsistency}. Last 5 sessions: ${loadHistory.slice(0, 5).map((l) => `ACWR ${l.acwr_ratio} on ${l.date}`).join(", ")}.`;
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `Generate a 2-3 sentence injury risk narrative for this player. Be specific, cite the data, and give a clear recommendation. Context: ${context}`,
          }],
          context: `Injury risk assessment for ${playerName}`,
        }),
      });
      const data = await res.json();
      setAiNarrative(data.reply);
    } catch {
      setAiNarrative("Unable to generate AI narrative at this time.");
    } finally {
      setAiLoading(false);
    }
  };

  const riskColor = score <= 30 ? "#00ff88" : score <= 60 ? "#ff6b35" : "#ff3355";

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{
        background: "rgba(10,14,26,0.8)",
        borderColor: `${riskColor}25`,
        boxShadow: `0 0 30px ${riskColor}08`,
      }}
    >
      <div className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-4 w-4" style={{ color: riskColor }} />
          <h3 className="text-sm font-semibold text-white">Enhanced Injury Risk Assessment</h3>
          <span
            className="ml-auto text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: `${riskColor}15`, color: riskColor }}
          >
            Score: {score}/100
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Gauge */}
          <div className="flex flex-col items-center justify-center">
            <RiskGauge score={score} />
          </div>

          {/* Risk factors — expandable cards */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-2">
              {[
                {
                  label: "ACWR Trend (7 sessions)",
                  value: acwrTrend,
                  detail: `Current: ${latest?.acwr_ratio ?? "N/A"}`,
                  icon: <TrendIcon trend={acwrTrend} />,
                  explanation: acwrTrend === "rising"
                    ? "The acute:chronic workload ratio is trending upward over the last 7 sessions, meaning recent training load is outpacing long-term adaptation. This increases injury risk if not managed."
                    : acwrTrend === "falling"
                      ? "ACWR is trending downward, indicating load is decreasing relative to chronic baseline. This could mean deloading or reduced participation -- both reduce injury risk but may also indicate detraining."
                      : "ACWR is stable, suggesting training load is consistent with the player's chronic adaptation. This is the ideal scenario for injury prevention.",
                  accentColor: acwrTrend === "rising" ? "#ff3355" : acwrTrend === "falling" ? "#00ff88" : "#00d4ff",
                },
                {
                  label: "Recovery Trend",
                  value: recoveryTrend,
                  detail: recentMetrics[0]?.hr_recovery_60s
                    ? `Latest: ${recentMetrics[0].hr_recovery_60s} bpm`
                    : "No data",
                  icon: <TrendIcon trend={recoveryTrend} />,
                  explanation: recoveryTrend === "declining"
                    ? "Heart rate recovery at 60 seconds is declining, which is a key indicator of accumulated fatigue and reduced cardiovascular fitness. The body is taking longer to return to baseline after exertion."
                    : recoveryTrend === "improving"
                      ? "HR recovery is improving, showing enhanced cardiovascular fitness and better autonomic nervous system function. The player is adapting well to the training load."
                      : "Recovery metrics are stable, suggesting the current training load is well-balanced for this player's fitness level.",
                  accentColor: recoveryTrend === "declining" ? "#ff3355" : recoveryTrend === "improving" ? "#00ff88" : "#00d4ff",
                },
                {
                  label: "Load Consistency",
                  value: loadConsistency,
                  detail:
                    loadConsistency === "spike"
                      ? "Sudden spike detected"
                      : loadConsistency === "gradual"
                      ? "Gradual increase"
                      : "Well distributed",
                  icon:
                    loadConsistency === "spike" ? (
                      <TrendingUp className="h-3.5 w-3.5 text-[#ff3355]" />
                    ) : loadConsistency === "gradual" ? (
                      <TrendingUp className="h-3.5 w-3.5 text-[#ff6b35]" />
                    ) : (
                      <Minus className="h-3.5 w-3.5 text-[#00ff88]" />
                    ),
                  explanation: loadConsistency === "spike"
                    ? "A sudden load spike was detected -- one session had a dramatically higher load than the average. Load spikes are one of the strongest predictors of soft-tissue injury (Gabbett 2016). The body needs gradual, progressive overload."
                    : loadConsistency === "gradual"
                      ? "Load has been gradually increasing across sessions. While progressive overload is necessary for adaptation, ensure the rate of increase stays below 10% per week to maintain safety."
                      : "Training load has been well-distributed across sessions with no spikes or dramatic changes. This is the optimal pattern for injury prevention and progressive development.",
                  accentColor: loadConsistency === "spike" ? "#ff3355" : loadConsistency === "gradual" ? "#ff6b35" : "#00ff88",
                },
              ].map((item) => (
                <ExpandableCard
                  key={item.label}
                  compact
                  icon={item.icon}
                  title={item.label}
                  subtitle={item.detail}
                  accentColor={item.accentColor}
                  preview={
                    <span className="text-xs font-medium capitalize text-white/70">{item.value}</span>
                  }
                  actions={[
                    { label: "Design Training for This", icon: <Dumbbell className="h-3 w-3" />, onClick: () => console.log(`Design training for: ${item.label}`), variant: "primary", color: item.accentColor },
                    { label: "Add Coach Note", icon: <StickyNote className="h-3 w-3" />, onClick: () => console.log(`Add note for: ${item.label}`), variant: "secondary" },
                  ]}
                >
                  <div className="space-y-2">
                    <p className="text-[11px] text-white/50 leading-relaxed">{item.explanation}</p>
                    <div className="rounded-lg bg-white/[0.03] border border-white/[0.04] p-2">
                      <p className="text-[10px] text-white/40">
                        <span className="uppercase tracking-wider font-semibold">Historical comparison: </span>
                        This metric has been tracked across {loadHistory.length} sessions for {playerName}.
                      </p>
                    </div>
                  </div>
                </ExpandableCard>
              ))}
            </div>

            {/* Risk score breakdown */}
            <div className="space-y-1.5">
              {breakdown.map((b) => (
                <div key={b.label}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs text-white/40">{b.label}</span>
                    <span className="text-xs font-mono text-white/50">{b.value}/{b.weight * 3}</span>
                  </div>
                  <div className="h-1 rounded-full bg-white/[0.05] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${(b.value / (b.weight * 3)) * 100}%`,
                        background: riskColor,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Narrative */}
        <div className="mt-4 space-y-2">
          {aiNarrative ? (
            <div
              className="rounded-lg px-3.5 py-3 text-sm text-white/70"
              style={{
                background: `${riskColor}08`,
                border: `1px solid ${riskColor}25`,
              }}
            >
              <div className="flex items-start gap-2">
                <Brain className="h-4 w-4 shrink-0 mt-0.5" style={{ color: riskColor }} />
                <p>{aiNarrative}</p>
              </div>
            </div>
          ) : (
            <button
              onClick={generateNarrative}
              disabled={aiLoading}
              className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg border transition-all duration-200 disabled:opacity-40"
              style={{
                borderColor: "rgba(168,85,247,0.25)",
                background: "rgba(168,85,247,0.06)",
                color: "#a855f7",
              }}
            >
              {aiLoading ? (
                <><Loader2 className="h-3 w-3 animate-spin" /> Generating AI narrative...</>
              ) : (
                <><Brain className="h-3 w-3" /> Generate AI Risk Narrative</>
              )}
            </button>
          )}
        </div>

        {/* What-if simulator */}
        <div className="mt-4">
          <button
            onClick={() => setShowWhatIf((v) => !v)}
            className="flex items-center gap-2 text-xs text-white/40 hover:text-white/60 transition-colors"
          >
            <Zap className="h-3 w-3" />
            &ldquo;What if&rdquo; Simulator
            <span className="text-white/20">{showWhatIf ? "▲" : "▼"}</span>
          </button>

          {showWhatIf && (
            <div
              className="mt-3 rounded-lg px-4 py-3 space-y-3"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div>
                <label className="text-xs text-white/50">
                  If player trains tomorrow at TRIMP:{" "}
                  <span className="text-white font-mono">{whatIfTrimp}</span>
                </label>
                <input
                  type="range"
                  min={20}
                  max={250}
                  value={whatIfTrimp}
                  onChange={(e) => setWhatIfTrimp(Number(e.target.value))}
                  className="w-full mt-2 accent-current"
                  style={{ accentColor: riskColor }}
                />
                <div className="flex justify-between text-xs text-white/20 mt-0.5">
                  <span>Easy (20)</span>
                  <span>High (150)</span>
                  <span>Max (250)</span>
                </div>
              </div>

              {predictedAcwr && (
                <div className="flex items-center justify-between rounded-lg px-3 py-2"
                  style={{
                    background:
                      Number(predictedAcwr) > 1.5
                        ? "rgba(255,51,85,0.1)"
                        : Number(predictedAcwr) > 1.3
                        ? "rgba(255,107,53,0.1)"
                        : "rgba(0,255,136,0.08)",
                    border: `1px solid ${
                      Number(predictedAcwr) > 1.5
                        ? "rgba(255,51,85,0.2)"
                        : Number(predictedAcwr) > 1.3
                        ? "rgba(255,107,53,0.2)"
                        : "rgba(0,255,136,0.15)"
                    }`,
                  }}>
                  <span className="text-xs text-white/50">Predicted ACWR tomorrow</span>
                  <span
                    className="text-sm font-bold font-mono"
                    style={{
                      color:
                        Number(predictedAcwr) > 1.5
                          ? "#ff3355"
                          : Number(predictedAcwr) > 1.3
                          ? "#ff6b35"
                          : "#00ff88",
                    }}
                  >
                    {predictedAcwr}
                    {Number(predictedAcwr) > 1.5
                      ? " ⚠ DANGER"
                      : Number(predictedAcwr) > 1.3
                      ? " ⚡ CAUTION"
                      : " ✓ SAFE"}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
