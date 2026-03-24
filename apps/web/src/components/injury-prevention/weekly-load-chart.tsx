"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from "recharts";

interface WeeklyLoadProps {
  data: { day: string; load: number; type: string | null }[];
  optimalLow: number;
  optimalHigh: number;
}

export function WeeklyLoadChart({ data, optimalLow, optimalHigh }: WeeklyLoadProps) {
  return (
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="day" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
          {/* Optimal zone band */}
          <ReferenceArea y1={optimalLow} y2={optimalHigh} fill="rgba(0,255,136,0.06)" strokeOpacity={0} />
          <ReferenceLine y={optimalLow} stroke="rgba(0,255,136,0.2)" strokeDasharray="4 4" />
          <ReferenceLine y={optimalHigh} stroke="rgba(0,255,136,0.2)" strokeDasharray="4 4" />
          <Bar
            dataKey="load"
            radius={[6, 6, 0, 0]}
            fill="#22d3ee"
            fillOpacity={0.7}
            maxBarSize={40}
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
            formatter={(value: any) => [`${value} TRIMP`, "Load"]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
