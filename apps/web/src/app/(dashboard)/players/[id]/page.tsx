import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  getPlayerById,
  getPlayerSessions,
  getPlayerLoadHistory,
} from "@/lib/queries/players";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlayerOverview } from "@/components/players/player-overview";
import { PlayerPhysicalTrends } from "@/components/players/player-physical-trends";
import { PlayerSessionHistory } from "@/components/players/player-session-history";
import { PlayerLoadChart } from "@/components/players/player-load-chart";
import { AiReportChat } from "@/components/ai/ai-report-chat";
import { TalentScore } from "@/components/players/talent-score";
import { InjuryRiskPanel } from "@/components/players/injury-risk-panel";
import { PlayerCvStats } from "@/components/players/player-cv-stats";
import { PlayerProgressTimeline } from "@/components/players/player-progress-timeline";

interface PlayerProfilePageProps {
  params: Promise<{ id: string }>;
}

export default async function PlayerProfilePage({
  params,
}: PlayerProfilePageProps) {
  const { id } = await params;

  const authClient = await createClient();
  const supabase = createAdminClient();

  const [player, sessionMetrics, loadHistory] = await Promise.all([
    getPlayerById(id),
    getPlayerSessions(id),
    getPlayerLoadHistory(id),
  ]);

  // Fetch recent wearable metrics for injury risk panel
  const { data: recentMetricsRaw } = await supabase
    .from("wearable_metrics")
    .select("hr_recovery_60s, trimp_score, created_at")
    .eq("player_id", id)
    .order("created_at", { ascending: false })
    .limit(10);
  const recentMetrics = recentMetricsRaw ?? [];

  // Fetch CV pipeline metrics for this player
  const { data: cvMetricsRaw } = await supabase
    .from("cv_metrics")
    .select("total_distance_m, max_speed_kmh, avg_speed_kmh, sprint_count, sprint_distance_m, high_speed_run_count, accel_events, decel_events, off_ball_movement_score, session_id")
    .eq("player_id", id)
    .order("created_at", { ascending: false })
    .limit(20);
  const cvMetrics = cvMetricsRaw ?? [];

  // Get session dates for CV metrics
  const cvSessionIds = [...new Set(cvMetrics.map((m: any) => m.session_id))];
  const { data: cvSessions } = cvSessionIds.length > 0
    ? await supabase.from("sessions").select("id, date, type").in("id", cvSessionIds)
    : { data: [] };
  const cvSessionMap = new Map((cvSessions ?? []).map((s: any) => [s.id, s]));

  const enrichedCvMetrics = cvMetrics.map((m: any) => ({
    ...m,
    session: cvSessionMap.get(m.session_id) ?? null,
  }));

  // Fetch data for Progress Timeline (last 30 sessions with wearable + CV metrics)
  const { data: progressWearable } = await supabase
    .from("wearable_metrics")
    .select("session_id, trimp_score, hr_recovery_60s")
    .eq("player_id", id)
    .order("created_at", { ascending: false })
    .limit(30);

  const { data: progressCv } = await supabase
    .from("cv_metrics")
    .select("session_id, max_speed_kmh, sprint_count")
    .eq("player_id", id)
    .order("created_at", { ascending: false })
    .limit(30);

  // Get session dates for progress data
  const progressSessionIds = [
    ...new Set([
      ...(progressWearable ?? []).map((m: any) => m.session_id),
      ...(progressCv ?? []).map((m: any) => m.session_id),
    ]),
  ].filter(Boolean);
  const { data: progressSessions } = progressSessionIds.length > 0
    ? await supabase.from("sessions").select("id, date").in("id", progressSessionIds)
    : { data: [] };
  const progressSessionMap = new Map((progressSessions ?? []).map((s: any) => [s.id, s]));

  // Merge wearable and CV data by session
  const wearableBySession = new Map((progressWearable ?? []).map((m: any) => [m.session_id, m]));
  const cvBySession = new Map((progressCv ?? []).map((m: any) => [m.session_id, m]));

  const progressData = progressSessionIds
    .map((sid: string) => {
      const session = progressSessionMap.get(sid);
      const wm = wearableBySession.get(sid);
      const cm = cvBySession.get(sid);
      if (!session?.date) return null;
      return {
        date: session.date,
        trimp: wm?.trimp_score ?? 0,
        hrRecovery: wm?.hr_recovery_60s ?? null,
        maxSpeed: cm?.max_speed_kmh ?? null,
        sprintCount: cm?.sprint_count ?? null,
      };
    })
    .filter(Boolean)
    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (!player) {
    notFound();
  }

  const twentyEightDaysAgo = new Date();
  twentyEightDaysAgo.setDate(twentyEightDaysAgo.getDate() - 28);
  const recentSessionCount = (sessionMetrics || []).filter(
    (m: any) => {
      const date = m.session?.date || m.sessions?.date || m.date;
      return date ? new Date(date) >= twentyEightDaysAgo : false;
    }
  ).length;

  const latestLoad = loadHistory.length > 0 ? loadHistory[0] : null;

  return (
    <div className="space-y-6">
      <Link
        href="/players"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Players
      </Link>

      <PlayerOverview
        player={player as any}
        latestLoad={latestLoad as any}
        sessionCount={recentSessionCount}
      />

      {/* Player Progress Timeline */}
      <PlayerProgressTimeline
        playerId={id}
        playerName={player.name}
        progressData={progressData as any}
      />

      {/* Enhanced Injury Risk Panel */}
      <InjuryRiskPanel
        playerName={player.name}
        loadHistory={loadHistory as any}
        recentMetrics={recentMetrics as any}
      />

      {/* Development Potential Score */}
      <TalentScore
        playerId={id}
        playerName={player.name}
        sessionMetrics={sessionMetrics as any}
        loadHistory={loadHistory as any}
      />

      {/* AI Development Report + Chat */}
      <AiReportChat
        title="AI Development Report"
        reportEndpoint="/api/ai/player-summary"
        chatEndpoint="/api/ai/chat"
        reportBody={{ playerId: id }}
        context={`Player: ${player.name}, ${player.position}, Age Group ${player.age_group}, Jersey #${player.jersey_number}. ${recentSessionCount} sessions in last 28 days. Latest ACWR: ${latestLoad?.acwr_ratio ?? 'N/A'} (${latestLoad?.risk_flag ?? 'N/A'}).`}
        placeholder="Generate a comprehensive AI development report covering physical profile, load management, strengths, development areas, coaching recommendations, and a weekly load prescription."
      />

      {/* CV Pipeline — Physical Performance from Video Tracking */}
      {enrichedCvMetrics.length > 0 && (
        <PlayerCvStats cvMetrics={enrichedCvMetrics as any} />
      )}

      <Tabs defaultValue="physical">
        <TabsList>
          <TabsTrigger value="physical">Physical Trends</TabsTrigger>
          <TabsTrigger value="load">Load Management</TabsTrigger>
          <TabsTrigger value="history">Session History</TabsTrigger>
        </TabsList>

        <TabsContent value="physical" className="mt-4">
          <PlayerPhysicalTrends metrics={sessionMetrics as any} />
        </TabsContent>

        <TabsContent value="load" className="mt-4">
          <PlayerLoadChart loadHistory={loadHistory as any} />
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <PlayerSessionHistory metrics={sessionMetrics as any} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
