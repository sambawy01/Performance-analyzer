import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Anthropic from "@anthropic-ai/sdk";
import { buildFullContext } from "@/lib/ai/build-context";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Phase 1: Deep Research via direct API with web_search ───
async function deepResearchOpponent(opponent: string): Promise<string> {
  const researchPrompt = `You are a football intelligence researcher. Use web search extensively to gather real, current information about "${opponent}".

Search for ALL of the following — run each search:
1. "${opponent} football club" — identity, league, city
2. "${opponent} results 2025 2026 scores" — recent match results
3. "${opponent} squad players roster" — current squad
4. "${opponent} formation tactics" — playing style
5. "${opponent} coach manager" — coaching staff
6. "${opponent} news transfers injuries" — latest news

After searching, compile ALL findings into a structured intelligence brief. Include real names, real scores, real dates. Cite what you found.`;

  // Use direct API call with proper headers for web search
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2025-03-05",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      tools: [
        {
          type: "web_search_20250305",
          name: "web_search",
          max_uses: 20,
        },
      ],
      messages: [
        { role: "user", content: researchPrompt },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Web search API error:", err);
    // Fallback to regular Claude without web search
    return fallbackResearch(opponent);
  }

  const data = await res.json();
  const textParts: string[] = [];
  for (const block of data.content ?? []) {
    if (block.type === "text") {
      textParts.push(block.text);
    }
  }

  const result = textParts.join("\n\n");
  if (!result || result.length < 200) {
    return fallbackResearch(opponent);
  }
  return result;
}

// Fallback if web search fails — use Claude's training knowledge
async function fallbackResearch(opponent: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 3000,
    messages: [
      {
        role: "user",
        content: `You are a football encyclopedia. Provide EVERYTHING you know about "${opponent}" as a football team/club.

Include:
- Full name, city, country, league
- Founded, stadium, colors
- Current/recent head coach
- Historical achievements and recent season performance
- Typical formation and playing style
- Notable players (current and recent)
- Youth academy reputation
- Strengths and weaknesses
- Any other relevant context

This is for a pre-match scouting report. Be as detailed and specific as possible. If this is an Egyptian team, include context about Egyptian football league structure.`,
      },
    ],
  });

  const text = response.content.find((b) => b.type === "text");
  return text?.text ?? `Limited information available about ${opponent}.`;
}

// ─── Phase 2: Report Generation ───
async function generateScoutReport(
  opponent: string,
  matchDate: string,
  research: string,
  squadContext: string
): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 6000,
    system: `You are an elite football intelligence analyst at Coach M8. You write professional scouting dossiers.

You receive detailed research about the opponent and your own squad data. Synthesize everything into an actionable pre-match dossier. Use real names, real scores, real data from the research. Be specific and decisive.

Format with ## headers. Bold key names and numbers. Use bullet points for lists.`,
    messages: [
      {
        role: "user",
        content: `Write a comprehensive OPPONENT SCOUT DOSSIER for our match vs **${opponent}** on ${matchDate}.

=== OPPONENT RESEARCH ===
${research}

=== OUR SQUAD DATA ===
${squadContext.substring(0, 4000)}

Sections (use ## headers):

## Opponent Profile
Full name, city, league. Head coach. Current season record. Overall threat level (1-10).

## Recent Form & Results
Last 5-10 matches with actual scores and opponents. Win rate. Goals per game. Form trajectory.

## Formation & System of Play
Primary formation. Build-up patterns. Pressing style. Transition speed. Set piece approach.

## Key Threats — Players to Neutralize
4-6 key players: name, position, what makes them dangerous, how to stop them.

## Tactical Strengths
What they do best. Dangerous patterns. Set piece threat.

## Exploitable Weaknesses
Specific vulnerabilities. Defensive gaps. Zones to target.

## Game Plan — How We Beat ${opponent}
Our formation, tactical instructions for each phase. Key matchups from our squad.

## Recommended Starting XI
Our best 11 for this matchup with specific roles and instructions.

## Set Piece Blueprint
Attacking/defending corners, free kicks. Who takes, who marks.

## Plan B — In-Game Adjustments
0-0 at 60', 1-0 down, and leading scenarios with specific subs.

## Match Intelligence Summary
Difficulty (1-10). Top 3 things the squad must know. Pre-match message.

Make every recommendation reference specific data from the research.`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock?.text ?? "Unable to generate scout report.";
}

export async function POST(request: NextRequest) {
  try {
    const { opponent, matchDate } = await request.json();

    if (!opponent || !matchDate) {
      return NextResponse.json(
        { error: "opponent and matchDate required" },
        { status: 400 }
      );
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
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("users")
      .select("academy_id")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    // Phase 1 + Squad context in parallel
    const [research, squadContext] = await Promise.all([
      deepResearchOpponent(opponent),
      buildFullContext(profile.academy_id),
    ]);

    // Phase 2: Generate dossier
    const report = await generateScoutReport(opponent, matchDate, research, squadContext);

    return NextResponse.json({ report });
  } catch (error) {
    console.error("Scout report error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate report" },
      { status: 500 }
    );
  }
}
