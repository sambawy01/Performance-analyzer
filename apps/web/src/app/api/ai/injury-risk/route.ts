import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface RiskFactor {
  factor: string;
  score: number;
  maxScore: number;
  severity: "green" | "amber" | "red";
  detail: string;
}

function computeInjuryRisk(
  loadHistory: any[],
  wearableMetrics: any[],
  cvMetrics: any[]
): { riskPercentage: number; factors: RiskFactor[]; severity: "green" | "amber" | "red" } {
  const factors: RiskFactor[] = [];

  // 1. ACWR deviation from optimal (1.0-1.3)
  const latestAcwr = loadHistory[0]?.acwr_ratio ?? 1.0;
  let acwrScore = 0;
  let acwrDetail = "";
  if (latestAcwr > 1.5) {
    acwrScore = 30;
    acwrDetail = `ACWR at ${latestAcwr.toFixed(2)} — critically above safe zone (1.0-1.3)`;
  } else if (latestAcwr > 1.3) {
    acwrScore = 20;
    acwrDetail = `ACWR at ${latestAcwr.toFixed(2)} — above optimal range, entering caution zone`;
  } else if (latestAcwr >= 0.8) {
    acwrScore = 5;
    acwrDetail = `ACWR at ${latestAcwr.toFixed(2)} — within optimal training zone`;
  } else if (latestAcwr >= 0.5) {
    acwrScore = 15;
    acwrDetail = `ACWR at ${latestAcwr.toFixed(2)} — under-training risk, detraining possible`;
  } else {
    acwrScore = 10;
    acwrDetail = `ACWR at ${latestAcwr.toFixed(2)} — very low load, returning from break?`;
  }
  factors.push({
    factor: "ACWR Deviation",
    score: acwrScore,
    maxScore: 30,
    severity: acwrScore > 20 ? "red" : acwrScore > 10 ? "amber" : "green",
    detail: acwrDetail,
  });

  // 2. Declining HR recovery trend
  const recoveryVals = wearableMetrics
    .filter((m) => m.hr_recovery_60s !== null)
    .map((m) => m.hr_recovery_60s as number)
    .slice(0, 10);
  let recoveryScore = 0;
  let recoveryDetail = "Insufficient recovery data";
  if (recoveryVals.length >= 4) {
    const recentRec = recoveryVals.slice(0, 3).reduce((s: number, v: number) => s + v, 0) / 3;
    const olderRec = recoveryVals.slice(-3).reduce((s: number, v: number) => s + v, 0) / Math.min(3, recoveryVals.slice(-3).length);
    const decline = olderRec - recentRec;
    if (decline > 8) {
      recoveryScore = 25;
      recoveryDetail = `Recovery declined by ${decline.toFixed(0)} bpm — significant cardiac fatigue marker`;
    } else if (decline > 4) {
      recoveryScore = 15;
      recoveryDetail = `Recovery declined by ${decline.toFixed(0)} bpm — moderate fatigue accumulation`;
    } else if (decline > 0) {
      recoveryScore = 5;
      recoveryDetail = `Recovery slightly lower by ${decline.toFixed(0)} bpm — within normal variation`;
    } else {
      recoveryScore = 0;
      recoveryDetail = `Recovery improving by ${Math.abs(decline).toFixed(0)} bpm — positive adaptation sign`;
    }
  }
  factors.push({
    factor: "HR Recovery Trend",
    score: recoveryScore,
    maxScore: 25,
    severity: recoveryScore > 15 ? "red" : recoveryScore > 8 ? "amber" : "green",
    detail: recoveryDetail,
  });

  // 3. High cumulative load (last 7 days vs chronic baseline)
  const recentLoads = loadHistory.slice(0, 7);
  let cumulativeScore = 0;
  let cumulativeDetail = "Insufficient load data";
  if (recentLoads.length >= 3) {
    const acuteLoad = recentLoads[0]?.acute_load_7d ?? 0;
    const chronicLoad = recentLoads[0]?.chronic_load_28d ?? 1;
    const loadRatio = chronicLoad > 0 ? acuteLoad / chronicLoad : 1;
    // Also check absolute TRIMP accumulation
    const totalTrimp = wearableMetrics.slice(0, 7).reduce((s: number, m: any) => s + (m.trimp_score ?? 0), 0);
    if (totalTrimp > 900 || loadRatio > 1.5) {
      cumulativeScore = 25;
      cumulativeDetail = `Weekly TRIMP ${totalTrimp.toFixed(0)}, load ratio ${loadRatio.toFixed(2)} — excessive cumulative load`;
    } else if (totalTrimp > 650 || loadRatio > 1.3) {
      cumulativeScore = 15;
      cumulativeDetail = `Weekly TRIMP ${totalTrimp.toFixed(0)}, load ratio ${loadRatio.toFixed(2)} — elevated accumulation`;
    } else {
      cumulativeScore = 5;
      cumulativeDetail = `Weekly TRIMP ${totalTrimp.toFixed(0)} — load well managed`;
    }
  }
  factors.push({
    factor: "Cumulative Load",
    score: cumulativeScore,
    maxScore: 25,
    severity: cumulativeScore > 15 ? "red" : cumulativeScore > 8 ? "amber" : "green",
    detail: cumulativeDetail,
  });

  // 4. High intensity ratio (zone 4+5 percentage, sprint demands)
  const highIntensityPcts = wearableMetrics.slice(0, 5).map((m: any) => {
    const z4 = m.hr_zone_4_pct ?? 0;
    const z5 = m.hr_zone_5_pct ?? 0;
    return z4 + z5;
  });
  const sprintCounts = cvMetrics.slice(0, 5).map((m: any) => m.sprint_count ?? 0);
  let intensityScore = 0;
  let intensityDetail = "Insufficient intensity data";
  if (highIntensityPcts.length >= 2) {
    const avgHighPct = highIntensityPcts.reduce((s: number, v: number) => s + v, 0) / highIntensityPcts.length;
    const avgSprints = sprintCounts.length > 0 ? sprintCounts.reduce((s: number, v: number) => s + v, 0) / sprintCounts.length : 0;
    if (avgHighPct > 35 || avgSprints > 20) {
      intensityScore = 20;
      intensityDetail = `Avg ${avgHighPct.toFixed(0)}% in Z4+Z5, ${avgSprints.toFixed(0)} sprints/session — very high intensity`;
    } else if (avgHighPct > 25 || avgSprints > 14) {
      intensityScore = 12;
      intensityDetail = `Avg ${avgHighPct.toFixed(0)}% in Z4+Z5, ${avgSprints.toFixed(0)} sprints/session — moderate-high intensity`;
    } else {
      intensityScore = 3;
      intensityDetail = `Avg ${avgHighPct.toFixed(0)}% in Z4+Z5 — appropriate intensity distribution`;
    }
  }
  factors.push({
    factor: "High Intensity Ratio",
    score: intensityScore,
    maxScore: 20,
    severity: intensityScore > 15 ? "red" : intensityScore > 8 ? "amber" : "green",
    detail: intensityDetail,
  });

  const totalScore = acwrScore + recoveryScore + cumulativeScore + intensityScore;
  const riskPercentage = Math.min(100, Math.max(0, totalScore));
  const severity: "green" | "amber" | "red" =
    riskPercentage > 60 ? "red" : riskPercentage > 35 ? "amber" : "green";

  return { riskPercentage, factors, severity };
}

export async function POST(request: NextRequest) {
  try {
    const { player_id } = await request.json();

    if (!player_id || typeof player_id !== "string") {
      return NextResponse.json({ error: "player_id is required" }, { status: 400 });
    }

    // Auth check
    const authClient = await createClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile with academy_id
    const supabase = createAdminClient();
    const { data: profile } = await supabase
      .from("users")
      .select("academy_id")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Fetch player — filtered by academy_id
    const { data: player } = await supabase
      .from("players")
      .select("id, name, position, age_group, jersey_number")
      .eq("id", player_id)
      .eq("academy_id", profile.academy_id)
      .single();

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    // Fetch load history
    const { data: loadHistory } = await supabase
      .from("load_records")
      .select("*")
      .eq("player_id", player_id)
      .order("date", { ascending: false })
      .limit(30);

    // Fetch wearable metrics
    const { data: wearableMetrics } = await supabase
      .from("wearable_metrics")
      .select("trimp_score, hr_recovery_60s, hr_zone_4_pct, hr_zone_5_pct, hr_avg, hr_max, created_at")
      .eq("player_id", player_id)
      .order("created_at", { ascending: false })
      .limit(15);

    // Fetch CV metrics
    const { data: cvMetrics } = await supabase
      .from("cv_metrics")
      .select("sprint_count, max_speed_kmh, high_speed_run_count, accel_events, decel_events")
      .eq("player_id", player_id)
      .order("created_at", { ascending: false })
      .limit(10);

    const { riskPercentage, factors, severity } = computeInjuryRisk(
      loadHistory ?? [],
      wearableMetrics ?? [],
      cvMetrics ?? []
    );

    // Generate AI recommendation
    const factorsSummary = factors.map((f) => `${f.factor}: ${f.score}/${f.maxScore} (${f.severity}) — ${f.detail}`).join("\n");

    let aiRecommendation = "";
    try {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 300,
        system: "You are Coach M8 AI, an elite football performance analyst. Give a concise 2-3 sentence injury risk recommendation based on the data. Be specific and actionable. Cite numbers.",
        messages: [
          {
            role: "user",
            content: `Player: ${player.name} (#${player.jersey_number}, ${player.position}, ${player.age_group})
Risk Score: ${riskPercentage}/100 (${severity})
Risk Factors:
${factorsSummary}

What should the coaching staff do?`,
          },
        ],
      });
      const textBlock = response.content.find((b) => b.type === "text") as { type: "text"; text: string } | undefined;
      aiRecommendation = textBlock?.text ?? "";
    } catch (e) {
      aiRecommendation = `Risk score is ${riskPercentage}/100. ${severity === "red" ? "Reduce training load immediately." : severity === "amber" ? "Monitor closely and consider load reduction." : "Continue current training plan."}`;
    }

    return NextResponse.json({
      player_id,
      player_name: player.name,
      risk_percentage: riskPercentage,
      severity,
      factors,
      ai_recommendation: aiRecommendation,
    });
  } catch (error) {
    console.error("Injury risk API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Injury risk calculation failed" },
      { status: 500 }
    );
  }
}
