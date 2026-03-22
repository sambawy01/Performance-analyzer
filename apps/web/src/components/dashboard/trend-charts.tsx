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
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface TrendSession {
  id: string;
  date: string;
  wearable_metrics: Array<{
    hr_avg: number;
    hr_max: number;
    trimp_score: number;
  }>;
}

interface TrendChartsProps {
  sessions: TrendSession[];
  riskDistribution: { blue: number; green: number; amber: number; red: number };
}

const RISK_COLORS = {
  blue: "#3b82f6",
  green: "#22c55e",
  amber: "#f59e0b",
  red: "#ef4444",
};

export function TrendCharts({ sessions, riskDistribution }: TrendChartsProps) {
  // Aggregate per-session averages
  const intensityData = sessions.map((s) => {
    const metrics = s.wearable_metrics ?? [];
    const avgHr =
      metrics.length > 0
        ? Math.round(metrics.reduce((sum, m) => sum + m.hr_avg, 0) / metrics.length)
        : 0;
    const avgTrimp =
      metrics.length > 0
        ? Math.round(
            metrics.reduce((sum, m) => sum + m.trimp_score, 0) / metrics.length
          )
        : 0;

    return {
      date: new Date(s.date).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      }),
      avgHr,
      avgTrimp,
    };
  });

  const pieData = Object.entries(riskDistribution)
    .filter(([, value]) => value > 0)
    .map(([key, value]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value,
    }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Session Intensity (14 days)</CardTitle>
        </CardHeader>
        <CardContent>
          {intensityData.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={intensityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
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
                  dataKey="avgTrimp"
                  stroke="#f97316"
                  name="Avg TRIMP"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Injury Risk Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {pieData.length === 0 ? (
            <p className="text-sm text-muted-foreground">No load data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {pieData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={
                        RISK_COLORS[
                          entry.name.toLowerCase() as keyof typeof RISK_COLORS
                        ]
                      }
                    />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
