import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  formatDate,
  ageGroupLabel,
  sessionTypeLabel,
} from "@/lib/format";
import { CalendarDays } from "lucide-react";

interface SessionRow {
  id: string;
  date: string;
  type: string;
  age_group: string;
  location: string;
  duration_minutes?: number | null;
}

export function RecentSessionsTable({
  sessions,
}: {
  sessions: SessionRow[];
}) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl">
      <div className="flex items-center gap-2 p-4 pb-3 border-b border-white/[0.06]">
        <CalendarDays className="h-4 w-4 text-[#00d4ff]" />
        <h3 className="text-sm font-semibold text-white">Recent Sessions</h3>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-white/[0.06]">
              <TableHead className="text-xs font-medium text-white/60 uppercase tracking-wider">
                Date
              </TableHead>
              <TableHead className="text-xs font-medium text-white/60 uppercase tracking-wider">
                Type
              </TableHead>
              <TableHead className="text-xs font-medium text-white/60 uppercase tracking-wider">
                Age Group
              </TableHead>
              <TableHead className="text-xs font-medium text-white/60 uppercase tracking-wider">
                Location
              </TableHead>
              <TableHead className="text-xs font-medium text-white/60 uppercase tracking-wider">
                Duration
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-sm text-white/60 py-8"
                >
                  No sessions yet.
                </TableCell>
              </TableRow>
            )}
            {sessions.map((s) => {
              const typeBg =
                s.type === "match"
                  ? "bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/20 shadow-[0_0_6px_rgba(0,255,136,0.15)]"
                  : "bg-[#00d4ff]/10 text-[#00d4ff] border-[#00d4ff]/20 shadow-[0_0_6px_rgba(0,212,255,0.15)]";

              return (
                <TableRow
                  key={s.id}
                  className="cursor-pointer border-white/[0.04] hover:bg-white/[0.04] transition-all duration-200"
                >
                  <TableCell>
                    <Link
                      href={`/sessions/${s.id}`}
                      className="hover:text-[#00d4ff] font-medium text-sm text-white transition-colors"
                    >
                      {formatDate(s.date)}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-xs font-medium ${typeBg}`}
                    >
                      {sessionTypeLabel(s.type)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="text-xs font-medium border-white/10 text-white/60"
                    >
                      {ageGroupLabel(s.age_group)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-white/60">
                    {s.location}
                  </TableCell>
                  <TableCell className="text-sm text-white/60 font-mono">
                    {s.duration_minutes ? `${s.duration_minutes} min` : "--"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
