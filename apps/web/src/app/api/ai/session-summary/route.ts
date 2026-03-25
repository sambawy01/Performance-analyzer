import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPTS } from "@/lib/ai/prompts";
import { enrichSessionContext } from "@/lib/ai/enrich-context";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();
    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
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

    // Get session — filtered by academy_id
    const { data: session } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("academy_id", profile.academy_id)
      .single();

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Fetch session data
    const [metricsRes, cvRes, loadRes, tacticalRes] = await Promise.all([
      supabase.from("wearable_metrics").select("*").eq("session_id", sessionId),
      supabase.from("cv_metrics").select("*").eq("session_id", sessionId),
      supabase.from("load_records").select("*").eq("session_id", sessionId),
      supabase.from("tactical_metrics").select("*").eq("session_id", sessionId).maybeSingle(),
    ]);

    const metrics = metricsRes.data ?? [];
    const cvMetrics = cvRes.data ?? [];
    const loadRecords = loadRes.data ?? [];

    // Fetch player names separately (NO FK JOINS)
    const playerIds = [...new Set([
      ...metrics.map((m: any) => m.player_id),
      ...loadRecords.map((l: any) => l.player_id),
    ])];
    const { data: players } = playerIds.length > 0
      ? await supabase.from("players").select("id, name, position, jersey_number").in("id", playerIds).eq("academy_id", profile.academy_id)
      : { data: [] };
    const playerMap = new Map((players ?? []).map((p: any) => [p.id, p]));

    // Fetch recent session averages for comparison
    const { data: recentSessions } = await supabase
      .from("sessions")
      .select("id")
      .eq("academy_id", profile.academy_id)
      .lt("date", session.date)
      .order("date", { ascending: false })
      .limit(5);

    let recentSessionAverages: { avgTrimp: number; avgHr: number; avgZ45: number; count: number } | null = null;
    if (recentSessions && recentSessions.length > 0) {
      const recentIds = recentSessions.map((s: any) => s.id);
      const { data: recentMetrics } = await supabase
        .from("wearable_metrics")
        .select("trimp_score, hr_avg, hr_zone_4_pct, hr_zone_5_pct")
        .in("session_id", recentIds);
      if (recentMetrics && recentMetrics.length > 0) {
        recentSessionAverages = {
          avgTrimp: Math.round(recentMetrics.reduce((s: number, m: any) => s + m.trimp_score, 0) / recentMetrics.length),
          avgHr: Math.round(recentMetrics.reduce((s: number, m: any) => s + m.hr_avg, 0) / recentMetrics.length),
          avgZ45: Math.round(recentMetrics.reduce((s: number, m: any) => s + m.hr_zone_4_pct + m.hr_zone_5_pct, 0) / recentMetrics.length),
          count: recentSessions.length,
        };
      }
    }

    // Build enriched context
    const enrichedPlayerMetrics = metrics.map((m: any) => {
      const p = playerMap.get(m.player_id);
      return { ...m, name: p?.name ?? "Unknown", position: p?.position ?? "", jersey_number: p?.jersey_number ?? 0 };
    });
    const enrichedCvMetrics = cvMetrics.map((m: any) => {
      const p = playerMap.get(m.player_id);
      return { ...m, name: p?.name ?? "Unknown", position: p?.position ?? "", jersey_number: p?.jersey_number ?? 0 };
    });
    const enrichedLoadRecords = loadRecords.map((l: any) => {
      const p = playerMap.get(l.player_id);
      return { ...l, name: p?.name ?? "Unknown", jersey_number: p?.jersey_number ?? 0 };
    });

    const enrichedContext = enrichSessionContext(
      session,
      enrichedPlayerMetrics,
      enrichedCvMetrics,
      enrichedLoadRecords,
      recentSessionAverages,
      tacticalRes.data
    );

    if (metrics.length === 0) {
      return NextResponse.json({ summary: "No wearable data available for this session. Attach chest straps to generate AI analysis." });
    }

    const systemPrompt = `${SYSTEM_PROMPTS.BASE_ANALYST}\n\n${SYSTEM_PROMPTS.SESSION_DEBRIEF}`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: "user", content: `Generate a session analysis report:\n\n${enrichedContext}\n\nFollow the SESSION DEBRIEF output format. Rate the session 1-10 using the rubric. Identify top/bottom performers relative to their baselines. Give 5 specific recommendations for the next session.` }],
    });

    const textBlock = response.content.find(b => b.type === "text");
    return NextResponse.json({ summary: (textBlock as any)?.text ?? "Unable to generate summary." });
  } catch (error) {
    console.error("Session summary error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate summary" },
      { status: 500 }
    );
  }
}
