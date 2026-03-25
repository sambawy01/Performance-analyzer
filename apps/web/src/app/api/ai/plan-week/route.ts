import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPTS } from "@/lib/ai/prompts";
import { enrichSquadContext } from "@/lib/ai/enrich-context";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const { weekStart, matchSchedule } = await request.json();

    if (!weekStart || typeof weekStart !== "string") {
      return NextResponse.json({ error: "weekStart is required" }, { status: 400 });
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

    // Fetch full squad data for enriched context
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

    // Build the 7 dates for the week
    const startDate = new Date(weekStart + "T00:00:00");
    const weekDates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      weekDates.push(d.toISOString().split("T")[0]);
    }

    const matchInfo =
      matchSchedule && matchSchedule.length > 0
        ? matchSchedule
            .map((m: { date: string; opponent: string }) => `Match on ${m.date} vs ${m.opponent}`)
            .join("; ")
        : "No matches scheduled this week";

    const systemPrompt = `${SYSTEM_PROMPTS.BASE_ANALYST}\n\n${SYSTEM_PROMPTS.WEEKLY_PLAN}\n\nYou respond ONLY with valid JSON. No markdown, no explanation, no code blocks.`;

    const prompt = `Generate an optimal 7-day microcycle training plan using the WEEKLY PLAN periodization framework.

WEEK: ${weekDates[0]} (Monday) to ${weekDates[6]} (Sunday)
MATCH SCHEDULE: ${matchInfo}

${enrichedContext}

Apply the microcycle design principles:
1. Weekly TRIMP target: 500-700 for U14-U16
2. Never 2 consecutive high-intensity days
3. Proper taper if match is scheduled (MD-3 last high session, MD-2 medium, MD-1 activation only)
4. At least 1 full rest day
5. ACWR management: flag specific players with >1.3 for rest/modification on specific days
6. Load monitoring checkpoints on Monday AM, Wednesday PM, Friday AM

Respond ONLY with a valid JSON object in this exact format:
{
  "days": [
    {
      "date": "${weekDates[0]}",
      "type": "training",
      "intensity": "medium",
      "duration": 75,
      "location": "October",
      "time": "4:00 PM",
      "focus": "Pressing triggers and defensive shape",
      "expectedTrimp": "80-120",
      "targetZones": "Z2-Z3 dominant, 15-20% Z4",
      "restPlayers": [{"jerseyNumber": 8, "name": "Player Name", "reason": "ACWR 1.52 — Phase 4 Danger, recovery only"}],
      "modifiedPlayers": [{"jerseyNumber": 5, "name": "Player Name", "modification": "Cap at 60 min, no Z5 work, ACWR 1.35"}],
      "notes": "Focus on compact defensive block. MD-4 session in microcycle.",
      "availablePlayers": 19,
      "predictedReadiness": 78
    }
  ],
  "summary": "Overview citing specific TRIMP targets, ACWR management decisions, and periodization rationale",
  "totalLoad": 450,
  "sessionsPlanned": 5,
  "weeklyTrimpTarget": "500-700",
  "playersNeedingRest": [{"jerseyNumber": 8, "name": "Player Name", "reason": "ACWR 1.52 — must drop below 1.3 before full training. Rest Mon-Wed, reassess Thu."}],
  "predictedEndOfWeekACWR": 1.15,
  "loadCheckpoints": ["Monday AM: review weekend load, update ACWR", "Wednesday PM: mid-week check, adjust Thursday if needed", "Friday AM: final readiness assessment"],
  "aiCommentary": "Detailed periodization analysis citing Banister model, ACWR trajectory projections, and youth-specific load management"
}

Rules:
- "type" must be one of: "training", "match", "recovery", "rest"
- "intensity" must be one of: "high", "medium", "low", "recovery", "match"
- Each day in the week (${weekDates.join(", ")}) MUST be included
- Rest days: type "rest", intensity "recovery", duration 0
- Match days: type "match", intensity "match"
- Location options: "October", "New Cairo", "Maadi", "HQ"
- Use REAL player names and jersey numbers
- predictedReadiness is 0-100
- Reference specific ACWR values and Gabbett thresholds in reasons

Return ONLY the JSON, no markdown, no explanation.`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2500,
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = response.content.find((b) => b.type === "text") as
      | { type: "text"; text: string }
      | undefined;

    if (!textBlock) {
      return NextResponse.json({ error: "No response from AI" }, { status: 500 });
    }

    let jsonText = textBlock.text.trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const plan = JSON.parse(jsonText);
    return NextResponse.json(plan);
  } catch (error) {
    console.error("AI plan-week error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate plan" },
      { status: 500 }
    );
  }
}
