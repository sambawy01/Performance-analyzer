import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Anthropic from "@anthropic-ai/sdk";
import { buildFullContext } from "@/lib/ai/build-context";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SCOUT_SYSTEM_PROMPT = `You are an elite football intelligence analyst at Coach M8. You specialize in opponent analysis and pre-match scouting reports for football academies in Egypt and the Middle East.

Your job: use web search to research the OPPONENT thoroughly — their tactics, formation, key players, strengths, weaknesses, recent results, and form. Then recommend how the coaching team should prepare against them.

You have access to web search. USE IT EXTENSIVELY. Search for:
1. The opponent's recent match results and scores
2. Their squad/roster and key players
3. Their formation and tactical style
4. Their head coach and philosophy
5. Any news, injuries, or transfers
6. Their youth academy if it's a youth match

Search in both English and Arabic if relevant. Be thorough — run multiple searches to build a complete picture.

Write like a professional scout delivering a comprehensive dossier. Every claim should be backed by what you found online. If you cannot find specific information, say so clearly rather than guessing.`;

async function searchOpponentWithWebSearch(opponent: string, matchDate: string, squadContext: string): Promise<string> {
  // Use Claude with web_search tool for real-time research
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8000,
    system: SCOUT_SYSTEM_PROMPT,
    tools: [
      {
        type: "web_search_20250305",
        name: "web_search",
        max_uses: 10,
      } as any,
    ],
    messages: [
      {
        role: "user",
        content: `Research the football team/club "${opponent}" thoroughly using web search, then generate a comprehensive OPPONENT SCOUT REPORT for our match on ${matchDate}.

STEP 1: Search for information about ${opponent}. Run multiple searches:
- "${opponent} football results 2025 2026"
- "${opponent} squad roster players"
- "${opponent} formation tactics playing style"
- "${opponent} coach manager"
- "${opponent} youth academy" (if youth match)
- Try Arabic searches too: "${opponent} كرة القدم نتائج"

STEP 2: After gathering research, write the full report using this structure:

=== OUR SQUAD DATA (for tactical recommendations) ===
${squadContext.substring(0, 3000)}

Write the report with these sections (use ## headers):

## Opponent Profile
Full official name, city, country, league/division. Founded. Stadium. Current head coach. Recent season standing.

## Recent Form & Results
Last 5-10 matches with scores, dates, and opponents. Win/draw/loss record. Goals scored and conceded. Home vs away form. Current league position.

## Formation & Playing Style
Primary formation. Build-up play style (short/long/mixed). Pressing approach (high/mid/low). Defensive structure. Transition speed. Width usage. Set piece approach.

## Key Players to Watch
4-6 most dangerous players with: name, position, age, key stats if available, what makes them dangerous, specific instructions on how to neutralize each one.

## Strengths
3-5 specific tactical strengths. What they do well. Patterns of play that lead to goals. Set piece threat level.

## Weaknesses & Vulnerabilities
3-5 exploitable weaknesses. Defensive gaps. Areas on the pitch where they're vulnerable. Patterns that can be exploited.

## How to Beat Them — Tactical Game Plan
Recommended formation for US against their system. Specific pressing triggers. Where to exploit space. Build-up strategy. Key matchups. How to handle their strengths.

## Recommended Starting XI vs ${opponent}
Our best 11 for THIS specific matchup. Position, name (#number), and WHY they're selected against this opponent.

## Set Piece Plan
Attacking corners/free kicks: takers and targets. Defensive set pieces: marking assignments.

## Plan B — In-Game Adjustments
0-0 at 60 minutes, 1-0 down, and leading scenarios with specific substitutions.

## Risk Assessment
Match difficulty (1-10). Key risk factors. Load management notes.

Be comprehensive. Cite your web search findings. This is a professional scouting dossier.`,
      },
    ],
  });

  // Extract all text blocks from the response
  const textParts: string[] = [];
  for (const block of response.content) {
    if (block.type === "text") {
      textParts.push(block.text);
    }
  }

  return textParts.join("\n\n") || "Unable to generate scout report.";
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

    // Get squad context
    const squadContext = await buildFullContext(profile.academy_id);

    // Run web search + report generation in a single Claude call with web_search tool
    const report = await searchOpponentWithWebSearch(opponent, matchDate, squadContext);

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
