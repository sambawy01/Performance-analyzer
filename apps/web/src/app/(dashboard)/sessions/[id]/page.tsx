import { notFound } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getSessionById, getSessionLoadRecords } from "@/lib/queries/sessions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { SessionOverviewTab } from "@/components/sessions/session-overview-tab";
import { SessionPlayersTab } from "@/components/sessions/session-players-tab";
import { SessionTacticalTab } from "@/components/sessions/session-tactical-tab";
import { SessionVideoTab } from "@/components/sessions/session-video-tab";
import { SessionAiReportTab } from "@/components/sessions/session-ai-report-tab";
import {
  formatDate,
  ageGroupLabel,
  sessionTypeLabel,
} from "@/lib/format";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";


interface SessionDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function SessionDetailPage({
  params,
}: SessionDetailPageProps) {
  const { id } = await params;
  const authClient = await createClient();
  const supabase = createAdminClient();
  const [session, loadRecords] = await Promise.all([
    getSessionById(id),
    getSessionLoadRecords(id),
  ]);

  // Fetch CV metrics + resolve player names separately (FK join fails on Supabase Cloud)
  const { data: rawCvMetrics } = await supabase
    .from("cv_metrics")
    .select("*")
    .eq("session_id", id);

  // Enrich with player data
  const cvPlayerIds = (rawCvMetrics ?? []).map((m: any) => m.player_id);
  const { data: cvPlayers } = cvPlayerIds.length > 0
    ? await supabase.from("players").select("id, name, jersey_number, position").in("id", cvPlayerIds)
    : { data: [] };
  const cvPlayerMap = new Map((cvPlayers ?? []).map((p: any) => [p.id, p]));
  const cvMetrics = (rawCvMetrics ?? []).map((m: any) => ({
    ...m,
    players: cvPlayerMap.get(m.player_id) ?? null,
  }));

  // Fetch tactical data
  const { data: tactical } = await supabase
    .from("tactical_metrics")
    .select("*")
    .eq("session_id", id)
    .single();

  // Fetch tactical history for comparison
  const { data: allTactical } = await supabase
    .from("tactical_metrics")
    .select("session_id, avg_formation, compactness_avg, pressing_intensity, possession_pct, transition_speed_atk_s, transition_speed_def_s")
    .neq("session_id", id)
    .limit(10);

  // Get dates for tactical history
  const tacticalSessionIds = (allTactical ?? []).map((t: any) => t.session_id);
  const { data: tactSessions } = tacticalSessionIds.length > 0
    ? await supabase.from("sessions").select("id, date, type").in("id", tacticalSessionIds)
    : { data: [] };
  const tactSessionMap = new Map((tactSessions ?? []).map((s: any) => [s.id, s]));
  const tacticalHistory = allTactical ?? [];

  // Flatten tactical history with session dates
  const tactHistory = (tacticalHistory ?? []).map((t: any) => {
    const sess = tactSessionMap.get(t.session_id);
    return {
    session_id: t.session_id,
    date: sess?.date ?? "",
    type: sess?.type ?? "",
    pressing_intensity: t.pressing_intensity,
    possession_pct: t.possession_pct,
    compactness_avg: t.compactness_avg,
    transition_speed_atk_s: t.transition_speed_atk_s,
    transition_speed_def_s: t.transition_speed_def_s,
    avg_formation: t.avg_formation,
  };
  });


  if (!session) {
    notFound();
  }

  const coachName = (session as any).users?.name ?? "Unknown coach";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/sessions"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sessions
          </Link>
          <h2 className="text-2xl font-bold">
            {sessionTypeLabel(session.type)} — {formatDate(session.date)}
          </h2>
          <div className="flex gap-2 mt-1">
            <Badge variant="outline">{ageGroupLabel(session.age_group)}</Badge>
            <Badge variant="outline">{session.location}</Badge>
            <Badge variant="secondary">Coach: {coachName}</Badge>
          </div>
        </div>
        <Link
          href={`/live?session=${id}`}
          className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
        >
          Live HR View
        </Link>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="players">
            Players ({(session.wearable_metrics as any[])?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="tactical">Tactical</TabsTrigger>
          <TabsTrigger value="video">Video</TabsTrigger>
          <TabsTrigger value="ai-report">AI Report</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <SessionOverviewTab
            session={session}
            metrics={(session.wearable_metrics as any[]) ?? []}
            cvMetrics={(cvMetrics as any[]) ?? []}
            loadRecords={loadRecords as any}
          />
        </TabsContent>

        <TabsContent value="players">
          <SessionPlayersTab
            metrics={(session.wearable_metrics as any[]) ?? []}
            cvMetrics={(cvMetrics as any[]) ?? []}
            loadRecords={loadRecords as any}
          />
        </TabsContent>

        <TabsContent value="tactical">
          <SessionTacticalTab tactical={tactical as any} history={tactHistory} />
        </TabsContent>

        <TabsContent value="video">
          <SessionVideoTab
            videos={(session.videos as any[]) ?? []}
            tags={(session.video_tags as any[]) ?? []}
            sessionId={id}
          />
        </TabsContent>

        <TabsContent value="ai-report">
          <SessionAiReportTab
            sessionId={id}
            sessionContext={`Session: ${session.type} on ${session.date} at ${session.location}, ${session.duration_minutes ?? '?'} min, ${session.age_group} age group. ${(session.wearable_metrics as any[])?.length ?? 0} players tracked. Coach notes: ${session.notes ?? 'none'}. ${loadRecords.length} load records. ${tactical ? `Tactical: ${tactical.avg_formation} formation, ${tactical.pressing_intensity} PPDA, ${tactical.possession_pct}% possession.` : 'No tactical data.'}`}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
