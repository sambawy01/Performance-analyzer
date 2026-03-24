import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const PARENT_SYSTEM_PROMPT = `You are a warm, encouraging youth football development specialist writing monthly progress reports for parents.

Your tone is positive, supportive, and clear — parents are not sports scientists, so avoid jargon. Use simple language that makes parents feel proud of their child's progress. Always find genuine positives, even for players who need development. Be honest but constructive.`;

export async function POST(request: NextRequest) {
  try {
    const { playerId } = await request.json();

    if (!playerId || typeof playerId !== "string") {
      return NextResponse.json({ error: "playerId is required" }, { status: 400 });
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

    // Fetch player — filtered by academy_id
    const { data: player } = await supabase
      .from("players")
      .select("*")
      .eq("id", playerId)
      .eq("academy_id", profile.academy_id)
      .single();

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const age = player.dob
      ? Math.floor((Date.now() - new Date(player.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : null;

    // Fetch wearable metrics (NO FK JOINS)
    const { data: metrics } = await supabase
      .from("wearable_metrics")
      .select("session_id, hr_avg, hr_max, trimp_score, hr_recovery_60s, created_at")
      .eq("player_id", playerId)
      .order("created_at", { ascending: false })
      .limit(20);

    // Fetch session details separately
    const sessionIds = [...new Set((metrics ?? []).map((m) => m.session_id))];
    const { data: sessions } = sessionIds.length > 0
      ? await supabase.from("sessions").select("id, date, type").in("id", sessionIds).eq("academy_id", profile.academy_id)
      : { data: [] };
    const sessionMap = new Map((sessions ?? []).map((s) => [s.id, s]));

    // Enrich metrics with session data
    const enrichedMetrics = (metrics ?? []).map((m: any) => ({
      ...m,
      session: sessionMap.get(m.session_id) ?? null,
    }));

    // Fetch load history
    const { data: loadHistory } = await supabase
      .from("load_records")
      .select("*")
      .eq("player_id", playerId)
      .order("date", { ascending: false })
      .limit(20);

    // Fetch development snapshots
    const { data: snapshots } = await supabase
      .from("development_snapshots")
      .select("*")
      .eq("player_id", playerId)
      .order("month", { ascending: false })
      .limit(3);

    // Calculate stats
    const sessionCount = enrichedMetrics.length;
    const latestLoad = loadHistory?.[0] ?? null;

    // Calculate attendance rate (sessions attended vs expected ~2/week for 28 days = 8)
    const twentyEightDaysAgo = new Date();
    twentyEightDaysAgo.setDate(twentyEightDaysAgo.getDate() - 28);
    const recentSessions = enrichedMetrics.filter(
      (m: any) => m.session?.date && new Date(m.session.date) >= twentyEightDaysAgo
    );
    const attendanceRate = Math.min(100, Math.round((recentSessions.length / 8) * 100));

    // Calculate HR improvement (compare first 5 vs last 5 sessions)
    let fitnessImprovement = 0;
    if (enrichedMetrics.length >= 6) {
      const old5 = enrichedMetrics.slice(-5);
      const new5 = enrichedMetrics.slice(0, 5);
      const oldAvgHr = old5.reduce((s: number, m: any) => s + m.hr_avg, 0) / old5.length;
      const newAvgHr = new5.reduce((s: number, m: any) => s + m.hr_avg, 0) / new5.length;
      // Lower average HR = better fitness
      fitnessImprovement = Math.round(((oldAvgHr - newAvgHr) / oldAvgHr) * 100);
    }

    // Build data summary for Claude
    const recentSessionsSummary = enrichedMetrics.slice(0, 10).map((m: any) => ({
      date: m.session?.date,
      type: m.session?.type,
      hr_avg: m.hr_avg,
      trimp: Math.round(m.trimp_score),
      recovery: m.hr_recovery_60s,
    }));

    const prompt = `Generate a monthly parent report for ${player.name}.

PLAYER DETAILS:
- Name: ${player.name}
- Age: ${age ?? "Unknown"} years old
- Position: ${player.position}
- Age Group: U${2026 - parseInt(player.age_group)}
- Jersey Number: #${player.jersey_number}

ATTENDANCE & PARTICIPATION:
- Total sessions tracked this period: ${sessionCount}
- Sessions in last 28 days: ${recentSessions.length}
- Estimated attendance rate: ${attendanceRate}%

RECENT TRAINING DATA (last 10 sessions):
${recentSessionsSummary.map(s => `- ${s.date} | ${s.type} | Effort level: ${s.hr_avg} bpm avg | Session load: ${s.trimp}`).join('\n')}

INJURY RISK STATUS:
- Current ACWR (training load ratio): ${latestLoad?.acwr_ratio ?? 'N/A'} (${latestLoad?.risk_flag ?? 'unknown'})
- Note: Optimal range is 0.8-1.3 (meaning the player is well-conditioned and not overloaded)

FITNESS TREND:
- Average HR trend: ${fitnessImprovement > 0 ? `Improved by ${fitnessImprovement}% (heart working more efficiently)` : fitnessImprovement < 0 ? `Slight increase (normal during heavy training phases)` : 'Stable'}

${snapshots && snapshots.length > 0 ? `DEVELOPMENT NOTES FROM PREVIOUS REPORTS:\n${snapshots.map((s: any) => `- ${s.month}: ${s.ai_development_narrative ?? 'No notes'}`).join('\n')}` : ''}

Write a warm, encouraging monthly parent report with these sections (use ## headers):

## Overall Development Summary
2-3 sentences that capture this month's highlights. Start with something genuinely positive. Write as if speaking directly to the parent.

## Physical Fitness Progress
Explain how the player's fitness has developed in simple terms. Mention the effort they've put into training sessions. No technical jargon — explain what "training load" means in plain language if you need to mention it.

## Attendance & Commitment
Comment on their attendance and engagement. This is a reflection of their dedication.

## Health & Wellbeing
Reassure parents about injury prevention measures. Explain that the academy monitors training load to keep players healthy and prevent overtraining. Keep this positive and reassuring.

## Areas of Growth
2-3 specific areas where the player has shown improvement or development this month.

## Coach's Message
A warm, personal closing message to the parent. Thank them for their support. Give 1-2 things the parent can do at home to support their child's development (sleep, nutrition, hydration — simple things).

Keep the language simple and warm. No sports science jargon. Write as if you genuinely care about this child's development.`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1200,
      system: PARENT_SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const report = textBlock?.text ?? "Unable to generate parent report.";

    return NextResponse.json({
      report,
      stats: {
        sessions: recentSessions.length,
        improvement: fitnessImprovement,
        attendance: attendanceRate,
      },
      player: {
        name: player.name,
        position: player.position,
        ageGroup: `U${2026 - parseInt(player.age_group)}`,
        jerseyNumber: player.jersey_number,
      },
    });
  } catch (error) {
    console.error("Parent report error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate parent report" },
      { status: 500 }
    );
  }
}
