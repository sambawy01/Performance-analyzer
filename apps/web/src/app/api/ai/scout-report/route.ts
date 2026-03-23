import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Anthropic from "@anthropic-ai/sdk";
import { buildFullContext } from "@/lib/ai/build-context";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Phase 1: Deep Research Agent ───
// Runs an exhaustive web research session focused purely on gathering opponent intel.
// This is a SEPARATE call from the report generation — research first, write second.
async function deepResearchOpponent(opponent: string): Promise<string> {
  const researchPrompt = `You are a football intelligence researcher. Your ONLY job is to gather as much factual information as possible about "${opponent}" using web search.

DO NOT write a report. Just search and compile raw intelligence.

Run these searches systematically. After each search, extract key facts and move to the next:

BATCH 1 — Identity & Background:
- "${opponent}" official website
- "${opponent}" football club Wikipedia
- "${opponent}" نادي كرة القدم (Arabic)

BATCH 2 — Recent Results & Form:
- "${opponent}" results 2025 2026
- "${opponent}" latest match score
- "${opponent}" season standings table
- "${opponent}" recent form last 10 matches

BATCH 3 — Squad & Players:
- "${opponent}" squad roster 2025-2026
- "${opponent}" best players key players
- "${opponent}" top scorer assists
- "${opponent}" new signings transfers

BATCH 4 — Tactics & Style:
- "${opponent}" formation tactics analysis
- "${opponent}" playing style coach philosophy
- "${opponent}" defensive record goals conceded

BATCH 5 — Youth & Academy (if relevant):
- "${opponent}" youth academy U16 U18
- "${opponent}" academy players prospects

BATCH 6 — News & Intelligence:
- "${opponent}" latest news injuries suspensions
- "${opponent}" press conference coach quotes

After ALL searches, compile your findings into a structured intelligence dossier with these sections:
- IDENTITY: Full name, city, country, founded, stadium, league, current standing
- COACH: Name, nationality, tenure, tactical philosophy
- RECENT RESULTS: Last 10 matches with dates, opponents, scores
- SQUAD: Key players with positions, ages, stats if found
- FORMATION: Primary formation, variations, playing style details
- STRENGTHS: What they do well based on evidence
- WEAKNESSES: Where they struggle based on evidence
- NEWS: Recent injuries, suspensions, transfers, drama
- SOURCES: List URLs you found information from

Be thorough. Include EVERYTHING you find. Raw facts only — no opinions yet.`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8000,
    tools: [
      {
        type: "web_search_20250305",
        name: "web_search",
        max_uses: 25,
      } as any,
    ],
    messages: [{ role: "user", content: researchPrompt }],
  });

  const textParts: string[] = [];
  for (const block of response.content) {
    if (block.type === "text") {
      textParts.push(block.text);
    }
  }

  return textParts.join("\n\n") || `Limited research found for ${opponent}.`;
}

// ─── Phase 2: Report Generation ───
// Takes the raw research + our squad data and generates the final tactical dossier.
async function generateScoutReport(
  opponent: string,
  matchDate: string,
  research: string,
  squadContext: string
): Promise<string> {
  const systemPrompt = `You are an elite football intelligence analyst at Coach M8. You write professional scouting dossiers for youth football academies.

You receive:
1. Detailed web research about the opponent (real data from the internet)
2. Your own team's squad data

Your job: synthesize the research into an actionable pre-match dossier. Every claim must be grounded in the research provided. Be specific — use real names, real scores, real stats. This document should be good enough for a head coach to brief the entire squad.

If the research found specific results, cite them. If specific players were identified, name them with positions and what makes them dangerous. If tactical patterns were found, describe them in detail.

Format with ## headers. Use bold for emphasis. Use bullet points for lists.`;

  const prompt = `Write a comprehensive OPPONENT SCOUT DOSSIER for our match vs **${opponent}** on ${matchDate}.

=== OPPONENT RESEARCH (from web search) ===
${research}

=== OUR SQUAD DATA ===
${squadContext.substring(0, 4000)}

Generate the full report with these sections:

## Opponent Profile
Full name, city, league, stadium. Current season record. Head coach and their philosophy. Overall threat level (1-10).

## Recent Form & Results
Last 5-10 matches with actual scores and opponents. Win rate. Goals per game. Home/away split. Form trajectory (improving/declining/stable).

## Formation & System of Play
Primary formation with diagram description. Build-up play patterns. Pressing triggers and defensive shape. Transition speed. Width vs central play preference.

## Key Threats — Players to Neutralize
For each key player (4-6): name, #number if known, position, key attributes, specific danger they pose, and EXACT instructions for our player marking them.

## Tactical Strengths
What they do best. Specific patterns that lead to chances/goals. Set piece threat assessment. Which areas of the pitch they dominate.

## Exploitable Weaknesses
Specific vulnerabilities backed by evidence. Defensive gaps. Transition weaknesses. Patterns we can exploit. Zones on the pitch where they're exposed.

## Game Plan — How We Beat ${opponent}
Our recommended formation and WHY against their system. Specific tactical instructions for each phase of play:
- In possession: how we build up, where we target
- Out of possession: pressing triggers, defensive shape
- Transitions: attack and defense
- Key individual matchups from our squad

## Recommended Starting XI
Our best 11 for THIS matchup. For each: position, name (#number), specific role and instructions against this opponent.

## Set Piece Blueprint
Corners (attacking/defending). Free kicks. Throw-ins in final third. Who takes, who attacks, who marks whom.

## Plan B — Tactical Adjustments
- Drawing at 60': changes to unlock them
- 1-0 down: emergency response
- Leading: game management
Name specific substitutes and their impact.

## Match Intelligence Summary
Difficulty rating (1-10). Top 3 things the squad MUST know. Pre-match message for the dressing room.

Make this report worthy of a professional football academy. Every recommendation should reference specific data.`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 6000,
    system: systemPrompt,
    messages: [{ role: "user", content: prompt }],
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
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("users")
      .select("academy_id")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    // Phase 1: Deep web research (up to 25 searches)
    // Phase 2: Build squad context
    // Run in parallel
    const [research, squadContext] = await Promise.all([
      deepResearchOpponent(opponent),
      buildFullContext(profile.academy_id),
    ]);

    // Phase 3: Generate the tactical dossier from research + squad data
    const report = await generateScoutReport(opponent, matchDate, research, squadContext);

    return NextResponse.json({ report });
  } catch (error) {
    console.error("Scout report error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate report",
      },
      { status: 500 }
    );
  }
}
