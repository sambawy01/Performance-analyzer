"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface SessionMetric {
  hr_avg: number;
  hr_max: number;
  trimp_score: number;
  hr_recovery_60s: number | null;
  sessions: {
    date: string;
    type: string;
  };
}

export function PlayerPhysicalTrends({
  metrics,
}: {
  metrics: SessionMetric[];
}) {
  if (metrics.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Physical Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No session data yet. Physical trends will appear once this player
            has wearable data from at least 2 sessions.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Sort by date ascending for chart
  const sorted = [...metrics].sort(
    (a, b) =>
      new Date(a.sessions.date).getTime() -
      new Date(b.sessions.date).getTime()
  );

  const chartData = sorted.map((m) => ({
    date: new Date(m.sessions.date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    }),
    avgHr: m.hr_avg,
    maxHr: m.hr_max,
    trimp: Math.round(m.trimp_score),
    recovery: m.hr_recovery_60s,
  }));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Heart Rate Over Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis fontSize={12} domain={["auto", "auto"]} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="avgHr"
                stroke="#3b82f6"
                name="Avg HR"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="maxHr"
                stroke="#ef4444"
                name="Max HR"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Training Load (TRIMP)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="trimp"
                stroke="#f97316"
                name="TRIMP"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {chartData.some((d) => d.recovery !== null) && (
        <Card>
          <CardHeader>
            <CardTitle>HR Recovery (60s)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData.filter((d) => d.recovery !== null)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="recovery"
                  stroke="#22c55e"
                  name="Recovery (bpm drop)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
