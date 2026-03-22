import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  getPlayerById,
  getPlayerSessions,
  getPlayerLoadHistory,
} from "@/lib/queries/players";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlayerOverview } from "@/components/players/player-overview";
import { PlayerPhysicalTrends } from "@/components/players/player-physical-trends";
import { PlayerSessionHistory } from "@/components/players/player-session-history";
import { PlayerLoadChart } from "@/components/players/player-load-chart";
import { PlayerDevelopment } from "@/components/players/player-development";

interface PlayerProfilePageProps {
  params: Promise<{ id: string }>;
}

export default async function PlayerProfilePage({
  params,
}: PlayerProfilePageProps) {
  const { id } = await params;

  const [player, sessionMetrics, loadHistory] = await Promise.all([
    getPlayerById(id),
    getPlayerSessions(id),
    getPlayerLoadHistory(id),
  ]);

  if (!player) {
    notFound();
  }

  // Count sessions in last 28 days
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

      <Tabs defaultValue="physical">
        <TabsList>
          <TabsTrigger value="physical">Physical Trends</TabsTrigger>
          <TabsTrigger value="load">Load Management</TabsTrigger>
          <TabsTrigger value="history">Session History</TabsTrigger>
          <TabsTrigger value="development">Development</TabsTrigger>
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

        <TabsContent value="development" className="mt-4">
          <PlayerDevelopment />
        </TabsContent>
      </Tabs>
    </div>
  );
}
