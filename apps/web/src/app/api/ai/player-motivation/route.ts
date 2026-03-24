import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const PLAYER_SYSTEM_PROMPT = `You are Coach M8 AI, a personal performance coach for a young football player. You speak directly to the player in second person ("you"). Be encouraging, specific (use their real data), and motivational. Reference actual numbers to show progress. Keep messages concise — 2-3 sentences max. This is a youth player — be age-appropriate, positive, and inspiring. Never be discouraging. Always end on a forward-looking note.`;

export async function POST(request: NextRequest) {
  try {
    const { playerId, context } = await request.json();

    if (!playerId || typeof playerId !== "string") {
      return NextResponse.json(
        { error: "playerId is required" },
        { status: 400 }
      );
    }

    const validContexts = ["motivation", "development", "tip", "challenge"];
    const ctx = validContexts.includes(context) ? context : "motivation";

    const supabase = createAdminClient();

    // Get player
    const { data: player } = await supabase
      .from("players")
      .select("name, position, age_group, jersey_number")
      .eq("id", playerId)
      .single();

    if (!player) {
      return NextResponse.json(
        { error: "Player not found" },
        { status: 404 }
      );
    }

    // Get recent wearable metrics
    const { data: wearableMetrics } = await supabase
      .from("wearable_metrics")
      .select(
        "hr_avg, hr_max, trimp_score, hr_recovery_60s, hr_zone_4_pct, hr_zone_5_pct, session_id, created_at"
      )
      .eq("player_id", playerId)
      .order("created_at", { ascending: false })
      .limit(10);

    // Get recent CV metrics
    const { data: cvMetrics } = await supabase
      .from("cv_metrics")
      .select(
        "total_distance_m, max_speed_kmh, sprint_count, session_id, created_at"
      )
      .eq("player_id", playerId)
      .order("created_at", { ascending: false })
      .limit(10);

    // Get load records
    const { data: loadRecords } = await supabase
      .from("load_records")
      .select("acwr_ratio, risk_flag, date")
      .eq("player_id", playerId)
      .order("date", { ascending: false })
      .limit(5);

    // Get session dates
    const sessionIds = [
      ...new Set([
        ...(wearableMetrics ?? []).map((m) => m.session_id),
        ...(cvMetrics ?? []).map((m) => m.session_id),
      ]),
    ];
    const { data: sessions } =
      sessionIds.length > 0
        ? await supabase
            .from("sessions")
            .select("id, date, type")
            .in("id", sessionIds)
        : { data: [] };
    const sessionMap = new Map(
      (sessions ?? []).map((s: any) => [s.id, s])
    );

    // Build data summary
    const wm = wearableMetrics ?? [];
    const cv = cvMetrics ?? [];
    const avgHr =
      wm.length > 0
        ? Math.round(wm.reduce((s, m) => s + (m.hr_avg ?? 0), 0) / wm.length)
        : 0;
    const avgTrimp =
      wm.length > 0
        ? Math.round(
            wm.reduce((s, m) => s + (m.trimp_score ?? 0), 0) / wm.length
          )
        : 0;
    const avgRecovery =
      wm.filter((m) => m.hr_recovery_60s).length > 0
        ? Math.round(
            wm
              .filter((m) => m.hr_recovery_60s)
              .reduce((s, m) => s + (m.hr_recovery_60s ?? 0), 0) /
              wm.filter((m) => m.hr_recovery_60s).length
          )
        : 0;
    const maxSpeed =
      cv.length > 0 ? Math.max(...cv.map((m) => m.max_speed_kmh ?? 0)) : 0;
    const avgDistance =
      cv.length > 0
        ? (
            cv.reduce((s, m) => s + (m.total_distance_m ?? 0), 0) /
            cv.length /
            1000
          ).toFixed(1)
        : "0";
    const totalSprints = cv.reduce((s, m) => s + (m.sprint_count ?? 0), 0);
    const latestAcwr =
      loadRecords && loadRecords.length > 0
        ? loadRecords[0].acwr_ratio ?? 0
        : 0;

    // Check for trends (recent 5 vs previous 5)
    const recent5Trimp = wm
      .slice(0, 5)
      .map((m) => m.trimp_score ?? 0);
    const prev5Trimp = wm
      .slice(5, 10)
      .map((m) => m.trimp_score ?? 0);
    const recentAvgTrimp =
      recent5Trimp.length > 0
        ? recent5Trimp.reduce((a, b) => a + b, 0) / recent5Trimp.length
        : 0;
    const prevAvgTrimp =
      prev5Trimp.length > 0
        ? prev5Trimp.reduce((a, b) => a + b, 0) / prev5Trimp.length
        : 0;
    const trimpTrend =
      prevAvgTrimp > 0
        ? ((recentAvgTrimp - prevAvgTrimp) / prevAvgTrimp) * 100
        : 0;

    const contextPrompts: Record<string, string> = {
      motivation: `Generate a short motivational message for this player based on their recent performance data. If they're improving, celebrate it. If they're consistent, challenge them to reach the next level. If there's a dip, be supportive and encouraging.`,
      development: `Analyze this player's development trajectory based on their data. What position archetype are they developing into? What's improving? What needs work? Give a development insight — be specific with numbers.`,
      tip: `Give a specific, actionable training tip based on this player's current data and performance gaps. Something they can apply in their next session.`,
      challenge: `Create a personalized challenge for this player based on their data. Use specific numbers from their performance to set an achievable but stretching target.`,
    };

    const prompt = `${contextPrompts[ctx]}

PLAYER: ${player.name} (#${player.jersey_number})
POSITION: ${player.position}
AGE GROUP: ${player.age_group}

RECENT PERFORMANCE (last 10 sessions):
- Avg HR: ${avgHr} bpm
- Avg TRIMP: ${avgTrimp}
- HR Recovery: ${avgRecovery} bpm/60s
- Max Speed: ${maxSpeed} km/h
- Avg Distance: ${avgDistance} km/session
- Total Sprints: ${totalSprints}
- ACWR: ${latestAcwr.toFixed(2)}
- TRIMP Trend: ${trimpTrend > 0 ? "+" : ""}${trimpTrend.toFixed(0)}% (recent vs previous)

Remember: 2-3 sentences max. Speak directly to the player. Use "you" and "your". Reference specific numbers.`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 200,
      system: PLAYER_SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    const message =
      response.content[0].type === "text"
        ? response.content[0].text
        : "Keep pushing yourself. Every session makes you better.";

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Player motivation error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate motivation",
      },
      { status: 500 }
    );
  }
}
