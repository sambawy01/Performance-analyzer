import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(c) { try { c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {} },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("users")
      .select("academy_id, name, role")
      .eq("auth_user_id", user.id)
      .single();
    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    // Fetch all relevant data in parallel
    const [sessionRes, metricsRes, tacticalRes, videoTagsRes, loadRes, playersRes] =
      await Promise.all([
        supabase.from("sessions").select("*").eq("id", sessionId).single(),
        supabase
          .from("wearable_metrics")
          .select("*, players!inner(name, jersey_number, position, age_group)")
          .eq("session_id", sessionId),
        supabase.from("tactical_metrics").select("*").eq("session_id", sessionId).maybeSingle(),
        supabase
          .from("video_tags")
          .select("*, players!inner(name, jersey_number)")
          .eq("session_id", sessionId)
          .limit(30),
        supabase
          .from("load_records")
          .select("*, players!inner(name, jersey_number)")
          .eq("session_id", sessionId),
        supabase
          .from("players")
          .select("id, name, jersey_number, position, age_group")
          .eq("academy_id", profile.academy_id)
          .eq("status", "active"),
      ]);

    const session = sessionRes.data;
    const metrics = metricsRes.data ?? [];
    const tactical = tacticalRes.data;
    const videoTags = videoTagsRes.data ?? [];
    const loadRecords = loadRes.data ?? [];
    const players = playersRes.data ?? [];

    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    // Build context string
    let ctx = `SESSION: ${session.date} | ${session.type} | ${session.location} | ${session.duration_minutes} min | Age Group: ${session.age_group}\n`;
    if (session.notes) ctx += `Notes: ${session.notes}\n`;

    ctx += `\nWEARABLE METRICS (${metrics.length} players tracked):\n`;
    for (const m of metrics) {
      const p = m.players as any;
      ctx += `#${p.jersey_number} ${p.name} (${p.position}): HR avg ${m.hr_avg} / max ${m.hr_max}, TRIMP ${Math.round(m.trimp_score)}, Z4+Z5 ${Math.round(m.hr_zone_4_pct + m.hr_zone_5_pct)}%`;
      if (m.hr_recovery_60s) ctx += `, Recovery ${m.hr_recovery_60s} bpm/60s`;
      if (m.session_rpe) ctx += `, RPE ${m.session_rpe}`;
      ctx += `\n`;
    }

    if (tactical) {
      ctx += `\nTACTICAL METRICS:\nFormation: ${tactical.avg_formation ?? "N/A"} | Possession: ${tactical.possession_pct ?? "N/A"}% | PPDA: ${tactical.pressing_intensity ?? "N/A"}`;
      if (tactical.transition_speed_atk_s) ctx += ` | Transition ATK: ${tactical.transition_speed_atk_s}s DEF: ${tactical.transition_speed_def_s}s`;
      if (tactical.compactness_avg) ctx += ` | Compactness: ${tactical.compactness_avg}`;
      ctx += `\n`;
    }

    if (videoTags.length > 0) {
      ctx += `\nVIDEO TAGS (${videoTags.length} events):\n`;
      for (const tag of videoTags.slice(0, 15)) {
        const p = tag.players as any;
        const min = Math.floor(tag.timestamp_start / 60);
        ctx += `  Minute ${min}: ${tag.tag_type} — ${p?.name ?? "Unknown"} (${tag.label ?? ""})\n`;
      }
    }

    if (loadRecords.length > 0) {
      ctx += `\nLOAD RECORDS:\n`;
      for (const l of loadRecords) {
        const p = l.players as any;
        ctx += `#${p.jersey_number} ${p.name}: Daily load ${Math.round(l.daily_load)}, ACWR ${l.acwr_ratio} (${l.risk_flag})\n`;
      }
    }

    const prompt = `You are Coach M8, an elite youth football performance analyst. Generate a comprehensive post-match debrief report for the following session.

${ctx}

Generate a detailed post-match debrief report with these sections:

## 1. Match Summary
Write 2-3 sentences summarizing the session performance, effort level, and key themes.

## 2. Player Ratings
Rate each tracked player 1-10 with brief reasoning based on their TRIMP score, HR data, zone distribution, and load. Format: "**#[jersey] [Name]** — [rating]/10: [2-sentence reasoning]"

## 3. Key Moments
Identify significant moments by correlating HR data with timeline. Include any HR spikes, fatigue patterns, or video events. Example: "HR spike at minute 65 — likely coincides with high-intensity pressing phase."

## 4. Tactical Assessment
Based on the tactical metrics and session type, assess: formation effectiveness, pressing intensity, transitions, and positioning.

## 5. What Worked
3-4 bullet points of positives from the session data.

## 6. What Didn't Work
3-4 bullet points of concerns or areas needing improvement.

## 7. Recommendations for Next Match
4-5 specific, actionable recommendations citing player names and data points.

Be direct, specific, and data-driven. Cite exact numbers.`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = response.content.find((b) => b.type === "text") as { type: "text"; text: string } | undefined;

    // Build player ratings for structured output
    const playerRatings: { name: string; jerseyNumber: number; rating: number; reasoning: string }[] = [];
    for (const m of metrics) {
      const p = m.players as any;
      // Simple heuristic rating: normalize TRIMP + HR zones
      const trimpScore = Math.min(10, Math.max(1, Math.round((m.trimp_score / 150) * 10)));
      const intensityBonus = Math.round((m.hr_zone_4_pct + m.hr_zone_5_pct) / 10);
      const rating = Math.min(10, Math.max(1, Math.round((trimpScore + intensityBonus) / 2)));
      playerRatings.push({
        name: p.name,
        jerseyNumber: p.jersey_number,
        rating,
        reasoning: `TRIMP: ${Math.round(m.trimp_score)}, HR avg: ${m.hr_avg}, Z4+Z5: ${Math.round(m.hr_zone_4_pct + m.hr_zone_5_pct)}%`,
      });
    }

    return NextResponse.json({
      debrief: textBlock?.text ?? "No debrief generated.",
      session,
      playerRatings,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    });
  } catch (error) {
    console.error("Match debrief error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Debrief generation failed" },
      { status: 500 }
    );
  }
}
