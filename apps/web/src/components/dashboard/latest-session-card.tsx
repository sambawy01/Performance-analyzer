import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, ageGroupLabel, sessionTypeLabel } from "@/lib/format";

interface LatestSessionCardProps {
  session: {
    id: string;
    date: string;
    type: string;
    age_group: string;
    location: string;
    duration_minutes: number | null;
    wearable_sessions: Array<{ count: number }>;
    videos: Array<{ count: number }>;
  } | null;
}

export function LatestSessionCard({ session }: LatestSessionCardProps) {
  if (!session) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Latest Session</CardTitle>
          <CardDescription>No sessions recorded yet.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const wearableCount = session.wearable_sessions?.[0]?.count ?? 0;
  const videoCount = session.videos?.[0]?.count ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Latest Session</CardTitle>
        <CardDescription>{formatDate(session.date)}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge variant="outline">{sessionTypeLabel(session.type)}</Badge>
          <Badge variant="outline">{ageGroupLabel(session.age_group)}</Badge>
          <Badge variant="outline">{session.location}</Badge>
          {session.duration_minutes && (
            <Badge variant="secondary">{session.duration_minutes} min</Badge>
          )}
        </div>
        <div className="flex gap-4 text-sm text-muted-foreground">
          {wearableCount > 0 && <span>W: {wearableCount} players</span>}
          {videoCount > 0 && <span>V: {videoCount} videos</span>}
          {wearableCount === 0 && videoCount === 0 && (
            <span>No data sources attached</span>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Link href={`/sessions/${session.id}`} className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          View Session
        </Link>
      </CardFooter>
    </Card>
  );
}
