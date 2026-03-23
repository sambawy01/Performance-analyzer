import { Suspense } from "react";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getSessions } from "@/lib/queries/sessions";
import { SessionFilters } from "@/components/sessions/session-filters";
import { CreateSessionDialog } from "@/components/sessions/create-session-dialog";
import { RecentSessionsTable } from "@/components/dashboard/recent-sessions-table";

interface SessionsPageProps {
  searchParams: Promise<{
    age_group?: string;
    type?: string;
  }>;
}

export default async function SessionsPage({ searchParams }: SessionsPageProps) {
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

  const sessions = await getSessions(profile.academy_id, {
    ageGroup: params.age_group,
    type: params.type,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Sessions</h2>
        <CreateSessionDialog academyId={profile.academy_id} />
      </div>

      <Suspense fallback={<div className="h-10" />}>
        <SessionFilters />
      </Suspense>

      <RecentSessionsTable sessions={sessions as any} />
    </div>
  );
}
