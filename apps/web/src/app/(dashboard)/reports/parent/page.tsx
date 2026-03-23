import { FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ParentReportCard } from "@/components/reports/parent-report-card";

export default async function ParentReportPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("academy_id")
    .eq("auth_user_id", user!.id)
    .single();

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
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6 text-[#4f46e5]" />
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
