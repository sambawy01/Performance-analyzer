import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { generateSessionSummary } from "@/lib/ai/claude";

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
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get session
    const { data: session } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Get wearable metrics with player names
    const { data: metrics } = await supabase
      .from("wearable_metrics")
      .select("*, players(name, position)")
      .eq("session_id", sessionId);

    // Get load alerts
    const { data: loadRecords } = await supabase
      .from("load_records")
      .select("*, players(name)")
      .eq("session_id", sessionId)
      .in("risk_flag", ["amber", "red"]);

    const summary = await generateSessionSummary({
      date: session.date,
      type: session.type,
      ageGroup: session.age_group,
      location: session.location,
      duration: session.duration_minutes,
      notes: session.notes,
      playerMetrics: (metrics ?? []).map((m: any) => ({
        name: m.players?.name ?? "Unknown",
        position: m.players?.position ?? "",
        hr_avg: m.hr_avg,
        hr_max: m.hr_max,
        trimp_score: m.trimp_score,
        hr_zone_1_pct: m.hr_zone_1_pct,
        hr_zone_2_pct: m.hr_zone_2_pct,
        hr_zone_3_pct: m.hr_zone_3_pct,
        hr_zone_4_pct: m.hr_zone_4_pct,
        hr_zone_5_pct: m.hr_zone_5_pct,
      })),
      loadAlerts: (loadRecords ?? []).map((l: any) => ({
        name: l.players?.name ?? "Unknown",
        acwr_ratio: l.acwr_ratio,
        risk_flag: l.risk_flag,
      })),
    });

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Session summary error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate summary" },
      { status: 500 }
    );
  }
}
