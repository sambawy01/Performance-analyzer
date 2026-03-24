import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SQUAD_SYSTEM_PROMPT = `You are an elite football performance analyst and squad selector at Coach M8, an AI-powered sports analytics platform for youth football academies.

Your job is to recommend the optimal starting XI, bench, and substitution timing based on player fitness data, load management, and tactical needs.

Key metrics:
- ACWR (Acute:Chronic Workload Ratio): Optimal 0.8-1.3. Caution 1.3-1.5. Danger >1.5. Below 0.8 = undertrained.
- TRIMP: Training Impulse — HR-based session load score.
- Risk flags: green (safe), blue (low load), amber (caution), red (danger — DO NOT start).

Rules:
- NEVER start a player with red risk flag
- Prefer green/blue ACWR players in key positions
- Consider position coverage — each formation slot needs a player who can play that role
- Amber players can start but recommend early substitution (before 60')
- Provide specific reasoning for each selection referencing data`;

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
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    // Fetch all active players filtered by academy_id
    const { data: players } = await supabase
      .from("players")
      .select("id, name, position, jersey_number, status")
      .eq("academy_id", profile.academy_id)
      .eq("status", "active")
      .order("jersey_number", { ascending: true });

    if (!players || players.length === 0) {
      return NextResponse.json(
        { error: "No active players found" },
        { status: 400 }
      );
    }

    const playerIds = players.map((p) => p.id);

    // Fetch latest load records
    const { data: loadRecords } = await supabase
      .from("load_records")
      .select("player_id, acwr_ratio, risk_flag, acute_load_7d, chronic_load_28d, date")
      .in("player_id", playerIds)
      .order("date", { ascending: false });

    const loadMap = new Map<string, (typeof loadRecords extends (infer T)[] | null ? T : never)>();
    if (loadRecords) {
      for (const lr of loadRecords) {
        if (!loadMap.has(lr.player_id)) {
          loadMap.set(lr.player_id, lr);
        }
      }
    }

    // Fetch latest wearable metrics
    const { data: wearableMetrics } = await supabase
      .from("wearable_metrics")
      .select("player_id, hr_avg, hr_max, trimp_score, hr_recovery_60s")
      .in("player_id", playerIds)
      .order("created_at", { ascending: false });

    const metricsMap = new Map<string, (typeof wearableMetrics extends (infer T)[] | null ? T : never)>();
    if (wearableMetrics) {
      for (const wm of wearableMetrics) {
        if (!metricsMap.has(wm.player_id)) {
          metricsMap.set(wm.player_id, wm);
        }
      }
    }

    // Build player data string for Claude
    const playerDataStr = players
      .map((p) => {
        const load = loadMap.get(p.id);
        const metrics = metricsMap.get(p.id);
        return `- #${p.jersey_number} ${p.name} (${p.position}) | ACWR: ${load?.acwr_ratio?.toFixed(2) ?? "N/A"} (${load?.risk_flag ?? "unknown"}) | Acute: ${load?.acute_load_7d?.toFixed(0) ?? "N/A"} | Chronic: ${load?.chronic_load_28d?.toFixed(0) ?? "N/A"} | HR avg: ${metrics?.hr_avg ?? "N/A"} | TRIMP: ${metrics?.trimp_score?.toFixed(0) ?? "N/A"} | Recovery: ${metrics?.hr_recovery_60s ?? "N/A"} bpm`;
      })
      .join("\n");

    const prompt = `Select the optimal squad for this match:

FORMATION: ${formation}
OPPONENT: ${opponent || "Unknown"}
MATCH DATE: ${matchDate}

AVAILABLE PLAYERS:
${playerDataStr}

Return a JSON object (no markdown, just raw JSON) with this exact structure:
{
  "startingXI": [
    {"playerId": "uuid", "name": "Player Name", "jersey": 10, "position": "CAM", "reason": "Why selected"}
  ],
  "bench": [
    {"playerId": "uuid", "name": "Player Name", "jersey": 10, "position": "CM"}
  ],
  "excluded": [
    {"playerId": "uuid", "name": "Player Name", "jersey": 10, "reason": "Red ACWR 1.62"}
  ],
  "subTiming": [
    {"minute": 60, "playerOut": "Player A", "playerIn": "Player B", "reason": "Load management"}
  ],
  "reasoning": "Overall tactical reasoning for these selections"
}

Rules:
- startingXI must have exactly 11 players matching the ${formation} formation
- bench should have up to 7 players
- excluded = players with red risk flag or those you deem unfit
- Provide specific data-backed reasons for each starter
- Order bench by priority (first sub = most likely to come on)
- subTiming = recommended substitutions with minute marks
- Use the actual player IDs from the data above`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system: SQUAD_SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const rawText = textBlock?.text ?? "{}";

    // Parse JSON from response (handle potential markdown wrapping)
    let jsonStr = rawText.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const recommendation = JSON.parse(jsonStr);

    return NextResponse.json(recommendation);
  } catch (error) {
    console.error("Squad recommendation error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate recommendation",
      },
      { status: 500 }
    );
  }
}
