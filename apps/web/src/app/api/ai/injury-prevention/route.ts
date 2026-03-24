import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  try {
    const { academy_id, playersAtRisk } = await request.json();

    if (!academy_id) {
      return NextResponse.json({ error: "academy_id required" }, { status: 400 });
    }

    // Auth
    const cookieStore = await cookies();
    const authSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(c) { try { c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {} },
        },
      }
    );
    const { data: { user } } = await authSupabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Build prompt from the at-risk players data sent by client
    const riskSummary = (playersAtRisk ?? [])
      .map((p: any) =>
        `- #${p.jerseyNumber} ${p.name} (${p.position}): Risk ${p.riskPct}% (${p.severity}) | ACWR: ${p.acwr?.toFixed(2) ?? "N/A"} | HR Recovery: ${p.hrRecovery ?? "N/A"} bpm | Weekly TRIMP: ${p.weeklyTrimp ?? "N/A"} | Z4+Z5: ${p.highIntensityPct?.toFixed(0) ?? "N/A"}% | Days since rest: ${p.daysSinceRest ?? "N/A"} | Amber+ occurrences (30d): ${p.amberCount ?? 0}`
      )
      .join("\n");

    const prompt = `You are Coach M8 AI, an elite sports scientist specializing in youth football injury prevention.

SQUAD AT-RISK PLAYERS:
${riskSummary || "No players currently flagged at high risk."}

For each at-risk player (risk > 30%), provide:

Return a JSON object (no markdown, just raw JSON) with this structure:
{
  "squadNarrative": "2-3 sentence overview of the squad's current injury risk state",
  "playerProtocols": [
    {
      "name": "Player Name",
      "jerseyNumber": 10,
      "riskForecast": [45, 50, 55, 62, 68, 72, 78],
      "forecastNarrative": "If Ahmed trains at full intensity Mon-Wed, his injury risk reaches 78% by Thursday.",
      "sessionModifications": ["Cap at 60 min", "No sprints above 90% max HR"],
      "recoveryProtocols": ["Cold water immersion post-session", "Extra 30 min sleep"],
      "returnCriteria": ["ACWR must drop below 1.3", "HR recovery must exceed 25 bpm"],
      "aiRecommendation": "Specific action recommendation"
    }
  ],
  "weeklyLoadAdvice": "Advice on the team's weekly load distribution",
  "historicalPattern": "Observation about chronic overload patterns in the squad"
}

Rules:
- riskForecast is an array of 7 numbers (Mon-Sun predicted risk %) assuming current training continues
- Be specific with names and numbers
- Session modifications should be practical and specific
- Recovery protocols should be evidence-based
- Return criteria should be measurable`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2500,
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
