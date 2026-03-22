import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatDate, ageGroupLabel, sessionTypeLabel } from "@/lib/format";
import {
  CalendarDays,
  MapPin,
  Clock,
  Heart,
  Activity,
  ArrowRight,
} from "lucide-react";

interface SessionSummaryCardProps {
  session: {
    id: string;
    date: string;
    type: string;
    age_group: string;
    location: string;
    duration_minutes: number | null;
    notes: string | null;
  } | null;
  wearableMetrics?: {
    avgHr: number;
    peakHr: number;
    avgTrimp: number;
    playersTracked: number;
  } | null;
}

export function SessionSummaryCard({
  session,
  wearableMetrics,
}: SessionSummaryCardProps) {
  if (!session) {
    return (
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <CalendarDays className="h-4 w-4" />
          <span className="text-sm">No sessions recorded yet.</span>
        </div>
      </div>
    );
  }

  const typeBg =
    session.type === "match"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : "bg-blue-50 text-blue-700 border-blue-200";

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5">
        {/* Left: Session info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Latest Session
            </h3>
            <Badge variant="outline" className={typeBg}>
              {sessionTypeLabel(session.type)}
            </Badge>
          </div>
          <p className="text-lg font-bold">{formatDate(session.date)}</p>
          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {session.location}
            </span>
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              {ageGroupLabel(session.age_group)}
            </span>
            {session.duration_minutes && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {session.duration_minutes} min
              </span>
            )}
          </div>
        </div>

        {/* Middle: Key metrics */}
        {wearableMetrics ? (
          <div className="flex gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-rose-500 mb-0.5">
                <Heart className="h-3.5 w-3.5" />
              </div>
              <p className="text-lg font-bold">{wearableMetrics.avgHr}</p>
              <p className="text-[10px] text-muted-foreground">Avg HR</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-red-500 mb-0.5">
                <Heart className="h-3.5 w-3.5" />
              </div>
              <p className="text-lg font-bold">{wearableMetrics.peakHr}</p>
              <p className="text-[10px] text-muted-foreground">Peak HR</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-emerald-500 mb-0.5">
                <Activity className="h-3.5 w-3.5" />
              </div>
              <p className="text-lg font-bold">{wearableMetrics.avgTrimp}</p>
              <p className="text-[10px] text-muted-foreground">TRIMP</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-blue-500 mb-0.5">
                <Activity className="h-3.5 w-3.5" />
              </div>
              <p className="text-lg font-bold">
                {wearableMetrics.playersTracked}
              </p>
              <p className="text-[10px] text-muted-foreground">Tracked</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
            <Activity className="h-3.5 w-3.5" />
            No wearable data
          </div>
        )}

        {/* Right: View button */}
        <Link
          href={`/sessions/${session.id}`}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
        >
          View Session
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
