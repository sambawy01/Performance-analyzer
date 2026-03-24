"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface TimelineEntry {
  date: string;
  trimp: number;
  maxSpeed: number;
  distance: number;
}

export function PlayerProgressChart({ data }: { data: TimelineEntry[] }) {
  const formatted = data.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    }),
    distanceKm: parseFloat((d.distance / 1000).toFixed(1)),
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={formatted} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
        <XAxis
          dataKey="label"
          tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 10 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            background: "rgba(15,22,41,0.95)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12,
            fontSize: 11,
            color: "white",
          }}
          labelStyle={{ color: "rgba(255,255,255,0.5)" }}
        />
        <Line
          type="monotone"
          dataKey="trimp"
          name="TRIMP"
          stroke="#a855f7"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: "#a855f7" }}
        />
        <Line
          type="monotone"
          dataKey="maxSpeed"
          name="Max Speed"
          stroke="#00d4ff"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: "#00d4ff" }}
        />
        <Line
          type="monotone"
          dataKey="distanceKm"
          name="Distance (km)"
          stroke="#00ff88"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: "#00ff88" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
