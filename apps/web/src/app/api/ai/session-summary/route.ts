import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { generateSessionSummary } from "@/lib/ai/claude";

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

    // Get wearable metrics (NO FK JOINS)
    const { data: metrics } = await supabase
      .from("wearable_metrics")
      .select("*")
      .eq("session_id", sessionId);

    // Fetch player names separately
    const playerIds = [...new Set((metrics ?? []).map((m: any) => m.player_id))];
    const { data: players } = playerIds.length > 0
      ? await supabase.from("players").select("id, name, position").in("id", playerIds).eq("academy_id", profile.academy_id)
      : { data: [] };
    const playerMap = new Map((players ?? []).map((p: any) => [p.id, p]));

    // Get load alerts
    const { data: loadRecords } = await supabase
      .from("load_records")
      .select("*")
      .eq("session_id", sessionId)
      .in("risk_flag", ["amber", "red"]);

    const summary = await generateSessionSummary({
      date: session.date,
      type: session.type,
      ageGroup: session.age_group,
      location: session.location,
      duration: session.duration_minutes,
      notes: session.notes,
      playerMetrics: (metrics ?? []).map((m: any) => {
        const p = playerMap.get(m.player_id);
        return {
          name: p?.name ?? "Unknown",
          position: p?.position ?? "",
          hr_avg: m.hr_avg,
          hr_max: m.hr_max,
          trimp_score: m.trimp_score,
          hr_zone_1_pct: m.hr_zone_1_pct,
          hr_zone_2_pct: m.hr_zone_2_pct,
          hr_zone_3_pct: m.hr_zone_3_pct,
          hr_zone_4_pct: m.hr_zone_4_pct,
          hr_zone_5_pct: m.hr_zone_5_pct,
        };
      }),
      loadAlerts: (loadRecords ?? []).map((l: any) => {
        const p = playerMap.get(l.player_id);
        return {
          name: p?.name ?? "Unknown",
          acwr_ratio: l.acwr_ratio,
          risk_flag: l.risk_flag,
        };
      }),
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
