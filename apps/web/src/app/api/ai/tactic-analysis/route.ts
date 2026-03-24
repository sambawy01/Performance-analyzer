import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const { formation, players, opponentFormation } = await request.json();

    if (!formation || !players || !Array.isArray(players)) {
      return NextResponse.json(
        { error: "formation and players[] are required" },
        { status: 400 }
      );
    }

    // Auth check
    const cookieStore = await cookies();
    const authSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(c) {
            try {
              c.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {}
          },
        },
      }
    );
    const {
      data: { user },
    } = await authSupabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Build player data for the prompt
    const playerLines = players
      .map(
        (p: any) =>
          `- ${p.position} (${p.category}): ${p.name} #${p.jerseyNumber}${
            p.stats
              ? ` | ACWR: ${p.stats.acwr ?? "N/A"} (${p.stats.riskFlag ?? "unknown"}) | HR avg: ${p.stats.hrAvg ?? "N/A"} | TRIMP: ${p.stats.trimp ?? "N/A"} | HR Recovery: ${p.stats.hrRecovery ?? "N/A"} bpm | Sprints: ${p.stats.sprints ?? "N/A"} | Distance: ${p.stats.distance ? Math.round(p.stats.distance) + "m" : "N/A"} | MaxSpeed: ${p.stats.maxSpeed ? p.stats.maxSpeed.toFixed(1) + "km/h" : "N/A"} | Position Fit: ${p.stats.suitability ?? "N/A"}%`
              : " | No stats available"
          }`
      )
      .join("\n");

    const prompt = `Analyze this football formation and provide tactical feedback.

FORMATION: ${formation}
${opponentFormation ? `OPPONENT FORMATION: ${opponentFormation}` : ""}

PLAYERS IN POSITION:
${playerLines}

Return a JSON object (no markdown wrapping, just raw JSON) with this EXACT structure:
{
  "strengths": ["strength 1", "strength 2", ...],
  "vulnerabilities": ["vulnerability 1", ...],
  "playerFitScores": [
    {"name": "Player Name", "position": "POS", "score": 85, "note": "Brief reason"}
  ],
  "adjustments": ["suggestion 1", ...],
  "counterFormations": ["4-4-2 would exploit the wide spaces because...", ...],
  "summary": "One paragraph overall tactical assessment"
}

Rules:
- strengths: 3-5 tactical strengths of this formation with these specific players
- vulnerabilities: 2-4 exposed zones or tactical weaknesses, referencing specific positions
- playerFitScores: for each of the 11 players, a score 0-100 of how well they fit that specific role considering their natural position, fitness (ACWR, TRIMP, recovery data), and physical profile. Flag any player with red/amber risk who shouldn't be playing at full intensity
- adjustments: 2-4 specific changes the coach could make (position swaps, role tweaks, player substitutions)
- counterFormations: 2-3 formations opponents might use against this setup and why they'd be effective
- summary: concise overall assessment in 2-3 sentences

Be specific. Reference actual player names, numbers, and data. If a player has a high ACWR or red risk flag, flag it prominently in the analysis.`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system:
        "You are Coach M8 AI, an elite football tactical analyst for youth academy football. You analyze formations, player fitness data, and tactical matchups. Be specific, data-driven, and practical. Always consider youth development alongside winning.",
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const rawText = textBlock?.text ?? "{}";

    // Parse JSON (handle potential markdown wrapping)
    let jsonStr = rawText.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr
        .replace(/^```(?:json)?\n?/, "")
        .replace(/\n?```$/, "");
    }

    const analysis = JSON.parse(jsonStr);

    // Build markdown version for export
    const markdown = [
      `## Tactical Analysis: ${formation}`,
      opponentFormation ? `**vs ${opponentFormation}**\n` : "",
      "### Strengths",
      ...(analysis.strengths ?? []).map((s: string) => `- ${s}`),
      "",
      "### Vulnerabilities",
      ...(analysis.vulnerabilities ?? []).map((v: string) => `- ${v}`),
      "",
      "### Player Fit Scores",
      ...(analysis.playerFitScores ?? []).map(
        (p: any) => `- **${p.position} ${p.name}**: ${p.score}/100 — ${p.note}`
      ),
      "",
      "### Suggested Adjustments",
      ...(analysis.adjustments ?? []).map((a: string, i: number) => `${i + 1}. ${a}`),
      "",
      "### Counter-Formations to Watch",
      ...(analysis.counterFormations ?? []).map((c: string) => `- ${c}`),
      "",
      "### Summary",
      analysis.summary ?? "",
    ].join("\n");

    return NextResponse.json({ analysis, markdown });
  } catch (error) {
    console.error("Tactic analysis error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Tactical analysis failed",
      },
      { status: 500 }
    );
  }
}
