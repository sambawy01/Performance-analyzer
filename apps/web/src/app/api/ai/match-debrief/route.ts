import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

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
    const [metricsRes, tacticalRes, loadRes] = await Promise.all([
      supabase.from("wearable_metrics").select("*").eq("session_id", sessionId),
      supabase.from("tactical_metrics").select("*").eq("session_id", sessionId).maybeSingle(),
      supabase.from("load_records").select("*").eq("session_id", sessionId),
    ]);

    const metrics = metricsRes.data ?? [];
    const tactical = tacticalRes.data;
    const loadRecords = loadRes.data ?? [];

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

    // Build context
    let ctx = `SESSION: ${session.date} | ${session.type} | ${session.location} | ${session.duration_minutes} min | Age Group: ${session.age_group}\n`;
    if (session.notes) ctx += `Notes: ${session.notes}\n`;

    ctx += `\nWEARABLE METRICS (${metrics.length} players tracked):\n`;
    for (const m of metrics) {
      const p = playerMap.get(m.player_id);
      if (!p) continue;
      ctx += `#${p.jersey_number} ${p.name} (${p.position}): HR avg ${m.hr_avg} / max ${m.hr_max}, TRIMP ${Math.round(m.trimp_score)}, Z4+Z5 ${Math.round(m.hr_zone_4_pct + m.hr_zone_5_pct)}%`;
      if (m.hr_recovery_60s) ctx += `, Recovery ${m.hr_recovery_60s} bpm/60s`;
      ctx += `\n`;
    }

    if (tactical) {
      ctx += `\nTACTICAL: Formation: ${tactical.avg_formation ?? "N/A"} | Possession: ${tactical.possession_pct ?? "N/A"}% | PPDA: ${tactical.pressing_intensity ?? "N/A"}`;
      if (tactical.transition_speed_atk_s) ctx += ` | Transition ATK: ${tactical.transition_speed_atk_s}s DEF: ${tactical.transition_speed_def_s}s`;
      ctx += `\n`;
    }

    if (videoTags.length > 0) {
      ctx += `\nVIDEO TAGS (${videoTags.length}):\n`;
      for (const tag of videoTags.slice(0, 15)) {
        const min = Math.floor(tag.timestamp_start / 60);
        ctx += `  ${min}' ${tag.tag_type} — ${tag.player?.name ?? "Unknown"}: ${tag.label ?? ""}\n`;
      }
    }

    if (loadRecords.length > 0) {
      ctx += `\nLOAD:\n`;
      for (const l of loadRecords) {
        const p = playerMap.get(l.player_id);
        if (!p) continue;
        ctx += `#${p.jersey_number} ${p.name}: ACWR ${l.acwr_ratio} (${l.risk_flag})\n`;
      }
    }

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [{ role: "user", content: `Generate a post-match debrief:\n\n${ctx}\n\nInclude: ## Match Summary, ## Player Ratings (1-10 each), ## Key Moments, ## Tactical Assessment, ## What Worked, ## What Didn't, ## Recommendations. Be specific, cite numbers.` }],
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
