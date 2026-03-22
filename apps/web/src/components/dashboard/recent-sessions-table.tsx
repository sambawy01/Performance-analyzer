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
  duration_minutes?: number | null;
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
              <TableHead>Duration</TableHead>
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
            {sessions.map((s) => (
              <TableRow key={s.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell>
                  <Link href={`/sessions/${s.id}`} className="hover:underline font-medium">
                    {formatDate(s.date)}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{ageGroupLabel(s.age_group)}</Badge>
                </TableCell>
                <TableCell>{sessionTypeLabel(s.type)}</TableCell>
                <TableCell>{s.location}</TableCell>
                <TableCell>
                  {s.duration_minutes ? `${s.duration_minutes} min` : "--"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
