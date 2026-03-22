import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const { messages, context } = await request.json();

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

    const systemPrompt = `You are Opsnerve AI, an elite football performance analyst embedded in a youth football academy's analytics platform. You're having a conversation with a coach or director about their players and sessions.

You have deep expertise in:
- Heart rate zone analysis (Z1-Z5) and what each zone means for youth players
- TRIMP (Training Impulse) scoring and session load quantification
- ACWR (Acute:Chronic Workload Ratio) — optimal 0.8-1.3, caution 1.3-1.5, danger >1.5
- Youth player development (ages 12-16), growth considerations, injury prevention
- Tactical analysis: formations, pressing intensity (PPDA), transitions, compactness
- Periodization and weekly load planning for academy football

Your communication style:
- Direct and actionable — coaches don't have time for fluff
- Always cite specific numbers from the data when available
- Give concrete recommendations ("reduce intensity by 20% tomorrow", not "consider reducing")
- Think like a performance analyst who's been watching every session
- Use football terminology naturally
- Be honest about limitations — if you don't have enough data, say so

${context ? `\nCONTEXT DATA:\n${context}` : ""}

When the coach asks follow-up questions, refer back to the data you were given. If they ask about something you don't have data for, tell them what data would be needed.`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 800,
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
