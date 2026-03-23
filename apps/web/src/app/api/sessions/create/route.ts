import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const { date, type, duration_minutes, location, notes } = await request.json();

    if (!date || !type) {
      return NextResponse.json({ error: "date and type required" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get the first academy (demo)
    const { data: academy } = await supabase
      .from("academies")
      .select("id")
      .limit(1)
      .single();

    if (!academy) {
      return NextResponse.json({ error: "No academy found" }, { status: 404 });
    }

    const { data: session, error } = await supabase
      .from("sessions")
      .insert({
        academy_id: academy.id,
        date,
        type,
        duration_minutes: duration_minutes || 90,
        location: location || "HQ",
        age_group: "2010",
        notes: notes || "",
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
