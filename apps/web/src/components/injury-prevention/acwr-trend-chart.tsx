"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from "recharts";

interface AcwrTrendProps {
  data: { week: string; acwr: number }[];
  playerName: string;
}

export function AcwrTrendChart({ data, playerName }: AcwrTrendProps) {
  return (
    <div className="h-40">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="acwrGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="week" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 2]} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
          {/* Safe zone band */}
          <ReferenceLine y={0.8} stroke="rgba(0,255,136,0.2)" strokeDasharray="3 3" />
          <ReferenceLine y={1.3} stroke="rgba(245,158,11,0.3)" strokeDasharray="3 3" label={{ value: "Caution", fill: "rgba(245,158,11,0.4)", fontSize: 9, position: "right" }} />
          <ReferenceLine y={1.5} stroke="rgba(255,51,85,0.3)" strokeDasharray="3 3" label={{ value: "Danger", fill: "rgba(255,51,85,0.4)", fontSize: 9, position: "right" }} />
          <Area type="monotone" dataKey="acwr" stroke="none" fill="url(#acwrGrad)" />
          <Line
            type="monotone"
            dataKey="acwr"
            stroke="#22d3ee"
            strokeWidth={2}
            dot={{ r: 3, fill: "#22d3ee", stroke: "#0a0e1a", strokeWidth: 2 }}
            activeDot={{ r: 5, fill: "#22d3ee", stroke: "white", strokeWidth: 2 }}
          />
          <Tooltip
            contentStyle={{
              background: "rgba(10,14,26,0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              fontSize: 11,
              color: "white",
            }}
            labelStyle={{ color: "rgba(255,255,255,0.5)" }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
