import { Suspense } from "react";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getSessions } from "@/lib/queries/sessions";
import { SessionFilters } from "@/components/sessions/session-filters";
import { CreateSessionDialog } from "@/components/sessions/create-session-dialog";
import { SessionsListTable } from "@/components/sessions/sessions-list-table";
import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";
import { ClipboardCheck, CalendarDays } from "lucide-react";

import type { Metadata } from "next";
export const metadata: Metadata = { title: "Sessions -- Coach M8" };

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

  // Fetch attendance counts for all sessions (NO FK JOINS)
  const sessionIds = sessions.map((s: any) => s.id);
  let attendanceCounts: Record<string, number> = {};
  if (sessionIds.length > 0) {
    const { data: attendance } = await supabase
      .from("session_attendance")
      .select("session_id")
      .in("session_id", sessionIds);

    if (attendance) {
      for (const a of attendance) {
        attendanceCounts[a.session_id] =
          (attendanceCounts[a.session_id] ?? 0) + 1;
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Sessions</h2>
        <div className="flex items-center gap-3">
          <Link
            href="/log"
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold transition-all duration-200 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #00ff8820, #00ff8808)",
              border: "1px solid rgba(0,255,136,0.25)",
              color: "#00ff88",
            }}
          >
            <ClipboardCheck className="h-4 w-4" />
            Quick Log
          </Link>
          <CreateSessionDialog academyId={profile.academy_id} />
        </div>
      </div>

      <Suspense fallback={<div className="h-10" />}>
        <SessionFilters />
      </Suspense>

      {sessions.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No sessions yet"
          description="Create your first session or use Quick Log to start tracking your team's performance."
          action={{ label: "Quick Log", href: "/log" }}
          accentColor="#06b6d4"
        />
      ) : (
        <SessionsListTable
          sessions={sessions as any}
          attendanceCounts={attendanceCounts}
        />
      )}
    </div>
  );
}
