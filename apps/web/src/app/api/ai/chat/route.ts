import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Anthropic from "@anthropic-ai/sdk";
import { buildFullContext } from "@/lib/ai/build-context";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const { messages, context: pageContext } = await request.json();

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
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile for academy_id
    const { data: profile } = await supabase
      .from("users")
      .select("academy_id, name, role")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Build full academy data context
    const fullContext = await buildFullContext(profile.academy_id);

    const systemPrompt = `You are Coach M8 AI, an elite football performance analyst embedded in a youth football academy's analytics platform. You're talking to ${profile.name} (${profile.role}).

You have COMPLETE access to the academy's data. You know every player, every session, every HR reading, every load record, and every tactical metric. Use this data to give precise, data-backed answers.

Your expertise:
- Heart rate zone analysis (Z1-Z5) and what each zone means for youth players
- TRIMP (Training Impulse) scoring and session load quantification
- ACWR (Acute:Chronic Workload Ratio) — optimal 0.8-1.3, caution 1.3-1.5, danger >1.5
- Youth player development (ages 12-16), growth considerations, injury prevention
- Tactical analysis: formations, pressing intensity (PPDA), transitions, compactness
- Periodization and weekly load planning for academy football
- Player comparison and benchmarking within the squad
- Match preparation and squad selection based on load data

Your communication style:
- Direct and actionable — coaches don't have time for fluff
- ALWAYS cite specific player names, jersey numbers, and data points
- Give concrete recommendations ("rest #7 Mostafa tomorrow, his ACWR is 1.73", not "consider reducing load")
- Compare players to each other and to their own baselines
- Think like a performance analyst who's been in every session
- Be honest about limitations — if data is missing, say what's needed
- When discussing squad selection or tactics, reference the actual data

IMPORTANT: You have the FULL academy database below. Reference it in every answer.

${fullContext}

${pageContext ? `\nCURRENT VIEW CONTEXT:\n${pageContext}` : ""}`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
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
