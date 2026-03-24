import type { Metadata } from "next";
export const metadata: Metadata = { title: "Invites -- Coach M8" };

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { InviteManager } from "@/components/auth/invite-manager";

export default async function InvitesPage() {
  const authClient = await createClient();
  const supabase = createAdminClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  if (!profile || profile.role !== "director") {
    redirect("/");
  }

  // Fetch existing invite codes
  const { data: invites } = await supabase
    .from("invite_codes")
    .select("*")
    .eq("academy_id", profile.academy_id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Invite Codes</h2>
        <p className="text-sm text-white/50">
          Generate invite codes for coaches and analysts to join your academy
        </p>
      </div>
      <InviteManager initialInvites={invites ?? []} />
    </div>
  );
}
