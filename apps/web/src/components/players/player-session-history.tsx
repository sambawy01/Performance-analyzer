import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate, sessionTypeLabel } from "@/lib/format";

interface SessionMetric {
  hr_avg: number;
  hr_max: number;
  trimp_score: number;
  hr_recovery_60s: number | null;
  sessions: {
    id: string;
    date: string;
    type: string;
    location: string;
  };
}

export function PlayerSessionHistory({
  metrics,
}: {
  metrics: SessionMetric[];
}) {
  if (metrics.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Session History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No session history yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  const sorted = [...metrics].sort(
    (a, b) =>
      new Date(b.sessions.date).getTime() -
      new Date(a.sessions.date).getTime()
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Session History</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="text-right">Avg HR</TableHead>
              <TableHead className="text-right">Max HR</TableHead>
              <TableHead className="text-right">TRIMP</TableHead>
              <TableHead className="text-right">Recovery</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((m, i) => (
              <TableRow key={i}>
                <TableCell>{formatDate(m.sessions.date)}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {sessionTypeLabel(m.sessions.type)}
                  </Badge>
                </TableCell>
                <TableCell>{m.sessions.location}</TableCell>
                <TableCell className="text-right">{m.hr_avg} bpm</TableCell>
                <TableCell className="text-right">{m.hr_max} bpm</TableCell>
                <TableCell className="text-right">
                  {Math.round(m.trimp_score)}
                </TableCell>
                <TableCell className="text-right">
                  {m.hr_recovery_60s !== null ? `${m.hr_recovery_60s} bpm` : "--"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
