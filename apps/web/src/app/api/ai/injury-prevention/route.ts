import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPTS } from "@/lib/ai/prompts";
import { enrichSquadContext } from "@/lib/ai/enrich-context";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const { playersAtRisk } = await request.json();

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

    // Fetch squad data for enriched context
    const [playersRes, metricsRes, cvRes, loadRes, sessionsRes, tacticalRes] = await Promise.all([
      supabase.from("players").select("*").eq("academy_id", profile.academy_id).eq("status", "active"),
      supabase.from("wearable_metrics").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("cv_metrics").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("load_records").select("*").order("date", { ascending: false }).limit(500),
      supabase.from("sessions").select("*").eq("academy_id", profile.academy_id).order("date", { ascending: false }).limit(20),
      supabase.from("tactical_metrics").select("*").limit(20),
    ]);

    const players = playersRes.data ?? [];
    const playerIds = players.map(p => p.id);

    // Filter metrics to only this academy's players
    const allMetrics = (metricsRes.data ?? []).filter((m: any) => playerIds.includes(m.player_id));
    const allCvMetrics = (cvRes.data ?? []).filter((m: any) => playerIds.includes(m.player_id));
    const allLoadRecords = (loadRes.data ?? []).filter((l: any) => playerIds.includes(l.player_id));

    const enrichedContext = enrichSquadContext(
      players,
      allMetrics,
      allCvMetrics,
      allLoadRecords,
      sessionsRes.data ?? [],
      tacticalRes.data ?? []
    );

    // Build at-risk player detail from client data
    const riskSummary = (playersAtRisk ?? [])
      .map((p: any) =>
        `- #${p.jerseyNumber} ${p.name} (${p.position}): Risk ${p.riskPct}% (${p.severity}) | ACWR: ${p.acwr?.toFixed(2) ?? "N/A"} | HR Recovery: ${p.hrRecovery ?? "N/A"} bpm | Weekly TRIMP: ${p.weeklyTrimp ?? "N/A"} | Z4+Z5: ${p.highIntensityPct?.toFixed(0) ?? "N/A"}% | Days since rest: ${p.daysSinceRest ?? "N/A"} | Amber+ occurrences (30d): ${p.amberCount ?? 0}`
      )
      .join("\n");

    const systemPrompt = `${SYSTEM_PROMPTS.BASE_ANALYST}\n\n${SYSTEM_PROMPTS.INJURY_PREVENTION}`;

    const prompt = `Using the enriched squad data and injury prevention framework, generate a comprehensive injury prevention plan.

${enrichedContext}

PLAYERS FLAGGED AT RISK:
${riskSummary || "No players currently flagged at high risk."}

For each at-risk player (risk > 30%), apply the Workload-Injury Cycle Model to determine their current phase and provide specific load prescriptions.

Return a JSON object (no markdown, just raw JSON) with this structure:
{
  "squadNarrative": "2-3 sentence overview citing specific ACWR values and risk trends. Reference Gabbett thresholds.",
  "playerProtocols": [
    {
      "name": "Player Name",
      "jerseyNumber": 10,
      "currentPhase": "Phase 3: Overreach Risk",
      "riskForecast": [45, 50, 55, 62, 68, 72, 78],
      "forecastNarrative": "Based on current acute load of X and chronic load of Y, if training continues at current intensity...",
      "sessionModifications": ["Cap at 60 min", "Limit Z4+Z5 to <10% of session", "No repeated sprint drills"],
      "recoveryProtocols": ["Cold water immersion post-session", "9+ hours sleep target", "Protein intake within 30 min post-training"],
      "returnCriteria": ["ACWR must drop below 1.3", "HRR60 must return to within 10% of 30-day baseline", "2 consecutive green-flag sessions"],
      "aiRecommendation": "Specific action with timeline"
    }
  ],
  "weeklyLoadAdvice": "Evidence-based advice on weekly TRIMP distribution, referencing the 10% weekly increase rule and youth targets of 400-750 TRIMP/week",
  "historicalPattern": "Analysis of chronic overload patterns — are the same players repeatedly flagged? Is there a scheduling issue?"
}

Rules:
- riskForecast is an array of 7 numbers (Mon-Sun predicted risk %) assuming current training continues
- Categorize each risk factor as MODIFIABLE or NON-MODIFIABLE
- Reference specific Gabbett thresholds and Ferguson-Ball recovery markers
- Session modifications must be specific and measurable
- Recovery protocols must be evidence-based
- Return criteria must be measurable with clear thresholds`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 3000,
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const rawText = textBlock?.text ?? "{}";

    let jsonStr = rawText.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const result = JSON.parse(jsonStr);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Injury prevention API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate prevention plan" },
      { status: 500 }
    );
  }
}
