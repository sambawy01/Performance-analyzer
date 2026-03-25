import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPTS } from "@/lib/ai/prompts";
import { enrichPlayerContext } from "@/lib/ai/enrich-context";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

    // Fetch player data
    const [metricsRes, cvRes, loadRes, snapshotsRes] = await Promise.all([
      supabase.from("wearable_metrics").select("*").eq("player_id", playerId).order("created_at", { ascending: false }).limit(20),
      supabase.from("cv_metrics").select("*").eq("player_id", playerId).order("created_at", { ascending: false }).limit(20),
      supabase.from("load_records").select("*").eq("player_id", playerId).order("date", { ascending: false }).limit(20),
      supabase.from("development_snapshots").select("*").eq("player_id", playerId).order("month", { ascending: false }).limit(3),
    ]);

    const metrics = metricsRes.data ?? [];
    const cvMetrics = cvRes.data ?? [];
    const loadHistory = loadRes.data ?? [];
    const snapshots = snapshotsRes.data ?? [];

    // Fetch squad data for percentile context
    const { data: allPlayers } = await supabase
      .from("players")
      .select("id")
      .eq("academy_id", profile.academy_id)
      .eq("status", "active");
    const allPlayerIds = (allPlayers ?? []).map(p => p.id);

    const [squadMetricsRes, squadCvRes, squadLoadRes] = await Promise.all([
      allPlayerIds.length > 0
        ? supabase.from("wearable_metrics").select("*").in("player_id", allPlayerIds).order("created_at", { ascending: false }).limit(500)
        : Promise.resolve({ data: [] }),
      allPlayerIds.length > 0
        ? supabase.from("cv_metrics").select("*").in("player_id", allPlayerIds).order("created_at", { ascending: false }).limit(500)
        : Promise.resolve({ data: [] }),
      allPlayerIds.length > 0
        ? supabase.from("load_records").select("*").in("player_id", allPlayerIds).order("date", { ascending: false }).limit(500)
        : Promise.resolve({ data: [] }),
    ]);

    // Build enriched context
    const enrichedContext = enrichPlayerContext(
      player,
      metrics,
      cvMetrics,
      loadHistory,
      squadMetricsRes.data ?? [],
      squadCvRes.data ?? [],
      squadLoadRes.data ?? []
    );

    // Calculate stats for response JSON
    const sessionIds = [...new Set(metrics.map((m: any) => m.session_id))];
    const { data: sessions } = sessionIds.length > 0
      ? await supabase.from("sessions").select("id, date, type").in("id", sessionIds).eq("academy_id", profile.academy_id)
      : { data: [] };
    const sessionMap = new Map((sessions ?? []).map((s: any) => [s.id, s]));

    const enrichedMetrics = metrics.map((m: any) => ({
      ...m,
      session: sessionMap.get(m.session_id) ?? null,
    }));

    const twentyEightDaysAgo = new Date();
    twentyEightDaysAgo.setDate(twentyEightDaysAgo.getDate() - 28);
    const recentSessions = enrichedMetrics.filter(
      (m: any) => m.session?.date && new Date(m.session.date) >= twentyEightDaysAgo
    );
    const attendanceRate = Math.min(100, Math.round((recentSessions.length / 8) * 100));

    let fitnessImprovement = 0;
    if (enrichedMetrics.length >= 6) {
      const old5 = enrichedMetrics.slice(-5);
      const new5 = enrichedMetrics.slice(0, 5);
      const oldAvgHr = old5.reduce((s: number, m: any) => s + m.hr_avg, 0) / old5.length;
      const newAvgHr = new5.reduce((s: number, m: any) => s + m.hr_avg, 0) / new5.length;
      fitnessImprovement = Math.round(((oldAvgHr - newAvgHr) / oldAvgHr) * 100);
    }

    const systemPrompt = `${SYSTEM_PROMPTS.BASE_ANALYST}\n\n${SYSTEM_PROMPTS.PARENT_REPORT}`;

    // Build parent-friendly context (translate technical data)
    let parentContext = `
PLAYER: ${player.name} | #${player.jersey_number} | ${player.position} | Age: ${age ?? "?"} | U${2026 - parseInt(player.age_group)}

INTERNAL DATA (translate to parent-friendly language — DO NOT show raw numbers for ACWR or risk scores):
${enrichedContext}

ATTENDANCE: ${recentSessions.length} sessions in last 28 days (${attendanceRate}% of expected)
FITNESS TREND: ${fitnessImprovement > 0 ? `Heart efficiency improved by ${fitnessImprovement}%` : fitnessImprovement < 0 ? "Slight increase in effort required (normal during training blocks)" : "Stable fitness level"}`;

    if (snapshots.length > 0) {
      parentContext += `\n\nPREVIOUS DEVELOPMENT NOTES:\n${snapshots.map((s: any) => `- ${s.month}: ${s.ai_development_narrative ?? 'No notes'}`).join('\n')}`;
    }

    const prompt = `Generate a warm, encouraging monthly parent report for ${player.name}'s family.

${parentContext}

Follow the PARENT REPORT output format exactly:
## Monthly Highlights
## Training & Fitness Progress
## Attendance & Commitment
## Areas of Growth This Month
## Looking Ahead: Next Month's Focus
## How You Can Help at Home
## A Note from the Coaching Team

CRITICAL RULES:
- NEVER mention ACWR numbers, risk percentages, or injury risk language
- NEVER compare this player to other players by name
- Compare the player to THEMSELVES (their own improvement over time)
- Translate all technical data into parent-friendly language
- Frame everything through a growth mindset
- Be genuine — find real positives from the data, don't manufacture them
- Keep the tone warm and proud, as if you genuinely care about this child`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      system: systemPrompt,
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
