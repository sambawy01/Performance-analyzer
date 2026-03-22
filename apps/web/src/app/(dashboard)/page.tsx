import { createClient } from "@/lib/supabase/server";
import {
  getLatestSession,
  getAlerts,
  getRecentSessions,
  getTrendData,
  getRiskDistribution,
} from "@/lib/queries/dashboard";
import { LatestSessionCard } from "@/components/dashboard/latest-session-card";
import { AlertPanel } from "@/components/dashboard/alert-panel";
import { RecentSessionsTable } from "@/components/dashboard/recent-sessions-table";
import { TrendCharts } from "@/components/dashboard/trend-charts";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("auth_user_id", user!.id)
    .single();

  if (!profile) return null;

  const ageGroups =
    profile.role === "coach" ? profile.age_groups_visible : undefined;

  const [latestSession, alerts, recentSessions, trendData, riskDist] =
    await Promise.all([
      getLatestSession(profile.academy_id, ageGroups),
      getAlerts(profile.academy_id, ageGroups),
      getRecentSessions(profile.academy_id, ageGroups),
      getTrendData(profile.academy_id, ageGroups),
      getRiskDistribution(profile.academy_id, ageGroups),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome, {profile.name}.
          {profile.role === "coach" &&
            ` Viewing: ${(ageGroups ?? []).join(", ")}`}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LatestSessionCard session={latestSession} />
        <AlertPanel alerts={alerts as any} />
      </div>

      <TrendCharts sessions={trendData as any} riskDistribution={riskDist} />

      <RecentSessionsTable sessions={recentSessions as any} />
    </div>
  );
}
