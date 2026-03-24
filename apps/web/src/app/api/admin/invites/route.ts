import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const segments = [];
  for (let s = 0; s < 2; s++) {
    let segment = "";
    for (let i = 0; i < 4; i++) {
      segment += chars[Math.floor(Math.random() * chars.length)];
    }
    segments.push(segment);
  }
  return segments.join("-");
}

async function getAuthProfile() {
  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) return null;

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("users")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  return profile;
}

export async function GET() {
  try {
    const profile = await getAuthProfile();
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (profile.role !== "director") {
      return NextResponse.json({ error: "Directors only" }, { status: 403 });
    }

    const admin = createAdminClient();
    const { data: invites, error } = await admin
      .from("invite_codes")
      .select("*")
      .eq("academy_id", profile.academy_id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ invites: invites ?? [] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch invites" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const profile = await getAuthProfile();
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (profile.role !== "director") {
      return NextResponse.json({ error: "Directors only" }, { status: 403 });
    }

    const { role, maxUses, expiryDays } = await request.json();

    if (!role || !["coach", "analyst", "director"].includes(role)) {
      return NextResponse.json(
        { error: "Valid role required (coach, analyst, or director)" },
        { status: 400 }
      );
    }

    const max = maxUses === "unlimited" ? 9999 : parseInt(maxUses, 10) || 1;

    let expiresAt: string | null = null;
    if (expiryDays && expiryDays !== "never") {
      const days = parseInt(expiryDays, 10);
      const d = new Date();
      d.setDate(d.getDate() + days);
      expiresAt = d.toISOString();
    }

    const code = generateCode();

    const admin = createAdminClient();
    const { data: invite, error } = await admin
      .from("invite_codes")
      .insert({
        academy_id: profile.academy_id,
        code,
        role,
        max_uses: max,
        expires_at: expiresAt,
        created_by: profile.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ invite });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to create invite code",
      },
      { status: 500 }
    );
  }
}
