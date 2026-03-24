"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

interface RiskForecastProps {
  data: { day: string; risk: number }[];
  playerName: string;
}

export function RiskForecastChart({ data, playerName }: RiskForecastProps) {
  return (
    <div className="h-36">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff3355" stopOpacity={0.4} />
              <stop offset="50%" stopColor="#f59e0b" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#00ff88" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="day" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
          <ReferenceLine y={60} stroke="rgba(255,51,85,0.3)" strokeDasharray="3 3" label={{ value: "High Risk", fill: "rgba(255,51,85,0.5)", fontSize: 9, position: "right" }} />
          <ReferenceLine y={35} stroke="rgba(245,158,11,0.25)" strokeDasharray="3 3" />
          <Area
            type="monotone"
            dataKey="risk"
            stroke="#ff3355"
            strokeWidth={2}
            fill="url(#riskGrad)"
            dot={{ r: 3, fill: "#ff3355", stroke: "#0a0e1a", strokeWidth: 2 }}
          />
          <Tooltip
            contentStyle={{
              background: "rgba(10,14,26,0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              fontSize: 11,
              color: "white",
            }}
            formatter={(value: any) => [`${value}%`, "Risk"]}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
