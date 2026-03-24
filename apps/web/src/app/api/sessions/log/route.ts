import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import {
  calculateTRIMP,
  calculateACWR,
  getRiskFlag,
} from "@/lib/validation";

interface PlayerEntry {
  id: string;
  attended: boolean;
  note?: string;
}

function generateRealisticMetrics(
  type: string,
  duration: number,
  hrMaxMeasured: number | null,
  position: string
) {
  const hrMax = hrMaxMeasured || 200;
  const isGK = position === "GK";

  // Base HR depends on session type
  const hrRanges: Record<string, [number, number]> = {
    training: [145, 170],
    match: [155, 185],
    friendly: [150, 178],
    recovery: [120, 140],
  };
  const [hrLow, hrHigh] = hrRanges[type] || [145, 170];

  // GK has lower HR
  const gkOffset = isGK ? -15 : 0;
  const hrAvg = Math.round(hrLow + Math.random() * (hrHigh - hrLow) + gkOffset);
  const hrPeak = Math.min(hrMax, Math.round(hrAvg + 15 + Math.random() * 20));
  const hrMin = Math.round(hrAvg - 20 - Math.random() * 15);

  // Zone distribution
  const z5 = type === "match" ? Math.round(5 + Math.random() * 10) : Math.round(2 + Math.random() * 5);
  const z4 = Math.round(10 + Math.random() * 15);
  const z3 = Math.round(25 + Math.random() * 15);
  const z2 = Math.round(20 + Math.random() * 15);
  const z1 = 100 - z5 - z4 - z3 - z2;

  const trimp = calculateTRIMP(duration, hrAvg, hrMax);
  const recovery = Math.round(20 + Math.random() * 25); // bpm drop in 60s

  // CV-like metrics
  const distanceBase = isGK ? 3000 : type === "match" ? 8000 : 6000;
  const distance = Math.round(distanceBase + Math.random() * 3000);
  const maxSpeed = isGK ? Math.round(15 + Math.random() * 8) : Math.round(20 + Math.random() * 10);
  const sprintCount = isGK ? Math.round(2 + Math.random() * 4) : Math.round(5 + Math.random() * 15);

  return {
    hrAvg,
    hrMax: hrPeak,
    hrMin,
    z1: Math.max(0, z1),
    z2,
    z3,
    z4,
    z5,
    trimp,
    recovery,
    distance,
    maxSpeed,
    sprintCount,
  };
}

export async function POST(request: NextRequest) {
  try {
    const authClient = await createClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("users")
      .select("*")
      .eq("auth_user_id", user.id)
      .single();
    if (!profile) return NextResponse.json({ error: "No profile found" }, { status: 404 });

    const body = await request.json();
    const {
      date, type, duration, location, ageGroup,
      autoGenerateMetrics, teamNotes, players,
    }: {
      date: string;
      type: string;
      duration: number;
      location: string;
      ageGroup: string;
      autoGenerateMetrics?: boolean;
      teamNotes?: string;
      players: PlayerEntry[];
    } = body;

    if (!date) return NextResponse.json({ error: "Date required" }, { status: 400 });
    if (!type) return NextResponse.json({ error: "Type required" }, { status: 400 });
    if (!duration || duration < 1) return NextResponse.json({ error: "Duration required" }, { status: 400 });
    if (!players?.length) return NextResponse.json({ error: "Players required" }, { status: 400 });

    const attendingPlayers = players.filter((p) => p.attended);
    if (attendingPlayers.length === 0) {
      return NextResponse.json({ error: "At least one player must attend" }, { status: 400 });
    }

    // Build notes from team notes + player notes
    const playerNotesArr = players
      .filter((p) => p.note && p.attended)
      .map((p) => `Player ${p.id}: ${p.note}`);
    const fullNotes = [
      teamNotes || "",
      playerNotesArr.length > 0 ? `\nPlayer Notes:\n${playerNotesArr.join("\n")}` : "",
    ].filter(Boolean).join("\n").trim();

    // 1. Create session (without status column — may not exist on all DBs)
    const sessionInsert: Record<string, any> = {
      academy_id: profile.academy_id,
      date,
      type,
      duration_minutes: duration,
      location: location || "HQ",
      age_group: ageGroup || "2010",
      notes: fullNotes || null,
    };

    const { data: session, error: sessError } = await admin
      .from("sessions")
      .insert(sessionInsert)
      .select()
      .single();

    if (sessError) {
      return NextResponse.json({ error: sessError.message }, { status: 500 });
    }

    // 2. Attendance records
    const attendanceRecords = attendingPlayers.map((p) => ({
      session_id: session.id,
      player_id: p.id,
      attended: true,
    }));
    const { error: attError } = await admin.from("session_attendance").insert(attendanceRecords);
    if (attError) console.error("Attendance error:", attError.message);

    // 3. Auto-generate metrics if requested
    if (autoGenerateMetrics) {
      // Get player details for position-aware metrics
      const playerIds = attendingPlayers.map((p) => p.id);
      const { data: playerDetails } = await admin
        .from("players")
        .select("id, position, hr_max_measured")
        .in("id", playerIds);

      const playerMap = new Map((playerDetails || []).map((p: any) => [p.id, p]));

      // Generate wearable metrics
      const metricsRecords = attendingPlayers.map((p) => {
        const details = playerMap.get(p.id);
        const m = generateRealisticMetrics(
          type, duration,
          details?.hr_max_measured || null,
          details?.position || "CM"
        );
        return {
          session_id: session.id,
          player_id: p.id,
          hr_avg: m.hrAvg,
          hr_max: m.hrMax,
          hr_min: m.hrMin,
          hr_zone_1_pct: m.z1,
          hr_zone_2_pct: m.z2,
          hr_zone_3_pct: m.z3,
          hr_zone_4_pct: m.z4,
          hr_zone_5_pct: m.z5,
          hr_recovery_60s: m.recovery,
          trimp_score: m.trimp,
        };
      });

      const { error: metErr } = await admin.from("wearable_metrics").insert(metricsRecords);
      if (metErr) console.error("Metrics insert error:", metErr.message);

      // Generate load records with ACWR
      const weekStart = getWeekStart(date);
      for (const p of attendingPlayers) {
        const details = playerMap.get(p.id);
        const m = generateRealisticMetrics(type, duration, details?.hr_max_measured, details?.position || "CM");

        const { data: recentMetrics } = await admin
          .from("wearable_metrics")
          .select("trimp_score")
          .eq("player_id", p.id)
          .order("created_at", { ascending: false })
          .limit(30);

        const allLoads = (recentMetrics || []).map((s: any) => s.trimp_score || 0);
        const acwr = calculateACWR(allLoads.slice(0, 7), allLoads.slice(0, 28));
        const riskFlag = getRiskFlag(acwr);

        await admin.from("load_records").upsert({
          player_id: p.id,
          session_id: session.id,
          date,
          acwr_ratio: acwr,
          risk_flag: riskFlag,
          week_start: weekStart,
          daily_load: m.trimp,
          acute_load_7d: allLoads.slice(0, 7).reduce((a: number, b: number) => a + b, 0) / Math.max(1, allLoads.slice(0, 7).length),
          chronic_load_28d: allLoads.slice(0, 28).reduce((a: number, b: number) => a + b, 0) / Math.max(1, allLoads.slice(0, 28).length),
        }, { onConflict: "player_id,session_id" });
      }
    }

    return NextResponse.json({ session });
  } catch (err) {
    console.error("Session log error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to log session" },
      { status: 500 }
    );
  }
}

function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split("T")[0];
}
