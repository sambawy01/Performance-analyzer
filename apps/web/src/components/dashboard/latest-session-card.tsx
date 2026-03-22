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
import { CalendarDays } from "lucide-react";

interface LatestSessionCardProps {
  session: {
    id: string;
    date: string;
    type: string;
    age_group: string;
    location: string;
    duration_minutes: number | null;
    notes: string | null;
  } | null;
}

export function LatestSessionCard({ session }: LatestSessionCardProps) {
  if (!session) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Latest Session
          </CardTitle>
          <CardDescription>No sessions recorded yet.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          Latest Session
        </CardTitle>
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
        {session.notes && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
            {session.notes}
          </p>
        )}
      </CardContent>
      <CardFooter>
        <Link
          href={`/sessions/${session.id}`}
          className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          View Session
        </Link>
      </CardFooter>
    </Card>
  );
}
