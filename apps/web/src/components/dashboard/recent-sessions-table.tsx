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
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="flex items-center gap-2 p-4 pb-3 border-b">
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Recent Sessions</h3>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs font-medium text-muted-foreground">
                Date
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">
                Type
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">
                Age Group
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">
                Location
              </TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">
                Duration
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-sm text-muted-foreground py-8"
                >
                  No sessions yet.
                </TableCell>
              </TableRow>
            )}
            {sessions.map((s) => {
              const typeBg =
                s.type === "match"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                  : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100";

              return (
                <TableRow
                  key={s.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <TableCell>
                    <Link
                      href={`/sessions/${s.id}`}
                      className="hover:underline font-medium text-sm"
                    >
                      {formatDate(s.date)}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-[11px] font-medium ${typeBg}`}
                    >
                      {sessionTypeLabel(s.type)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="text-[11px] font-medium"
                    >
                      {ageGroupLabel(s.age_group)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {s.location}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
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
