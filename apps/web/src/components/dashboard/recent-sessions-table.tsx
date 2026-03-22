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

interface SessionRow {
  id: string;
  date: string;
  type: string;
  age_group: string;
  location: string;
  wearable_sessions: Array<{ count: number }>;
  videos: Array<{ count: number }>;
}

export function RecentSessionsTable({
  sessions,
}: {
  sessions: SessionRow[];
}) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">Recent Sessions</h3>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Age Group</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No sessions yet.
                </TableCell>
              </TableRow>
            )}
            {sessions.map((s) => {
              const hasW = (s.wearable_sessions?.[0]?.count ?? 0) > 0;
              const hasV = (s.videos?.[0]?.count ?? 0) > 0;
              return (
                <TableRow key={s.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <Link href={`/sessions/${s.id}`} className="hover:underline">
                      {formatDate(s.date)}
                    </Link>
                  </TableCell>
                  <TableCell>{ageGroupLabel(s.age_group)}</TableCell>
                  <TableCell>{sessionTypeLabel(s.type)}</TableCell>
                  <TableCell>{s.location}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {hasW && (
                        <Badge variant="secondary" className="text-xs">
                          W
                        </Badge>
                      )}
                      {hasV && (
                        <Badge variant="secondary" className="text-xs">
                          V
                        </Badge>
                      )}
                      {!hasW && !hasV && (
                        <span className="text-xs text-muted-foreground">--</span>
                      )}
                    </div>
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
