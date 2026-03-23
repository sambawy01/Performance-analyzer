import { createClient } from "@/lib/supabase/server";
import { MatchDebrief } from "@/components/debrief/match-debrief";

export default async function DebriefPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("academy_id, name, role")
    .eq("auth_user_id", user!.id)
    .single();

  if (!profile) return null;

  // Fetch sessions with wearable data (only those that have metrics)
  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, date, type, age_group, location")
    .eq("academy_id", profile.academy_id)
    .order("date", { ascending: false })
    .limit(30);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Post-Match Debrief</h2>
        <p className="text-sm text-white/50 mt-1">
          AI-generated match analysis with player ratings, tactical assessment, and recommendations
        </p>
      </div>

      {!sessions || sessions.length === 0 ? (
        <div className="rounded-xl border border-white/[0.08] p-12 text-center">
          <p className="text-white/40">No sessions found. Add sessions to generate debriefs.</p>
        </div>
      ) : (
        <MatchDebrief sessions={sessions} />
      )}
    </div>
  );
}
