import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPTS } from "@/lib/ai/prompts";
import { enrichSquadContext } from "@/lib/ai/enrich-context";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const { messages, context: pageContext } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "messages array is required" }, { status: 400 });
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
      .select("academy_id, name, role")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Fetch full squad data for enriched context
    const [playersRes, metricsRes, cvRes, loadRes, sessionsRes, tacticalRes] = await Promise.all([
      supabase.from("players").select("*").eq("academy_id", profile.academy_id).eq("status", "active").order("jersey_number"),
      supabase.from("wearable_metrics").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("cv_metrics").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("load_records").select("*").order("date", { ascending: false }).limit(500),
      supabase.from("sessions").select("*").eq("academy_id", profile.academy_id).order("date", { ascending: false }).limit(20),
      supabase.from("tactical_metrics").select("*").limit(20),
    ]);

    const players = playersRes.data ?? [];
    const playerIds = players.map(p => p.id);
    const allMetrics = (metricsRes.data ?? []).filter((m: any) => playerIds.includes(m.player_id));
    const allCvMetrics = (cvRes.data ?? []).filter((m: any) => playerIds.includes(m.player_id));
    const allLoadRecords = (loadRes.data ?? []).filter((l: any) => playerIds.includes(l.player_id));

    const enrichedContext = enrichSquadContext(
      players,
      allMetrics,
      allCvMetrics,
      allLoadRecords,
      sessionsRes.data ?? [],
      tacticalRes.data ?? []
    );

    const systemPrompt = `${SYSTEM_PROMPTS.BASE_ANALYST}

You are having a conversation with ${profile.name} (${profile.role}) at The Maker Football Incubator.

You have COMPLETE access to the academy's enriched data below. Use it to give precise, data-backed answers. Always cite specific player names, jersey numbers, ACWR values, TRIMP scores, and percentile rankings.

Your communication style:
- Direct and actionable — coaches don't have time for fluff
- ALWAYS cite specific data points: "rest #7 Mostafa tomorrow, his ACWR is 1.73 (danger zone, 4-5x injury risk per Gabbett 2016)" not "consider reducing load"
- Compare players to each other using percentile ranks and position-specific benchmarks
- Give concrete recommendations with specific thresholds and timelines
- Think like a performance analyst who's been in every session
- Be honest about limitations — if data is missing, say what's needed

${enrichedContext}

${pageContext ? `\nCURRENT VIEW CONTEXT:\n${pageContext}` : ""}`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1200,
      system: systemPrompt,
      messages: messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const textBlock = response.content.find((b) => b.type === "text") as { type: "text"; text: string } | undefined;

    return NextResponse.json({
      reply: textBlock?.text ?? "No response generated.",
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    });
  } catch (error) {
    console.error("AI chat error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Chat failed" },
      { status: 500 }
    );
  }
}
