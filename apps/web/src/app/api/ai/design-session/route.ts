import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPTS } from "@/lib/ai/prompts";
import { enrichSquadContext } from "@/lib/ai/enrich-context";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const { type, playerCount, duration, focus, notes } = await request.json();

    if (!type || typeof type !== "string") {
      return NextResponse.json({ error: "type is required" }, { status: 400 });
    }
    if (!playerCount || typeof playerCount !== "number" || playerCount < 1) {
      return NextResponse.json({ error: "playerCount is required and must be a positive number" }, { status: 400 });
    }
    if (!duration || typeof duration !== "number" || duration < 1) {
      return NextResponse.json({ error: "duration is required and must be a positive number" }, { status: 400 });
    }
    if (!focus || typeof focus !== "string") {
      return NextResponse.json({ error: "focus is required" }, { status: 400 });
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

    const systemPrompt = `${SYSTEM_PROMPTS.BASE_ANALYST}\n\n${SYSTEM_PROMPTS.SESSION_DESIGN}`;

    const warmUpMins = Math.round(duration * 0.2);
    const mainMins = Math.round(duration * 0.6);
    const coolDownMins = Math.round(duration * 0.2);

    const prompt = `Design a ${type} training session using the block periodization framework and load-aware modifications:

SESSION PARAMETERS:
- Type: ${type}
- Players: ${playerCount}
- Duration: ${duration} minutes (Warm-up: ${warmUpMins}min, Main: ${mainMins}min, Cool-down: ${coolDownMins}min)
- Focus: ${focus}
${notes ? `- Coach's notes: ${notes}` : ""}

${enrichedContext}

Using the squad data above (especially current ACWR status and injury risk flags), design a complete session plan following the SESSION DESIGN framework:

## Session Overview
- Target HR zones and expected intensity classification
- Where this session fits in the block periodization cycle
- Key objective in one sentence

## Warm-Up (${warmUpMins} minutes)
Phase 1: General activation (describe drill with exact setup)
Phase 2: Football-specific activation (describe drill with exact setup)
Target HR: Z1-Z2, progressing to Z3

## Main Phase (${mainMins} minutes)
2-3 drills focused on ${focus}. For EACH drill specify:
- **Drill Name**
- Setup: exact dimensions (e.g., 30x20m), player numbers, equipment needed
- Rules: how it works, scoring system, progressions (easy → hard)
- Duration: minutes and reps/sets
- Work-to-rest ratio (based on target intensity zone)
- Coaching points: 3 specific technical/tactical cues
- Expected HR zone

## Cool-Down (${coolDownMins} minutes)
Recovery activities with low-intensity technical work

## Player Modifications
List EVERY player with ACWR >1.3 and specify their exact modifications:
- What they should skip or modify
- Their max duration and HR ceiling
- Alternative activities if excluded from main drills

## Expected Load Profile
- Expected TRIMP range for the full session
- Target zone distribution (% in each zone)
- Z4+Z5 target percentage
- Load impact on squad ACWR trajectory

Be specific and practical. Every drill must have exact dimensions, player numbers, rules, and coaching points.`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2500,
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const plan = textBlock?.text ?? "Unable to generate session plan.";

    return NextResponse.json({ plan });
  } catch (error) {
    console.error("Session design error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to design session" },
      { status: 500 }
    );
  }
}
