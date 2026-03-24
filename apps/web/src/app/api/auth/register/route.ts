import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, inviteCode } = await request.json();

    if (!name || !email || !password || !inviteCode) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Validate invite code
    const { data: invite, error: inviteError } = await supabase
      .from("invite_codes")
      .select("*")
      .eq("code", inviteCode.trim().toUpperCase())
      .single();

    if (inviteError || !invite) {
      return NextResponse.json(
        { error: "Invalid invite code" },
        { status: 400 }
      );
    }

    // Check if expired
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "This invite code has expired" },
        { status: 400 }
      );
    }

    // Check if max uses reached
    if (invite.use_count >= invite.max_uses) {
      return NextResponse.json(
        { error: "This invite code has been fully used" },
        { status: 400 }
      );
    }

    // 2. Create Supabase auth user
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (authError) {
      if (authError.message.includes("already been registered")) {
        return NextResponse.json(
          { error: "An account with this email already exists" },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "Failed to create user account" },
        { status: 500 }
      );
    }

    // 3. Create users record with academy_id and role from invite code
    const { error: profileError } = await supabase.from("users").insert({
      auth_user_id: authData.user.id,
      academy_id: invite.academy_id,
      name,
      email,
      role: invite.role,
      age_groups_visible: ["2010", "2012", "2013"],
    });

    if (profileError) {
      // Cleanup: delete auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: "Failed to create user profile: " + profileError.message },
        { status: 500 }
      );
    }

    // 4. Increment invite code use_count
    await supabase
      .from("invite_codes")
      .update({ use_count: invite.use_count + 1 })
      .eq("id", invite.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Registration failed",
      },
      { status: 500 }
    );
  }
}
