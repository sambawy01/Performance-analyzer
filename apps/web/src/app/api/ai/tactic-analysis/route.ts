import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPTS } from "@/lib/ai/prompts";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const { formation, players, opponentFormation } = await request.json();

    if (!formation || typeof formation !== "string") {
      return NextResponse.json({ error: "formation is required" }, { status: 400 });
    }
    if (!players || !Array.isArray(players)) {
      return NextResponse.json({ error: "players array is required" }, { status: 400 });
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

    const systemPrompt = `${SYSTEM_PROMPTS.BASE_ANALYST}\n\n${SYSTEM_PROMPTS.TACTICAL_ANALYSIS}`;

    const prompt = `Analyze this football formation using the 4 phases of play framework (Juego de Posicion):

FORMATION: ${formation}
${opponentFormation ? `OPPONENT FORMATION: ${opponentFormation}` : ""}

PLAYERS IN POSITION:
${playerLines}

Apply the TACTICAL ANALYSIS framework:
1. In Possession: positional structure, build-up patterns, width/depth
2. Out of Possession: pressing intensity, defensive shape, compactness
3. Negative Transition: counter-pressing approach, vulnerability windows
4. Positive Transition: break speed, who makes the runs

For each player, calculate a Formation Fit Score (0-100) using:
- Natural position match (+40 primary, +25 secondary, +10 unfamiliar)
- Physical profile match (sprint data for wingers, endurance for CMs, etc.)
- Current fitness (ACWR and recovery data)
- Recent form (TRIMP vs baseline)

Return a JSON object (no markdown wrapping, just raw JSON) with this EXACT structure:
{
  "inPossession": "2-3 sentences analyzing build-up play and positional structure with these specific players",
  "outOfPossession": "2-3 sentences on defensive shape, pressing triggers, and compactness",
  "transitions": "2-3 sentences on both positive and negative transitions",
  "strengths": ["strength 1 with specific player references and data", "strength 2", ...],
  "vulnerabilities": ["vulnerability 1 referencing specific positional gaps", ...],
  "playerFitScores": [
    {"name": "Player Name", "position": "POS", "score": 85, "note": "Natural CM, ACWR 1.05 (green), highest distance in squad at 6800m. Strong positional fit."}
  ],
  "adjustments": ["suggestion 1 with tactical reasoning", ...],
  "counterFormations": ["4-4-2 would exploit the half-spaces because...", ...],
  "summary": "One paragraph overall tactical assessment referencing both tactical principles and player fitness data"
}

Rules:
- strengths: 3-5 tactical strengths referencing specific players, their data, and positional play principles
- vulnerabilities: 2-4 exposed zones, referencing specific positions and player limitations
- playerFitScores: for EACH of the 11 players. Flag any player with amber/red ACWR prominently.
- adjustments: 2-4 specific changes with tactical reasoning
- counterFormations: 2-3 with explanations
- summary: concise, data-backed, 2-3 sentences`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2500,
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const rawText = textBlock?.text ?? "{}";

    let jsonStr = rawText.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const analysis = JSON.parse(jsonStr);

    // Build markdown version for export
    const markdown = [
      `## Tactical Analysis: ${formation}`,
      opponentFormation ? `**vs ${opponentFormation}**\n` : "",
      "### In Possession",
      analysis.inPossession ?? "",
      "",
      "### Out of Possession",
      analysis.outOfPossession ?? "",
      "",
      "### Transitions",
      analysis.transitions ?? "",
      "",
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
      { error: error instanceof Error ? error.message : "Tactical analysis failed" },
      { status: 500 }
    );
  }
}
