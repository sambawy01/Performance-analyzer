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

    // Get player — filtered by academy_id
    const { data: player } = await supabase
      .from("players")
      .select("*")
      .eq("id", playerId)
      .eq("academy_id", profile.academy_id)
      .single();

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    // Fetch player wearable metrics
    const { data: metrics } = await supabase
      .from("wearable_metrics")
      .select("*")
      .eq("player_id", playerId)
      .order("created_at", { ascending: false })
      .limit(20);

    // Fetch player CV metrics
    const { data: cvMetrics } = await supabase
      .from("cv_metrics")
      .select("*")
      .eq("player_id", playerId)
      .order("created_at", { ascending: false })
      .limit(20);

    // Fetch load history
    const { data: loadHistory } = await supabase
      .from("load_records")
      .select("*")
      .eq("player_id", playerId)
      .order("date", { ascending: false })
      .limit(30);

    // Fetch all squad metrics for percentile calculations
    const { data: allPlayers } = await supabase
      .from("players")
      .select("id, name, position, age_group")
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
      metrics ?? [],
      cvMetrics ?? [],
      loadHistory ?? [],
      squadMetricsRes.data ?? [],
      squadCvRes.data ?? [],
      squadLoadRes.data ?? []
    );

    // Fetch session details for context
    const sessionIds = [...new Set((metrics ?? []).map((m: any) => m.session_id))];
    const { data: sessions } = sessionIds.length > 0
      ? await supabase.from("sessions").select("id, date, type").in("id", sessionIds).eq("academy_id", profile.academy_id)
      : { data: [] };
    const sessionMap = new Map((sessions ?? []).map((s: any) => [s.id, s]));

    let sessionHistory = "";
    if (metrics && metrics.length > 0) {
      sessionHistory = "\n\nSESSION-BY-SESSION DATA:\n";
      for (const m of metrics) {
        const s = sessionMap.get(m.session_id);
        sessionHistory += `${s?.date ?? "?"} | ${s?.type ?? "?"} | TRIMP ${Math.round(m.trimp_score)}, HR ${m.hr_avg}/${m.hr_max}, Z4+Z5 ${Math.round(m.hr_zone_4_pct + m.hr_zone_5_pct)}%`;
        if (m.hr_recovery_60s) sessionHistory += `, HRR60 ${m.hr_recovery_60s}`;
        sessionHistory += "\n";
      }
    }

    const systemPrompt = `${SYSTEM_PROMPTS.BASE_ANALYST}\n\n${SYSTEM_PROMPTS.PLAYER_DEVELOPMENT}`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: "user", content: `Generate a comprehensive player development report:\n\n${enrichedContext}${sessionHistory}\n\nFollow the PLAYER DEVELOPMENT output format exactly. Use the 4-Corner Model. Project development trajectory. Set 3 measurable 4-week goals.` }],
    });

    const textBlock = response.content.find(b => b.type === "text");
    return NextResponse.json({ summary: (textBlock as any)?.text ?? "Unable to generate summary." });
  } catch (error) {
    console.error("Player summary error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate summary" },
      { status: 500 }
    );
  }
}
