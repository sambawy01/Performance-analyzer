import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { generatePlayerDevelopmentSummary } from "@/lib/ai/claude";

export async function POST(request: NextRequest) {
  try {
    const { playerId } = await request.json();
    if (!playerId) {
      return NextResponse.json({ error: "playerId required" }, { status: 400 });
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

    // Verify auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get player
    const { data: player } = await supabase
      .from("players")
      .select("*")
      .eq("id", playerId)
      .single();

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const age = Math.floor((Date.now() - new Date(player.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));

    // Get recent sessions with metrics
    const { data: metrics } = await supabase
      .from("wearable_metrics")
      .select("*, sessions!inner(date, type)")
      .eq("player_id", playerId)
      .order("created_at", { ascending: false })
      .limit(15);

    // Get load history
    const { data: loadHistory } = await supabase
      .from("load_records")
      .select("*")
      .eq("player_id", playerId)
      .order("date", { ascending: false })
      .limit(15);

    const sessionsData = (metrics ?? []).map((m: any) => ({
      date: m.sessions?.date ?? "",
      type: m.sessions?.type ?? "",
      hr_avg: m.hr_avg,
      hr_max: m.hr_max,
      trimp_score: m.trimp_score,
      hr_zone_1_pct: m.hr_zone_1_pct,
      hr_zone_2_pct: m.hr_zone_2_pct,
      hr_zone_3_pct: m.hr_zone_3_pct,
      hr_zone_4_pct: m.hr_zone_4_pct,
      hr_zone_5_pct: m.hr_zone_5_pct,
      hr_recovery_60s: m.hr_recovery_60s,
    }));

    const summary = await generatePlayerDevelopmentSummary({
      name: player.name,
      position: player.position,
      ageGroup: player.age_group,
      age,
      sessionsData,
      loadHistory: (loadHistory ?? []).map((l: any) => ({
        date: l.date,
        daily_load: l.daily_load,
        acwr_ratio: l.acwr_ratio,
        risk_flag: l.risk_flag,
      })),
    });

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Player summary error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate summary" },
      { status: 500 }
    );
  }
}
