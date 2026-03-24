import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function PATCH(request: NextRequest) {
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
      .select("academy_id")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "No profile found" }, { status: 404 });
    }

    const { sessionId, status } = await request.json();

    if (!sessionId || !status) {
      return NextResponse.json(
        { error: "sessionId and status are required" },
        { status: 400 }
      );
    }

    if (!["planned", "active", "completed", "reviewed"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    const { data: session, error } = await admin
      .from("sessions")
      .update({ status })
      .eq("id", sessionId)
      .eq("academy_id", profile.academy_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ session });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to update status",
      },
      { status: 500 }
    );
  }
}
