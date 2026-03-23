"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const PLAYER_COLORS = ["#00d4ff", "#00ff88", "#ff6b35", "#a855f7"];

interface RadarDataPoint {
  subject: string;
  [key: string]: string | number;
}

interface ComparisonRadarProps {
  data: RadarDataPoint[];
  playerNames: string[];
}

export function ComparisonRadar({ data, playerNames }: ComparisonRadarProps) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
        <PolarGrid stroke="rgba(255,255,255,0.08)" />
        <PolarAngleAxis
          dataKey="subject"
          tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
        />
        <Tooltip
          contentStyle={{
            background: "rgba(10,14,26,0.95)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px",
            fontSize: "12px",
          }}
          labelStyle={{ color: "white" }}
          itemStyle={{ color: "rgba(255,255,255,0.7)" }}
        />
        {playerNames.map((name, i) => (
          <Radar
            key={name}
            name={name}
            dataKey={name}
            stroke={PLAYER_COLORS[i % PLAYER_COLORS.length]}
            fill={PLAYER_COLORS[i % PLAYER_COLORS.length]}
            fillOpacity={0.1}
            strokeWidth={2}
          />
        ))}
        <Legend
          wrapperStyle={{ fontSize: "12px", color: "rgba(255,255,255,0.6)" }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
