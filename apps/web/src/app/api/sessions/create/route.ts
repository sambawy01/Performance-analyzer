import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

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
    const { date, type, duration_minutes, location, notes, age_group } = body;

    // Validation
    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    if (!type || !["training", "match", "friendly", "recovery"].includes(type)) {
      return NextResponse.json(
        { error: "Valid session type is required (training, match, friendly, recovery)" },
        { status: 400 }
      );
    }

    if (duration_minutes && (duration_minutes < 1 || duration_minutes > 600)) {
      return NextResponse.json(
        { error: "Duration must be between 1 and 600 minutes" },
        { status: 400 }
      );
    }

    const { data: session, error } = await admin
      .from("sessions")
      .insert({
        academy_id: profile.academy_id,
        coach_id: profile.id,
        date,
        type,
        duration_minutes: duration_minutes || 90,
        location: location || "HQ",
        age_group: age_group || "2013",
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ session });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create session" },
      { status: 500 }
    );
  }
}
