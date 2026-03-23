import { createClient, createAdminClient } from "@/lib/supabase/server";
import { LiveHrDashboard } from "@/components/live/live-hr-dashboard";
import { LiveSessionSelector } from "@/components/live/live-session-selector";
import { Radio } from "lucide-react";

interface LivePageProps {
  searchParams: Promise<{ session?: string }>;
}

export default async function LivePage({ searchParams }: LivePageProps) {
  const params = await searchParams;
  const authClient = await createClient();
  const supabase = createAdminClient();

  const {
    data: { user },
  } = await authClient.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("auth_user_id", user!.id)
    .single();

  if (!profile) return null;

  // Get today's sessions + recent sessions (for selector)
  const today = new Date().toISOString().split("T")[0];
  const { data: recentSessions } = await supabase
    .from("sessions")
    .select("id, date, type, age_group, location")
    .eq("academy_id", profile.academy_id)
    .order("date", { ascending: false })
    .limit(10);

  const sessionId = params.session ?? recentSessions?.[0]?.id;

  // If we have a session, look for any Veo video links attached
  let veoShareUrl: string | null = null;
  let streamUrl: string | null = null;

  if (sessionId) {
    const { data: videos } = await supabase
      .from("videos")
      .select("source_type, source_url, file_url")
      .eq("session_id", sessionId);

    const veoLink = videos?.find((v) => v.source_type === "veo_link");
    if (veoLink?.source_url) {
      veoShareUrl = veoLink.source_url;
    }

    // In the future, stream URL would come from a config table or session metadata
    // For now it can be passed as a query param: ?stream=https://...
    if (params.session && typeof window !== "undefined") {
      // Client-side only
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Radio className="h-6 w-6 text-red-500" />
          <div>
            <h2 className="text-2xl font-bold">Live HR Dashboard</h2>
            <p className="text-sm text-muted-foreground">
              Real-time heart rate monitoring + live video during sessions
            </p>
          </div>
        </div>
      </div>

      <LiveSessionSelector
        sessions={recentSessions ?? []}
        currentSessionId={sessionId}
      />

      {sessionId ? (
        <LiveHrDashboard
          sessionId={sessionId}
          streamUrl={streamUrl}
          veoShareUrl={veoShareUrl}
        />
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>No sessions found. Create a session first.</p>
        </div>
      )}
    </div>
  );
}
