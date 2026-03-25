import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPTS } from "@/lib/ai/prompts";
import { enrichSquadContext } from "@/lib/ai/enrich-context";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const { formation, opponent, matchDate } = await request.json();

    if (!formation || typeof formation !== "string") {
      return NextResponse.json({ error: "formation is required" }, { status: 400 });
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
      .select("academy_id, name, role")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Fetch all squad data for enriched context
    const [playersRes, metricsRes, cvRes, loadRes, sessionsRes, tacticalRes] = await Promise.all([
      supabase.from("players").select("*").eq("academy_id", profile.academy_id).eq("status", "active").order("jersey_number"),
      supabase.from("wearable_metrics").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("cv_metrics").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("load_records").select("*").order("date", { ascending: false }).limit(500),
      supabase.from("sessions").select("*").eq("academy_id", profile.academy_id).order("date", { ascending: false }).limit(20),
      supabase.from("tactical_metrics").select("*").limit(20),
    ]);

    const players = playersRes.data ?? [];
    if (players.length === 0) {
      return NextResponse.json({ error: "No active players found" }, { status: 400 });
    }

    const playerIds = players.map((p: any) => p.id);
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

    const systemPrompt = `${SYSTEM_PROMPTS.BASE_ANALYST}\n\n${SYSTEM_PROMPTS.MATCH_READINESS}`;

    const prompt = `Select the optimal squad for this match using the MATCH READINESS framework:

FORMATION: ${formation}
OPPONENT: ${opponent || "Unknown"}
MATCH DATE: ${matchDate}

${enrichedContext}

Apply the supercompensation model and readiness scoring (ACWR Status 30pts, Recovery Quality 25pts, Taper Compliance 20pts, Fatigue Accumulation 15pts, Training Consistency 10pts) to rank every player.

Return a JSON object (no markdown, just raw JSON) with this exact structure:
{
  "startingXI": [
    {"playerId": "uuid", "name": "Player Name", "jersey": 10, "position": "CAM", "readinessScore": 82, "reason": "ACWR 1.05 (green), HRR60 35 bpm, well-tapered. Scored 82/100 on readiness rubric."}
  ],
  "bench": [
    {"playerId": "uuid", "name": "Player Name", "jersey": 10, "position": "CM", "readinessScore": 75}
  ],
  "excluded": [
    {"playerId": "uuid", "name": "Player Name", "jersey": 10, "reason": "Red ACWR 1.62 — 4-5x injury risk. Must not play per Gabbett protocol."}
  ],
  "subTiming": [
    {"minute": 60, "playerOut": "Player A", "playerIn": "Player B", "reason": "Load management — Player A's ACWR at 1.35, limit to 60 min exposure"}
  ],
  "taperAssessment": "Was the team well-tapered for this match? Reference last 48h training load.",
  "reasoning": "Overall tactical and fitness reasoning for these selections, citing specific readiness scores and ACWR values"
}

Rules:
- startingXI must have exactly 11 players matching the ${formation} formation
- NEVER start a player with red risk flag — they go in excluded with specific data reason
- Amber players can start but MUST have sub timing before 60'
- bench should have up to 7 players ordered by priority
- Calculate readiness scores using the rubric (max 100)
- Reference CNS readiness, glycogen estimation, and nervous system recovery
- Use the actual player IDs from the data above`;

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

    const recommendation = JSON.parse(jsonStr);
    return NextResponse.json(recommendation);
  } catch (error) {
    console.error("Squad recommendation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate recommendation" },
      { status: 500 }
    );
  }
}
