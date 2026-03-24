import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import {
  validateHR,
  calculateTRIMP,
  calculateACWR,
  getRiskFlag,
} from "@/lib/validation";

interface PlayerEntry {
  id: string;
  attended: boolean;
  hrAvg?: number;
  hrMax?: number;
}

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const authClient = await createClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("users")
      .select("*")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "No profile found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      date,
      type,
      duration,
      location,
      ageGroup,
      players,
    }: {
      date: string;
      type: string;
      duration: number;
      location: string;
      ageGroup: string;
      players: PlayerEntry[];
    } = body;

    // Validation
    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }
    if (
      !type ||
      !["training", "match", "friendly", "recovery"].includes(type)
    ) {
      return NextResponse.json(
        { error: "Valid session type is required" },
        { status: 400 }
      );
    }
    if (!duration || duration < 1 || duration > 600) {
      return NextResponse.json(
        { error: "Duration must be between 1 and 600 minutes" },
        { status: 400 }
      );
    }
    if (!players || !Array.isArray(players) || players.length === 0) {
      return NextResponse.json(
        { error: "At least one player is required" },
        { status: 400 }
      );
    }

    const attendingPlayers = players.filter((p) => p.attended);
    if (attendingPlayers.length === 0) {
      return NextResponse.json(
        { error: "At least one player must be marked as attending" },
        { status: 400 }
      );
    }

    // Validate HR data for players that have it
    const playersWithMetrics = attendingPlayers.filter(
      (p) => p.hrAvg != null && p.hrMax != null
    );
    for (const p of playersWithMetrics) {
      const hrCheck = validateHR(p.hrAvg!, p.hrMax!);
      if (!hrCheck.valid) {
        return NextResponse.json(
          { error: `Player ${p.id}: ${hrCheck.error}` },
          { status: 400 }
        );
      }
    }

    // Determine status based on whether metrics were provided
    const hasMetrics = playersWithMetrics.length > 0;
    const status = hasMetrics ? "completed" : "planned";

    // 1. Create session
    const { data: session, error: sessError } = await admin
      .from("sessions")
      .insert({
        academy_id: profile.academy_id,
        coach_id: profile.id,
        date,
        type,
        duration_minutes: duration,
        location,
        age_group: ageGroup,
        status,
      })
      .select()
      .single();

    if (sessError) {
      return NextResponse.json(
        { error: sessError.message },
        { status: 500 }
      );
    }

    // 2. Create attendance records for all attending players
    const attendanceRecords = attendingPlayers.map((p) => ({
      session_id: session.id,
      player_id: p.id,
      attended: true,
    }));

    const { error: attError } = await admin
      .from("session_attendance")
      .insert(attendanceRecords);

    if (attError) {
      console.error("Attendance insert error:", attError.message);
    }

    // 3. Create wearable_metrics for players with HR data
    if (hasMetrics) {
      const metricsRecords = playersWithMetrics.map((p) => ({
        session_id: session.id,
        player_id: p.id,
        hr_avg: p.hrAvg!,
        hr_max: p.hrMax!,
        trimp_score: calculateTRIMP(duration, p.hrAvg!, p.hrMax!),
      }));

      const { error: metError } = await admin
        .from("wearable_metrics")
        .insert(metricsRecords);

      if (metError) {
        console.error("Metrics insert error:", metError.message);
      }

      // 4. Calculate ACWR / load_records for players with metrics
      const weekStart = getWeekStart(date);

      for (const p of playersWithMetrics) {
        const trimp = calculateTRIMP(duration, p.hrAvg!, p.hrMax!);

        // Get recent load data for ACWR calculation
        const { data: recentSessions } = await admin
          .from("wearable_metrics")
          .select("trimp_score, session_id")
          .eq("player_id", p.id)
          .order("created_at", { ascending: false })
          .limit(30);

        // Simple ACWR: last 7 entries vs last 28 entries
        const allLoads = (recentSessions ?? []).map(
          (s: any) => s.trimp_score ?? 0
        );
        const acuteLoads = allLoads.slice(0, 7);
        const chronicLoads = allLoads.slice(0, 28);

        const acwr = calculateACWR(acuteLoads, chronicLoads);
        const riskFlag = getRiskFlag(acwr);

        const { error: loadError } = await admin
          .from("load_records")
          .upsert(
            {
              player_id: p.id,
              session_id: session.id,
              acwr_ratio: acwr,
              risk_flag: riskFlag,
              week_start: weekStart,
            },
            { onConflict: "player_id,session_id" }
          );

        if (loadError) {
          console.error(
            "Load record error for",
            p.id,
            ":",
            loadError.message
          );
        }
      }
    }

    return NextResponse.json({ session });
  } catch (err) {
    console.error("Session log error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to log session",
      },
      { status: 500 }
    );
  }
}

function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split("T")[0];
}
