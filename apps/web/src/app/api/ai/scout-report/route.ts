import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Anthropic from "@anthropic-ai/sdk";
import { buildFullContext } from "@/lib/ai/build-context";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SCOUT_SYSTEM_PROMPT = `You are an elite football performance analyst and tactical director at Coach M8, an AI-powered sports analytics platform for youth football academies.

You have deep knowledge of football tactics, youth player development, and data-driven team management. Your analysis is specific, actionable, and grounded in the data provided.

Write like a professional analyst preparing a pre-match brief for a head coach. Be decisive — give clear recommendations, not hedged suggestions.`;

export async function POST(request: NextRequest) {
  try {
    const { opponent, matchDate } = await request.json();

    if (!opponent || !matchDate) {
      return NextResponse.json({ error: "opponent and matchDate required" }, { status: 400 });
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

    const prompt = `Generate a pre-match scout report for our U16 team vs ${opponent} on ${matchDate}.

${context}

Based on our recent performance data above, provide a comprehensive pre-match report with these sections (use ## headers):

## Tactical Plan
Recommended formation and system of play. Justify based on our squad's strengths and recent form. Address how we counter the opponent.

## Recommended Starting XI
List the 11 players who should start. For each, state: position, name, why they start (referencing ACWR, recent form, load status). Flag any amber/red players to bench.

## Key Players to Watch
3-4 of our players who will be most influential. Reference specific data points — their recent TRIMP scores, HR efficiency, sprint counts.

## Set Piece Strategy
Attacking and defensive set piece recommendations. Which players should take corners/free kicks based on dominant foot and physical data.

## In-Game Plan B
If 0-0 at 60 minutes or 1-0 down, what tactical adjustments and substitutions should the coach make? Name specific players.

## Load Management Notes
Any players who need minutes restrictions or should not play 90 minutes based on their ACWR data. Be specific.

Be direct and specific. Reference player names and numbers. This is a brief for the head coach, not a generic analysis.`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1800,
      system: SCOUT_SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const report = textBlock?.text ?? "Unable to generate scout report.";

    return NextResponse.json({ report });
  } catch (error) {
    console.error("Scout report error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate report" },
      { status: 500 }
    );
  }
}
