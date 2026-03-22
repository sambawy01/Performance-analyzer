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
  ReferenceLine,
  ReferenceArea,
  Legend,
} from "recharts";

interface LoadRecord {
  date: string;
  acwr_ratio: number;
  risk_flag: string;
  acute_load: number;
  chronic_load: number;
}

export function PlayerLoadChart({ loadHistory }: { loadHistory: LoadRecord[] }) {
  if (loadHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Load Management (ACWR)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No load data yet. ACWR trends will appear after the player
            accumulates enough session history.
          </p>
        </CardContent>
      </Card>
    );
  }

  const sorted = [...loadHistory].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const chartData = sorted.map((r) => ({
    date: new Date(r.date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    }),
    acwr: r.acwr_ratio,
    acute: r.acute_load,
    chronic: r.chronic_load,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Load Management (ACWR)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-4 rounded bg-green-400" /> Safe
            zone (0.8 – 1.3)
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-4 rounded bg-amber-400" /> Caution
            (&gt; 1.3)
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-4 rounded bg-red-400" /> High risk
            (&gt; 1.5)
          </span>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" fontSize={12} />
            <YAxis
              fontSize={12}
              domain={[0, 2.5]}
              tickFormatter={(v) => v.toFixed(1)}
            />
            <Tooltip formatter={(v) => (typeof v === "number" ? v.toFixed(2) : v)} />
            <Legend />

            {/* Risk zone bands */}
            <ReferenceArea y1={0} y2={0.8} fill="#3b82f620" />
            <ReferenceArea y1={0.8} y2={1.3} fill="#22c55e20" />
            <ReferenceArea y1={1.3} y2={1.5} fill="#f9731620" />
            <ReferenceArea y1={1.5} y2={2.5} fill="#ef444420" />

            {/* Reference lines */}
            <ReferenceLine y={1.0} stroke="#6b7280" strokeDasharray="4 2" />
            <ReferenceLine y={1.3} stroke="#f97316" strokeDasharray="4 2" />
            <ReferenceLine y={1.5} stroke="#ef4444" strokeDasharray="4 2" />

            <Line
              type="monotone"
              dataKey="acwr"
              stroke="#6366f1"
              name="ACWR"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
