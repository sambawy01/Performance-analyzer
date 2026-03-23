import { FileText } from "lucide-react";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { ParentReportCard } from "@/components/reports/parent-report-card";
import { redirect } from "next/navigation";

export default async function ParentReportPage() {
  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) redirect("/login");

  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from("users")
    .select("academy_id")
    .eq("auth_user_id", user!.id)
    .single();

  if (!profile) redirect("/login");

  const { data: players } = await supabase
    .from("players")
    .select("id, name, position, jersey_number, age_group")
    .eq("academy_id", profile!.academy_id)
    .eq("status", "active")
    .order("age_group")
    .order("jersey_number");

  const playerOptions = (players ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    position: p.position,
    jerseyNumber: p.jersey_number,
    ageGroup: `U${2026 - parseInt(p.age_group)}`,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <FileText className="h-6 w-6 text-[#a855f7]" />
          Parent Report Generator
        </h2>
        <p className="text-sm text-white/50 mt-1">
          Generate warm, parent-friendly monthly development reports for each player
        </p>
      </div>
      <ParentReportCard players={playerOptions} />
    </div>
  );
}
