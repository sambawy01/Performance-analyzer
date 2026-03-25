import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPTS } from "@/lib/ai/prompts";
import { enrichSquadContext } from "@/lib/ai/enrich-context";

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

    const academyId = profile.academy_id;
    const targetMonth = month ?? new Date().getMonth() + 1;
    const targetYear = year ?? new Date().getFullYear();
    const monthStart = `${targetYear}-${String(targetMonth).padStart(2, "0")}-01`;
    const monthEnd = new Date(targetYear, targetMonth, 0).toISOString().split("T")[0];

    // Fetch all players
    const { data: players } = await supabase
      .from("players")
      .select("*")
      .eq("academy_id", academyId)
      .eq("status", "active");

    const playerIds = (players ?? []).map((p) => p.id);
    const playerMap = Object.fromEntries((players ?? []).map((p) => [p.id, p]));

    // Fetch sessions this month
    const { data: sessions } = await supabase
      .from("sessions")
      .select("*")
      .eq("academy_id", academyId)
      .gte("date", monthStart)
      .lte("date", monthEnd)
      .order("date", { ascending: true });

    const sessionIds = (sessions ?? []).map((s) => s.id);

    // Fetch all metrics
    const [metricsRes, loadRes, cvRes, tacticalRes] = await Promise.all([
      playerIds.length && sessionIds.length
        ? supabase.from("wearable_metrics").select("*").in("session_id", sessionIds).in("player_id", playerIds)
        : Promise.resolve({ data: [] }),
      playerIds.length
        ? supabase.from("load_records").select("*").in("player_id", playerIds).gte("date", monthStart).lte("date", monthEnd).order("date", { ascending: false })
        : Promise.resolve({ data: [] }),
      playerIds.length && sessionIds.length
        ? supabase.from("cv_metrics").select("*").in("session_id", sessionIds).in("player_id", playerIds)
        : Promise.resolve({ data: [] }),
      sessionIds.length
        ? supabase.from("tactical_metrics").select("*").in("session_id", sessionIds)
        : Promise.resolve({ data: [] }),
    ]);

    const metricsArr = metricsRes.data ?? [];
    const loadArr = loadRes.data ?? [];
    const cvArr = cvRes.data ?? [];

    // Build enriched squad context
    const enrichedContext = enrichSquadContext(
      players ?? [],
      metricsArr,
      cvArr,
      loadArr,
      sessions ?? [],
      tacticalRes.data ?? []
    );

    // --- Compute stats for response JSON ---
    const sessionCount = (sessions ?? []).length;
    const sessionTypeBreakdown = (sessions ?? []).reduce<Record<string, number>>((acc, s) => {
      acc[s.type] = (acc[s.type] ?? 0) + 1;
      return acc;
    }, {});

    const avgTrimp = metricsArr.length
      ? Math.round(metricsArr.reduce((s, m) => s + m.trimp_score, 0) / metricsArr.length)
      : 0;
    const avgHr = metricsArr.length
      ? Math.round(metricsArr.reduce((s, m) => s + m.hr_avg, 0) / metricsArr.length)
      : 0;
    const avgDistance = cvArr.length
      ? Math.round(cvArr.reduce((s, m) => s + m.total_distance_m, 0) / cvArr.length)
      : 0;

    // ACWR distribution
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

    const monthName = new Date(targetYear, targetMonth - 1).toLocaleString("en-GB", { month: "long" });

    const systemPrompt = `${SYSTEM_PROMPTS.BASE_ANALYST}\n\n${SYSTEM_PROMPTS.MONTHLY_REPORT}`;

    // Additional month-specific stats for the prompt
    const monthSpecificData = `
MONTH: ${monthName} ${targetYear}
Sessions: ${sessionCount} | Types: ${JSON.stringify(sessionTypeBreakdown)}
Team Avg TRIMP: ${avgTrimp} | Avg HR: ${avgHr} bpm | Avg Distance: ${avgDistance}m
Risk Status: Red ${riskCounts.red}, Amber ${riskCounts.amber}, Green ${riskCounts.green}, Blue ${riskCounts.blue}

Top 5 by Avg TRIMP:
${topPerformers.map((p, i) => `${i + 1}. #${p.player.jersey_number} ${p.player.name} (${p.player.position}) — Avg TRIMP ${p.avgTrimp} over ${p.sessions} sessions`).join("\n")}

Players At Risk:
${Object.values(latestLoadByPlayer)
  .filter((lr) => lr.risk_flag === "red" || lr.risk_flag === "amber")
  .map((lr) => {
    const p = playerMap[lr.player_id];
    return p ? `- #${p.jersey_number} ${p.name} (${lr.risk_flag.toUpperCase()}) ACWR: ${lr.acwr_ratio?.toFixed(2)}` : null;
  })
  .filter(Boolean)
  .join("\n") || "None flagged"}

Amber/Red incidents this month: ${loadArr.filter(l => l.risk_flag === "amber" || l.risk_flag === "red").length} total records`;

    const prompt = `Generate a comprehensive Monthly Team Performance Report using the MONTHLY REPORT framework.

${enrichedContext}

${monthSpecificData}

Follow the 8-section MONTHLY REPORT framework exactly:
1. Executive Performance Summary (total volume, comparison to targets, month narrative)
2. Load Management Audit (weekly TRIMP averages, monotony index, ACWR zone distribution)
3. Fitness Indicators (HRR60 trends, Z4+Z5 distribution, top improvers, concern list)
4. Positional Group Analysis (GK, DEF, MID, ATT — load comparison, overload detection)
5. Injury/Risk Review (total incidents, patterns, chronic overload concerns)
6. Tactical Development (session emphasis, pressing/possession/transition trends)
7. Top Performers and Development Highlights (top 5, most improved, breakout potential)
8. Recommendations for Next Month (5-7 specific, measurable, data-backed)

Cite specific numbers throughout. Reference player names, jersey numbers, ACWR values, TRIMP scores, and HRR60 measurements.`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 3000,
      system: systemPrompt,
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
