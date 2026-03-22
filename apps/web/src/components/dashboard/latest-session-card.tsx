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
            <CalendarDays className="h-5 w-5 text-[#00d4ff]" />
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
          <CalendarDays className="h-5 w-5 text-[#00d4ff]" />
          Latest Session
        </CardTitle>
        <CardDescription>{formatDate(session.date)}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge variant="outline" className={
            session.type === "match"
              ? "bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/20"
              : "bg-[#00d4ff]/10 text-[#00d4ff] border-[#00d4ff]/20"
          }>
            {sessionTypeLabel(session.type)}
          </Badge>
          <Badge variant="outline" className="border-white/10 text-white/60">
            {ageGroupLabel(session.age_group)}
          </Badge>
          <Badge variant="outline" className="border-white/10 text-white/60">
            {session.location}
          </Badge>
          {session.duration_minutes && (
            <Badge variant="secondary" className="font-mono">
              {session.duration_minutes} min
            </Badge>
          )}
        </div>
        {session.notes && (
          <p className="text-sm text-white/60 mt-2 line-clamp-2 italic">
            {session.notes}
          </p>
        )}
      </CardContent>
      <CardFooter>
        <Link
          href={`/sessions/${session.id}`}
          className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[#00d4ff] to-[#a855f7] px-3 py-1.5 text-sm font-medium text-white hover:shadow-[0_0_20px_rgba(0,212,255,0.4)] transition-all duration-300"
        >
          View Session
        </Link>
      </CardFooter>
    </Card>
  );
}
