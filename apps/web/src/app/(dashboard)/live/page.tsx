import { createClient } from "@/lib/supabase/server";
import { LiveHrDashboard } from "@/components/live/live-hr-dashboard";
import { LiveSessionSelector } from "@/components/live/live-session-selector";
import { Radio } from "lucide-react";

interface LivePageProps {
  searchParams: Promise<{ session?: string }>;
}

export default async function LivePage({ searchParams }: LivePageProps) {
  const params = await searchParams;
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

  // Get today's sessions (most likely candidates for live monitoring)
  const today = new Date().toISOString().split("T")[0];
  const { data: todaySessions } = await supabase
    .from("sessions")
    .select("id, date, type, age_group, location")
    .eq("academy_id", profile.academy_id)
    .gte("date", today)
    .order("date", { ascending: false })
    .limit(10);

  const sessionId = params.session ?? todaySessions?.[0]?.id;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Radio className="h-6 w-6 text-red-500" />
          <div>
            <h2 className="text-2xl font-bold">Live HR Dashboard</h2>
            <p className="text-sm text-muted-foreground">
              Real-time heart rate monitoring during active sessions
            </p>
          </div>
        </div>
      </div>

      <LiveSessionSelector
        sessions={todaySessions ?? []}
        currentSessionId={sessionId}
      />

      {sessionId ? (
        <LiveHrDashboard sessionId={sessionId} />
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>No sessions found for today. Create a session first.</p>
        </div>
      )}
    </div>
  );
}
