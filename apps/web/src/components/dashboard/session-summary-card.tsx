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
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl p-5">
        <div className="flex items-center gap-2 text-white/30">
          <CalendarDays className="h-4 w-4" />
          <span className="text-sm">No sessions recorded yet.</span>
        </div>
      </div>
    );
  }

  const typeBg =
    session.type === "match"
      ? "bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/20"
      : "bg-[#00d4ff]/10 text-[#00d4ff] border-[#00d4ff]/20";

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl transition-all duration-300 hover:border-white/[0.15] hover:bg-white/[0.06]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5">
        {/* Left: Session info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">
              Latest Session
            </h3>
            <Badge variant="outline" className={typeBg}>
              {sessionTypeLabel(session.type)}
            </Badge>
          </div>
          <p className="text-lg font-bold text-white">{formatDate(session.date)}</p>
          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-white/30">
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
                <span className="font-mono">{session.duration_minutes} min</span>
              </span>
            )}
          </div>
        </div>

        {/* Middle: Key metrics */}
        {wearableMetrics ? (
          <div className="flex gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-[#ff3355] mb-0.5">
                <Heart className="h-3.5 w-3.5 drop-shadow-[0_0_4px_rgba(255,51,85,0.5)]" />
              </div>
              <p className="text-lg font-bold font-mono text-white stat-number">{wearableMetrics.avgHr}</p>
              <p className="text-[10px] text-white/30 uppercase tracking-wider">Avg HR</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-[#ff3355] mb-0.5">
                <Heart className="h-3.5 w-3.5 drop-shadow-[0_0_4px_rgba(255,51,85,0.5)]" />
              </div>
              <p className="text-lg font-bold font-mono text-white stat-number">{wearableMetrics.peakHr}</p>
              <p className="text-[10px] text-white/30 uppercase tracking-wider">Peak HR</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-[#00ff88] mb-0.5">
                <Activity className="h-3.5 w-3.5 drop-shadow-[0_0_4px_rgba(0,255,136,0.5)]" />
              </div>
              <p className="text-lg font-bold font-mono text-white stat-number">{wearableMetrics.avgTrimp}</p>
              <p className="text-[10px] text-white/30 uppercase tracking-wider">TRIMP</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-[#00d4ff] mb-0.5">
                <Activity className="h-3.5 w-3.5 drop-shadow-[0_0_4px_rgba(0,212,255,0.5)]" />
              </div>
              <p className="text-lg font-bold font-mono text-white stat-number">
                {wearableMetrics.playersTracked}
              </p>
              <p className="text-[10px] text-white/30 uppercase tracking-wider">Tracked</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-white/30 bg-white/[0.03] rounded-lg px-3 py-2 border border-white/[0.06]">
            <Activity className="h-3.5 w-3.5" />
            No wearable data
          </div>
        )}

        {/* Right: View button */}
        <Link
          href={`/sessions/${session.id}`}
          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#00d4ff] to-[#a855f7] px-4 py-2 text-sm font-medium text-white hover:shadow-[0_0_20px_rgba(0,212,255,0.4)] transition-all duration-300 shrink-0"
        >
          View Session
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
