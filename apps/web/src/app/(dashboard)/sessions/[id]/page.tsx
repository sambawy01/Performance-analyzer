import { notFound } from "next/navigation";
import { getSessionById, getSessionLoadRecords } from "@/lib/queries/sessions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";

interface SessionDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function SessionDetailPage({
  params,
}: SessionDetailPageProps) {
  const { id } = await params;
  const [session, loadRecords] = await Promise.all([
    getSessionById(id),
    getSessionLoadRecords(id),
  ]);

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
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
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
            loadRecords={loadRecords as any}
          />
        </TabsContent>

        <TabsContent value="players">
          <SessionPlayersTab
            metrics={(session.wearable_metrics as any[]) ?? []}
            loadRecords={loadRecords as any}
          />
        </TabsContent>

        <TabsContent value="tactical">
          <SessionTacticalTab />
        </TabsContent>

        <TabsContent value="video">
          <SessionVideoTab
            videos={(session.videos as any[]) ?? []}
            tags={(session.video_tags as any[]) ?? []}
            sessionId={id}
          />
        </TabsContent>

        <TabsContent value="ai-report">
          <SessionAiReportTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
