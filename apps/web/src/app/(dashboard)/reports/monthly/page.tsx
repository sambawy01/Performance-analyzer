import { BarChart3 } from "lucide-react";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { MonthlyReport } from "@/components/reports/monthly-report";
import { redirect } from "next/navigation";

export default async function MonthlyReportPage() {
  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) redirect("/login");

  const supabase = createAdminClient();
  const { data: profile } = await supabase
    .from("users")
    .select("academy_id")
    .eq("auth_user_id", user.id)
    .single();

  if (!profile) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-[#00d4ff]" />
          Monthly Team Report
        </h2>
        <p className="text-sm text-white/50 mt-1">
          Full-squad performance analysis: sessions, load trends, top performers, and AI executive summary
        </p>
      </div>
      <MonthlyReport academyId={profile.academy_id} />
    </div>
  );
}
