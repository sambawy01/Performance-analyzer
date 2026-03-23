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

  // CV averages for overview
  const cvAvg = cvMetrics.length > 0 ? {
    distance: Math.round(cvMetrics.reduce((s: number, m: any) => s + m.total_distance_m, 0) / cvMetrics.length),
    maxSpeed: (cvMetrics.reduce((s: number, m: any) => s + m.max_speed_kmh, 0) / cvMetrics.length).toFixed(1),
    sprints: Math.round(cvMetrics.reduce((s: number, m: any) => s + m.sprint_count, 0) / cvMetrics.length),
    hsr: Math.round(cvMetrics.reduce((s: number, m: any) => s + m.high_speed_run_count, 0) / cvMetrics.length),
    accel: Math.round(cvMetrics.reduce((s: number, m: any) => s + m.accel_events, 0) / cvMetrics.length),
    decel: Math.round(cvMetrics.reduce((s: number, m: any) => s + m.decel_events, 0) / cvMetrics.length),
    movement: Math.round(cvMetrics.reduce((s: number, m: any) => s + (m.off_ball_movement_score ?? 0), 0) / cvMetrics.length),
  } : null;

  if (!player) {
    notFound();
  }

  const twentyEightDaysAgo = new Date();
  twentyEightDaysAgo.setDate(twentyEightDaysAgo.getDate() - 28);
  const recentSessionCount = sessionMetrics.filter(
    (m: any) => new Date(m.sessions?.date) >= twentyEightDaysAgo
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
      {cvAvg && (
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
          <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-3">Physical Performance — Video Tracking (Avg per Session)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { label: "Distance", value: `${(cvAvg.distance / 1000).toFixed(1)} km`, color: "text-[#00d4ff]" },
              { label: "Top Speed", value: `${cvAvg.maxSpeed} km/h`, color: "text-[#00ff88]" },
              { label: "Sprints", value: cvAvg.sprints, color: "text-[#ff6b35]" },
              { label: "High Speed Runs", value: cvAvg.hsr, color: "text-[#a855f7]" },
              { label: "Accelerations", value: cvAvg.accel, color: "text-[#00d4ff]" },
              { label: "Decelerations", value: cvAvg.decel, color: "text-[#ff3355]" },
              { label: "Movement Score", value: `${cvAvg.movement}/100`, color: "text-[#00ff88]" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2.5 text-center">
                <p className={`font-mono text-lg font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-[10px] text-white/50 uppercase tracking-wider mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
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
