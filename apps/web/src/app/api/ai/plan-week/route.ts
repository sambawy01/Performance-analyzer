import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildFullContext } from "@/lib/ai/build-context";

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
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    // Build full context
    const fullContext = await buildFullContext(profile.academy_id);

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
            .map(
              (m: { date: string; opponent: string }) =>
                `Match on ${m.date} vs ${m.opponent}`
            )
            .join("; ")
        : "No matches scheduled this week";

    const prompt = `You are an elite football performance analyst. Generate an optimal 7-day training plan for this academy.

WEEK: ${weekDates[0]} (Monday) to ${weekDates[6]} (Sunday)
MATCH SCHEDULE: ${matchInfo}

${fullContext}

Generate a training plan as a JSON object. Consider:
1. ACWR management - players in red/amber need reduced load
2. Match preparation - taper intensity before match days
3. Recovery after matches
4. Progressive overload principles for youth development
5. At least 1 rest day per week
6. Tactical focus areas based on recent session analysis

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
      "restPlayers": [{"jerseyNumber": 8, "name": "Player Name", "reason": "ACWR 1.52"}],
      "notes": "Focus on compact defensive block",
      "availablePlayers": 19,
      "predictedReadiness": 78
    }
  ],
  "summary": "Brief overview of the week plan",
  "totalLoad": 450,
  "sessionsPlanned": 5,
  "playersNeedingRest": [{"jerseyNumber": 8, "name": "Player Name", "reason": "High ACWR"}],
  "predictedEndOfWeekACWR": 1.15,
  "aiCommentary": "Detailed analysis of why this plan optimizes performance while managing load"
}

Rules for the JSON:
- "type" must be one of: "training", "match", "recovery", "rest"
- "intensity" must be one of: "high", "medium", "low", "recovery", "match"
- Each day in the week (${weekDates.join(", ")}) MUST be included
- Rest days should have type "rest", intensity "recovery", duration 0
- Match days should have type "match", intensity "match"
- Location options: "October", "New Cairo", "Maadi", "HQ"
- Use REAL player names and jersey numbers from the data
- predictedReadiness is 0-100 based on team load state
- totalLoad is sum of session durations weighted by intensity

Return ONLY the JSON, no markdown, no explanation.`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system:
        "You are a sports science AI. You respond ONLY with valid JSON. No markdown, no explanation, no code blocks.",
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = response.content.find((b) => b.type === "text") as
      | { type: "text"; text: string }
      | undefined;

    if (!textBlock) {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      );
    }

    // Parse JSON from the response — strip any markdown fences if present
    let jsonText = textBlock.text.trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText
        .replace(/^```(?:json)?\n?/, "")
        .replace(/\n?```$/, "");
    }

    const plan = JSON.parse(jsonText);

    return NextResponse.json(plan);
  } catch (error) {
    console.error("AI plan-week error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to generate plan",
      },
      { status: 500 }
    );
  }
}
