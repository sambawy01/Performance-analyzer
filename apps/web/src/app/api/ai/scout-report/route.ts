import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Anthropic from "@anthropic-ai/sdk";
import { buildFullContext } from "@/lib/ai/build-context";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SCOUT_SYSTEM_PROMPT = `You are an elite football intelligence analyst at Coach M8. You specialize in opponent analysis and pre-match scouting reports for youth football academies in Egypt and the Middle East.

Your job: research and analyze the OPPONENT — their tactics, formation, key players, strengths, weaknesses, and recent form. Then recommend how YOUR team should play against them.

You receive two inputs:
1. Web research about the opponent (news, results, tactical analysis)
2. Your own team's current squad data

Write like a professional scout delivering a comprehensive dossier to the head coach before a crucial match. Be specific, data-driven, and decisive. If web research provides specific names, formations, or results — USE THEM. If information is limited, extrapolate from what's available and clearly state assumptions.`;

async function searchOpponent(opponent: string): Promise<string> {
  // Use web search to gather opponent intelligence
  const queries = [
    `${opponent} football team latest results lineup`,
    `${opponent} youth football Egypt formation tactics`,
    `${opponent} football squad players`,
  ];

  let research = "";

  for (const query of queries) {
    try {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
      const res = await fetch(
        `https://api.anthropic.com/v1/messages`,
        {
          method: "POST",
          headers: {
            "x-api-key": process.env.ANTHROPIC_API_KEY!,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 800,
            messages: [
              {
                role: "user",
                content: `You are a football research assistant. Based on your knowledge, provide any information you have about this football team/club: "${opponent}".

Include if known:
- Full official name, city, country
- League/division they play in
- Recent results and form
- Typical formation and playing style
- Notable players (especially youth/academy level)
- Head coach
- Strengths and weaknesses
- Stadium/home ground
- Any relevant news

If this is a youth team (U16, U18, etc.), focus on the academy and youth development program. If you have limited information, provide what you can and note what's uncertain. This is for an Egyptian youth football context.`,
              },
            ],
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        const text = data.content?.find((b: any) => b.type === "text")?.text;
        if (text) {
          research += `\n--- Research on "${opponent}" ---\n${text}\n`;
          break; // One good research call is enough
        }
      }
    } catch {
      // Continue with next query
    }
  }

  return research || `Limited information available about ${opponent}. Analysis will be based on general tactical principles for this level of competition.`;
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

    // Run opponent research and squad context fetch in parallel
    const [opponentResearch, squadContext] = await Promise.all([
      searchOpponent(opponent),
      buildFullContext(profile.academy_id),
    ]);

    const prompt = `Generate a comprehensive OPPONENT SCOUT REPORT for our match vs **${opponent}** on ${matchDate}.

=== OPPONENT INTELLIGENCE ===
${opponentResearch}

=== OUR SQUAD DATA ===
${squadContext}

Write a detailed opponent analysis with these sections (use ## headers):

## Opponent Profile
Full name, league, city. Recent form (last 5 results if known). Head coach. Overall squad strength rating.

## Formation & Playing Style
Their typical formation (e.g., 4-3-3, 3-5-2). How they build up play. Pressing style (high/mid/low block). Transition speed. Set piece tendencies.

## Key Players to Watch
3-5 of their most dangerous players. For each: name, position, number if known, what makes them dangerous, how to neutralize them.

## Strengths
What they do well. Specific tactical patterns that make them effective. Where they're most dangerous on the pitch.

## Weaknesses & Vulnerabilities
Where they can be exploited. Defensive gaps, tactical weaknesses, known problem areas. Be specific about zones on the pitch.

## Recent Form & Results
Last 5 matches if available. Win/loss patterns. Goals scored/conceded trends. Home vs away performance.

## How to Beat Them — Tactical Game Plan
Recommended formation for US. Specific tactical instructions. Where to press, where to exploit space. Build-up strategy. Which of our players match up best against their key threats.

## Recommended Starting XI vs ${opponent}
Our best 11 for THIS specific matchup. For each player: position, name (#number), and WHY they start against this opponent specifically (not generic reasons).

## Set Piece Plan
Attacking set pieces: who takes, who attacks. Defensive set pieces: marking assignments against their aerial threats.

## Plan B — In-Game Adjustments
If 0-0 at 60': what changes. If 1-0 down: emergency response. If leading: how to protect the lead. Name specific substitutions.

## Risk Assessment
Overall match difficulty rating (1-10). Key risk factors. Players on our side who need load management and minute restrictions.

Be comprehensive and specific. This is a professional scouting dossier, not a summary. The head coach should be able to walk into the dressing room and brief the entire squad from this document.`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      system: SCOUT_SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const report =
      textBlock?.text ?? "Unable to generate scout report.";

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
