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
