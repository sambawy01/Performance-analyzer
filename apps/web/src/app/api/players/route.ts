import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
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
    const { name, jerseyNumber, position, ageGroup, dominantFoot, heightCm, weightKg } = body;

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Player name is required" }, { status: 400 });
    }

    if (jerseyNumber === undefined || jerseyNumber === null || jerseyNumber === "") {
      return NextResponse.json({ error: "Jersey number is required" }, { status: 400 });
    }

    if (!position) {
      return NextResponse.json({ error: "Position is required" }, { status: 400 });
    }

    // Check jersey number uniqueness within academy
    const { data: existing } = await admin
      .from("players")
      .select("id")
      .eq("academy_id", profile.academy_id)
      .eq("jersey_number", parseInt(jerseyNumber, 10))
      .eq("status", "active")
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: `Jersey number ${jerseyNumber} is already taken` },
        { status: 400 }
      );
    }

    const { data: player, error } = await admin
      .from("players")
      .insert({
        academy_id: profile.academy_id,
        name: name.trim(),
        jersey_number: parseInt(jerseyNumber, 10),
        position,
        age_group: ageGroup || "2013",
        dominant_foot: dominantFoot || "right",
        height_cm: heightCm ? parseFloat(heightCm) : null,
        weight_kg: weightKg ? parseFloat(weightKg) : null,
        status: "active",
        consent_status: "pending",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ player });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create player" },
      { status: 500 }
    );
  }
}
