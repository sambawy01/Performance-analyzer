"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from "recharts";

interface IntensityChartProps {
  data: Array<{
    date: string;
    avgHr: number;
    avgTrimp: number;
  }>;
}

export default function IntensityChart({ data }: IntensityChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[260px] text-sm text-muted-foreground">
        No session data in the last 14 days.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="hrGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
        <XAxis
          dataKey="date"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          tick={{ fill: "#9ca3af" }}
        />
        <YAxis
          yAxisId="hr"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          tick={{ fill: "#9ca3af" }}
          domain={["dataMin - 10", "dataMax + 10"]}
          label={{ value: "HR (bpm)", angle: -90, position: "insideLeft", offset: 20, style: { fontSize: 10, fill: "#9ca3af" } }}
        />
        <YAxis
          yAxisId="trimp"
          orientation="right"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          tick={{ fill: "#9ca3af" }}
          label={{ value: "TRIMP", angle: 90, position: "insideRight", offset: 20, style: { fontSize: 10, fill: "#9ca3af" } }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            fontSize: "12px",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
          }}
          labelStyle={{ fontWeight: 600, marginBottom: 4 }}
        />
        <Area
          yAxisId="hr"
          type="monotone"
          dataKey="avgHr"
          stroke="#3b82f6"
          strokeWidth={2}
          fill="url(#hrGradient)"
          name="Avg HR"
          dot={{ r: 3, fill: "#3b82f6", strokeWidth: 0 }}
          activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
        />
        <Line
          yAxisId="trimp"
          type="monotone"
          dataKey="avgTrimp"
          stroke="#f97316"
          strokeWidth={2.5}
          name="Avg TRIMP"
          dot={{ r: 3, fill: "#f97316", strokeWidth: 0 }}
          activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
