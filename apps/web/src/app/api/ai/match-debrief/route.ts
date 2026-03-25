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

    // Fetch session — filtered by academy_id
    const { data: session } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("academy_id", profile.academy_id)
      .single();

    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    // Fetch all data
    const [metricsRes, tacticalRes, loadRes, cvRes] = await Promise.all([
      supabase.from("wearable_metrics").select("*").eq("session_id", sessionId),
      supabase.from("tactical_metrics").select("*").eq("session_id", sessionId).maybeSingle(),
      supabase.from("load_records").select("*").eq("session_id", sessionId),
      supabase.from("cv_metrics").select("*").eq("session_id", sessionId),
    ]);

    const metrics = metricsRes.data ?? [];
    const tactical = tacticalRes.data;
    const loadRecords = loadRes.data ?? [];
    const cvMetrics = cvRes.data ?? [];

    // Fetch players separately (NO FK JOINS)
    const allPlayerIds = [...new Set([
      ...metrics.map((m: any) => m.player_id),
      ...loadRecords.map((l: any) => l.player_id),
    ])];
    const { data: players } = allPlayerIds.length > 0
      ? await supabase.from("players").select("id, name, jersey_number, position, age_group").in("id", allPlayerIds).eq("academy_id", profile.academy_id)
      : { data: [] };
    const playerMap = new Map((players ?? []).map((p: any) => [p.id, p]));

    // Fetch video tags via videos table
    const { data: videos } = await supabase.from("videos").select("id").eq("session_id", sessionId);
    const videoIds = (videos ?? []).map((v: any) => v.id);
    let videoTags: any[] = [];
    if (videoIds.length > 0) {
      const { data: tags } = await supabase.from("video_tags").select("*").in("video_id", videoIds).limit(30);
      videoTags = (tags ?? []).map((t: any) => ({ ...t, player: playerMap.get(t.player_id) }));
    }

    // Fetch recent session averages (last 5 sessions for comparison)
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
      tactical
    );

    // Add video tags to context
    let videoCtx = "";
    if (videoTags.length > 0) {
      videoCtx = `\n\nVIDEO TAGS (${videoTags.length}):\n`;
      for (const tag of videoTags.slice(0, 15)) {
        const min = Math.floor(tag.timestamp_start / 60);
        videoCtx += `  ${min}' ${tag.tag_type} — ${tag.player?.name ?? "Unknown"}: ${tag.label ?? ""}\n`;
      }
    }

    const systemPrompt = `${SYSTEM_PROMPTS.BASE_ANALYST}\n\n${SYSTEM_PROMPTS.SESSION_DEBRIEF}`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2500,
      system: systemPrompt,
      messages: [{ role: "user", content: `Generate a post-session debrief for this session:\n\n${enrichedContext}${videoCtx}\n\nFollow the SESSION DEBRIEF output format exactly. Rate each player 1-10 using the rubric. Identify the 3 most important coaching points with data, significance, and action.` }],
    });

    const textBlock = response.content.find((b) => b.type === "text") as { type: "text"; text: string } | undefined;

    // Player ratings
    const playerRatings = metrics.map((m: any) => {
      const p = playerMap.get(m.player_id);
      const trimpScore = Math.min(10, Math.max(1, Math.round((m.trimp_score / 150) * 10)));
      const intensityBonus = Math.round((m.hr_zone_4_pct + m.hr_zone_5_pct) / 10);
      const rating = Math.min(10, Math.max(1, Math.round((trimpScore + intensityBonus) / 2)));
      return {
        name: p?.name ?? "Unknown",
        jerseyNumber: p?.jersey_number ?? 0,
        rating,
        reasoning: `TRIMP: ${Math.round(m.trimp_score)}, HR avg: ${m.hr_avg}, Z4+Z5: ${Math.round(m.hr_zone_4_pct + m.hr_zone_5_pct)}%`,
      };
    });

    return NextResponse.json({ debrief: textBlock?.text ?? "No debrief generated.", session, playerRatings });
  } catch (error) {
    console.error("Match debrief error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Debrief generation failed" },
      { status: 500 }
    );
  }
}
