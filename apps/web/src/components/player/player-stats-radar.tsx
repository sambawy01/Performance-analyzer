"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

interface RadarData {
  metric: string;
  value: number;
  avg: number;
}

export function PlayerStatsRadar({ data }: { data: RadarData[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
        <PolarGrid stroke="rgba(255,255,255,0.06)" />
        <PolarAngleAxis
          dataKey="metric"
          tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
        />
        <PolarRadiusAxis
          angle={30}
          domain={[0, 100]}
          tick={false}
          axisLine={false}
        />
        {/* Squad average ghost */}
        <Radar
          name="Squad Avg"
          dataKey="avg"
          stroke="rgba(255,255,255,0.15)"
          fill="rgba(255,255,255,0.03)"
          strokeDasharray="4 4"
        />
        {/* Player */}
        <Radar
          name="You"
          dataKey="value"
          stroke="#00d4ff"
          fill="rgba(0,212,255,0.15)"
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
