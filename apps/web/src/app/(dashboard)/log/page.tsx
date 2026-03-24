import type { Metadata } from "next";
export const metadata: Metadata = { title: "Quick Log -- Coach M8" };

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { QuickSessionLogger } from "@/components/sessions/quick-session-logger";

export default async function LogPage() {
  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("users")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  if (!profile) redirect("/login");

  // Fetch all active players grouped by academy
  const { data: players } = await admin
    .from("players")
    .select("id, name, jersey_number, position, age_group, hr_max_measured")
    .eq("academy_id", profile.academy_id)
    .eq("status", "active")
    .order("jersey_number");

  return (
    <div className="max-w-lg mx-auto">
      <QuickSessionLogger players={(players ?? []) as any} />
    </div>
  );
}
