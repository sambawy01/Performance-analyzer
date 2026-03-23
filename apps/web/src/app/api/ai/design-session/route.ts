import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Anthropic from "@anthropic-ai/sdk";
import { buildFullContext } from "@/lib/ai/build-context";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SESSION_DESIGN_SYSTEM_PROMPT = `You are an elite youth football coach and sports scientist at Coach M8. You design training sessions that are periodized, load-aware, and tactically purposeful.

You understand:
- Session structure: warm-up, activation, main phase, cool-down
- Youth development principles: fun, age-appropriate, skill-focused
- Load management: players with high ACWR need modified intensity or rest
- Drill design: space dimensions, player numbers, rules, progressions
- Intensity zones: aerobic base (Z2-Z3), threshold work (Z4), anaerobic (Z5)

Your session plans are detailed, practical, and immediately usable by a coach on the training pitch.`;

export async function POST(request: NextRequest) {
  try {
    const { type, playerCount, duration, focus, notes } = await request.json();

    if (!type || !playerCount || !duration || !focus) {
      return NextResponse.json({ error: "type, playerCount, duration, and focus are required" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(c) { try { c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {} },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("users")
      .select("academy_id")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const context = await buildFullContext(profile.academy_id);

    const prompt = `Design a ${type} training session for ${playerCount} U16 players, ${duration} minutes, focused on ${focus}.
${notes ? `\nCoach's additional notes: ${notes}` : ""}

${context}

Using the team data above (especially current ACWR load status and injury risk flags), design a complete session plan with these sections (use ## headers):

## Session Overview
- Type: ${type} | Duration: ${duration} min | Players: ${playerCount} | Focus: ${focus}
- Expected intensity: which HR zones to target
- Key objective in one sentence

## Warm-Up (${Math.round(parseInt(duration) * 0.2)} minutes)
Describe 2 warm-up activities. For each: drill name, setup (space dimensions, number of players), rules, duration. Start with dynamic movement, progress to football-specific activation.

## Main Phase (${Math.round(parseInt(duration) * 0.6)} minutes)
Describe 2-3 main drills focused on ${focus}. For each drill:
- **Drill Name**
- Setup: dimensions (e.g. 30x20m), player numbers, equipment
- Rules: how it works, scoring, progressions
- Duration and reps
- Coaching points: 2-3 key technical/tactical cues
- Expected intensity zone

## Cool-Down (${Math.round(parseInt(duration) * 0.2)} minutes)
Appropriate recovery activities. Include technical work at low intensity.

## Player Modifications
Based on ACWR data above, list specific players who should have modified involvement (reduced intensity, limited sprinting, or excluded from high-intensity drills). Reference their ACWR and risk flag.

## Expected Load Profile
- Expected TRIMP range for this session
- Which HR zones should players spend most time in
- Any load concerns based on current team state

Be specific and practical. Use real dimensions, real drill names, specific coaching cues. This should be immediately usable by a coach.`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1800,
      system: SESSION_DESIGN_SYSTEM_PROMPT,
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
