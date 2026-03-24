import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { generatePlayerDevelopmentSummary } from "@/lib/ai/claude";

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

    const age = player.dob
      ? Math.floor((Date.now() - new Date(player.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : null;

    // Get recent wearable metrics (NO FK JOINS)
    const { data: metrics } = await supabase
      .from("wearable_metrics")
      .select("session_id, hr_avg, hr_max, trimp_score, hr_zone_1_pct, hr_zone_2_pct, hr_zone_3_pct, hr_zone_4_pct, hr_zone_5_pct, hr_recovery_60s, created_at")
      .eq("player_id", playerId)
      .order("created_at", { ascending: false })
      .limit(15);

    // Fetch session details separately
    const sessionIds = [...new Set((metrics ?? []).map((m) => m.session_id))];
    const { data: sessions } = sessionIds.length > 0
      ? await supabase.from("sessions").select("id, date, type").in("id", sessionIds).eq("academy_id", profile.academy_id)
      : { data: [] };
    const sessionMap = new Map((sessions ?? []).map((s) => [s.id, s]));

    // Get load history
    const { data: loadHistory } = await supabase
      .from("load_records")
      .select("*")
      .eq("player_id", playerId)
      .order("date", { ascending: false })
      .limit(15);

    const sessionsData = (metrics ?? []).map((m: any) => {
      const s = sessionMap.get(m.session_id);
      return {
        date: s?.date ?? "",
        type: s?.type ?? "",
        hr_avg: m.hr_avg,
        hr_max: m.hr_max,
        trimp_score: m.trimp_score,
        hr_zone_1_pct: m.hr_zone_1_pct,
        hr_zone_2_pct: m.hr_zone_2_pct,
        hr_zone_3_pct: m.hr_zone_3_pct,
        hr_zone_4_pct: m.hr_zone_4_pct,
        hr_zone_5_pct: m.hr_zone_5_pct,
        hr_recovery_60s: m.hr_recovery_60s,
      };
    });

    const summary = await generatePlayerDevelopmentSummary({
      name: player.name,
      position: player.position,
      ageGroup: player.age_group,
      age: age ?? 0,
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
