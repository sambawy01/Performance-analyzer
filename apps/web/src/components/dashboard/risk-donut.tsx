"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface RiskDonutProps {
  distribution: { blue: number; green: number; amber: number; red: number };
}

const RISK_COLORS: Record<string, string> = {
  blue: "#00d4ff",
  green: "#00ff88",
  amber: "#ff6b35",
  red: "#ff3355",
};

const RISK_LABELS: Record<string, string> = {
  blue: "Under-training",
  green: "Optimal",
  amber: "Caution",
  red: "High Risk",
};

export default function RiskDonut({ distribution }: RiskDonutProps) {
  const entries = Object.entries(distribution).filter(([, v]) => v > 0);
  const total = entries.reduce((s, [, v]) => s + v, 0);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-[260px] text-sm text-white/30">
        No load data yet.
      </div>
    );
  }

  const pieData = entries.map(([key, value]) => ({
    name: RISK_LABELS[key],
    value,
    color: RISK_COLORS[key],
  }));

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              strokeWidth={0}
              style={{ filter: "drop-shadow(0 0 8px rgba(0,212,255,0.2))" }}
            >
              {pieData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(15, 22, 41, 0.95)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                fontSize: "12px",
                boxShadow: "0 0 20px rgba(0,212,255,0.15)",
                color: "#e2e8f0",
              }}
              formatter={(value) => [`${value} players`]}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold font-mono text-white stat-number">{total}</span>
          <span className="text-[10px] text-white/30 uppercase tracking-widest">
            Players
          </span>
        </div>
      </div>
      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-2">
        {pieData.map((entry) => (
          <div key={entry.name} className="flex items-center gap-1.5">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{
                backgroundColor: entry.color,
                boxShadow: `0 0 6px ${entry.color}40`,
              }}
            />
            <span className="text-xs text-white/40">
              {entry.name}{" "}
              <span className="font-medium font-mono text-white">{entry.value}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
