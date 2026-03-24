import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;

    const authClient = await createClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    // Verify session exists
    const { data: session } = await admin
      .from("sessions")
      .select("id, academy_id")
      .eq("id", sessionId)
      .single();

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const { metrics } = await request.json();

    if (!Array.isArray(metrics) || metrics.length === 0) {
      return NextResponse.json(
        { error: "Metrics array is required" },
        { status: 400 }
      );
    }

    // Build insert rows
    const rows = metrics.map(
      (m: {
        playerId: string;
        hrAvg: number;
        hrMax: number;
        trimpScore: number;
      }) => ({
        session_id: sessionId,
        player_id: m.playerId,
        hr_avg: m.hrAvg,
        hr_max: m.hrMax,
        hr_min: Math.round(m.hrAvg * 0.7), // Estimate
        trimp_score: m.trimpScore,
        hr_zone_1_pct: 0,
        hr_zone_2_pct: 0,
        hr_zone_3_pct: 0,
        hr_zone_4_pct: 0,
        hr_zone_5_pct: 0,
      })
    );

    const { error } = await admin.from("wearable_metrics").insert(rows);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: rows.length });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save metrics" },
      { status: 500 }
    );
  }
}
