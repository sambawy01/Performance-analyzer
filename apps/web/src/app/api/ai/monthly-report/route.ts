import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const { month, year } = await request.json();

    // Auth check
    const authClient = await createClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile with academy_id (ignore client-sent academyId)
    const supabase = createAdminClient();
    const { data: profile } = await supabase
      .from("users")
      .select("academy_id")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const academyId = profile.academy_id;
    const targetMonth = month ?? new Date().getMonth() + 1;
    const targetYear = year ?? new Date().getFullYear();
    const monthStart = `${targetYear}-${String(targetMonth).padStart(2, "0")}-01`;
    const monthEnd = new Date(targetYear, targetMonth, 0).toISOString().split("T")[0];

    // Fetch all players separately (no FK joins)
    const { data: players } = await supabase
      .from("players")
      .select("id, name, position, jersey_number, age_group, status")
      .eq("academy_id", academyId)
      .eq("status", "active");

    const playerIds = (players ?? []).map((p) => p.id);
    const playerMap = Object.fromEntries((players ?? []).map((p) => [p.id, p]));

    // Fetch sessions this month
    const { data: sessions } = await supabase
      .from("sessions")
      .select("id, date, type, duration_minutes, age_group, location")
      .eq("academy_id", academyId)
      .gte("date", monthStart)
      .lte("date", monthEnd)
      .order("date", { ascending: true });

    const sessionIds = (sessions ?? []).map((s) => s.id);

    // Fetch wearable metrics for these sessions
    const { data: metrics } = playerIds.length && sessionIds.length
      ? await supabase
          .from("wearable_metrics")
          .select("player_id, session_id, hr_avg, hr_max, trimp_score, hr_recovery_60s, hr_zone_4_pct, hr_zone_5_pct")
          .in("session_id", sessionIds)
          .in("player_id", playerIds)
      : { data: [] };

    // Fetch load records this month
    const { data: loadRecords } = playerIds.length
      ? await supabase
          .from("load_records")
          .select("player_id, date, acwr_ratio, risk_flag, daily_load, acute_load_7d, chronic_load_28d")
          .in("player_id", playerIds)
          .gte("date", monthStart)
          .lte("date", monthEnd)
          .order("date", { ascending: false })
      : { data: [] };

    // Fetch CV metrics for these sessions
    const { data: cvMetrics } = playerIds.length && sessionIds.length
      ? await supabase
          .from("cv_metrics")
          .select("player_id, session_id, total_distance_m, max_speed_kmh, sprint_count, avg_speed_kmh")
          .in("session_id", sessionIds)
          .in("player_id", playerIds)
      : { data: [] };

    // --- Compute stats ---
    const sessionCount = (sessions ?? []).length;
    const sessionTypeBreakdown = (sessions ?? []).reduce<Record<string, number>>((acc, s) => {
      acc[s.type] = (acc[s.type] ?? 0) + 1;
      return acc;
    }, {});

    const metricsArr = metrics ?? [];
    const avgTrimp = metricsArr.length
      ? Math.round(metricsArr.reduce((s, m) => s + m.trimp_score, 0) / metricsArr.length)
      : 0;
    const avgHr = metricsArr.length
      ? Math.round(metricsArr.reduce((s, m) => s + m.hr_avg, 0) / metricsArr.length)
      : 0;

    const cvArr = cvMetrics ?? [];
    const avgDistance = cvArr.length
      ? Math.round(cvArr.reduce((s, m) => s + m.total_distance_m, 0) / cvArr.length)
      : 0;

    // ACWR distribution
    const loadArr = loadRecords ?? [];

    // Get latest load record per player
    const latestLoadByPlayer: Record<string, typeof loadArr[0]> = {};
    for (const lr of loadArr) {
      if (!latestLoadByPlayer[lr.player_id]) {
        latestLoadByPlayer[lr.player_id] = lr;
      }
    }

    const riskCounts = { red: 0, amber: 0, green: 0, blue: 0 };
    for (const lr of Object.values(latestLoadByPlayer)) {
      const flag = lr.risk_flag as keyof typeof riskCounts;
      if (flag in riskCounts) riskCounts[flag]++;
    }

    // Top performers by TRIMP
    const trimpByPlayer: Record<string, { total: number; count: number }> = {};
    for (const m of metricsArr) {
      if (!trimpByPlayer[m.player_id]) trimpByPlayer[m.player_id] = { total: 0, count: 0 };
      trimpByPlayer[m.player_id].total += m.trimp_score;
      trimpByPlayer[m.player_id].count++;
    }

    const topPerformers = Object.entries(trimpByPlayer)
      .map(([pid, t]) => ({
        player: playerMap[pid],
        avgTrimp: Math.round(t.total / t.count),
        sessions: t.count,
      }))
      .filter((x) => x.player)
      .sort((a, b) => b.avgTrimp - a.avgTrimp)
      .slice(0, 5);

    // Build AI prompt
    const monthName = new Date(targetYear, targetMonth - 1).toLocaleString("en-GB", { month: "long" });

    const prompt = `Generate a comprehensive Monthly Team Performance Report for ${monthName} ${targetYear}.

ACADEMY DATA:

Sessions This Month: ${sessionCount}
Session Breakdown: ${JSON.stringify(sessionTypeBreakdown)}

Team Averages (from wearable data):
- Average TRIMP Score: ${avgTrimp}
- Average Heart Rate: ${avgHr} bpm
- Average Distance (CV): ${avgDistance}m

Risk Status (latest per player):
- Red (danger >1.5 ACWR): ${riskCounts.red} players
- Amber (caution 1.3-1.5 ACWR): ${riskCounts.amber} players
- Green (optimal): ${riskCounts.green} players

Top 5 Performers by Average TRIMP:
${topPerformers.map((p, i) => `${i + 1}. #${p.player.jersey_number} ${p.player.name} (${p.player.position}) — Avg TRIMP: ${p.avgTrimp} over ${p.sessions} sessions`).join("\n")}

Players At Risk (red/amber flags):
${Object.values(latestLoadByPlayer)
  .filter((lr) => lr.risk_flag === "red" || lr.risk_flag === "amber")
  .map((lr) => {
    const p = playerMap[lr.player_id];
    return p ? `- #${p.jersey_number} ${p.name} (${lr.risk_flag.toUpperCase()}) ACWR: ${lr.acwr_ratio?.toFixed(2)}` : null;
  })
  .filter(Boolean)
  .join("\n") || "None flagged this month"}

Write a professional monthly report with these sections (use ## headers):

## Executive Summary
3-4 sentences capturing the month's key performance themes, standout achievements, and primary concerns.

## Performance Trends
Analysis of training load, intensity distribution, and fitness indicators across the squad. Reference specific TRIMP and HR data.

## Top 5 Performers
For each of the top 5 players by TRIMP, write 2-3 sentences on their contribution and standout qualities.

## Injury & Load Report
Detailed breakdown of at-risk players, their ACWR values, and recommended load adjustments.

## Tactical Evolution
Based on session types and volume, comment on training emphasis and tactical development this month.

## Recommendations
5 specific, actionable recommendations for next month covering load management, player development, and squad health.

Be precise, data-driven, and direct. Use player numbers and names throughout.`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system:
        "You are Coach M8 AI, an elite football performance analyst. Generate professional, data-driven team performance reports. Be precise, cite specific data, and give actionable recommendations.",
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const report = textBlock?.text ?? "Unable to generate report.";

    return NextResponse.json({
      report,
      stats: {
        sessionCount,
        sessionTypeBreakdown,
        avgTrimp,
        avgHr,
        avgDistance,
        riskCounts,
        topPerformers: topPerformers.map((p) => ({
          name: p.player.name,
          jerseyNumber: p.player.jersey_number,
          position: p.player.position,
          avgTrimp: p.avgTrimp,
          sessions: p.sessions,
        })),
        playersAtRisk: riskCounts.red + riskCounts.amber,
      },
    });
  } catch (error) {
    console.error("Monthly report error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate report" },
      { status: 500 }
    );
  }
}
