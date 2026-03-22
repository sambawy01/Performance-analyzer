"use client";

import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  Cell,
  ErrorBar,
} from "recharts";

interface CandleData {
  date: string;
  avgHr: number;
  hrLow: number;
  hrHigh: number;
  avgTrimp: number;
  trimpLow: number;
  trimpHigh: number;
  players: number;
}

interface IntensityChartProps {
  data: CandleData[];
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;

  const d = payload[0]?.payload;
  if (!d) return null;

  return (
    <div className="bg-[#0f1629]/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-[0_0_20px_rgba(0,212,255,0.15)] p-3 text-xs">
      <p className="font-semibold text-sm mb-2 text-white">{label}</p>
      {d.avgHr > 0 ? (
        <>
          <div className="space-y-1">
            <div className="flex justify-between gap-6">
              <span className="text-white/40 uppercase text-[10px] tracking-wider">HR Range</span>
              <span className="font-mono font-medium text-white">{d.hrLow} - {d.hrHigh} bpm</span>
            </div>
            <div className="flex justify-between gap-6">
              <span className="text-white/40 uppercase text-[10px] tracking-wider">Avg HR</span>
              <span className="font-mono font-semibold text-[#00d4ff]">{d.avgHr} bpm</span>
            </div>
            <div className="flex justify-between gap-6">
              <span className="text-white/40 uppercase text-[10px] tracking-wider">TRIMP Range</span>
              <span className="font-mono font-medium text-white">{d.trimpLow} - {d.trimpHigh}</span>
            </div>
            <div className="flex justify-between gap-6">
              <span className="text-white/40 uppercase text-[10px] tracking-wider">Avg TRIMP</span>
              <span className="font-mono font-semibold text-[#ff6b35]">{d.avgTrimp}</span>
            </div>
            <div className="flex justify-between gap-6">
              <span className="text-white/40 uppercase text-[10px] tracking-wider">Players</span>
              <span className="font-mono font-medium text-white">{d.players}</span>
            </div>
          </div>
        </>
      ) : (
        <p className="text-white/40">No wearable data</p>
      )}
    </div>
  );
}

export default function IntensityChart({ data }: IntensityChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[260px] text-sm text-white/30">
        No session data in the last 14 days.
      </div>
    );
  }

  const candleData = data.map((d) => ({
    ...d,
    hrBody: d.avgHr > 0 ? [d.hrLow, d.avgHr] : [0, 0],
    hrWickHigh: d.hrHigh,
    hrWickLow: d.hrLow,
  }));

  // Neon colors for intensity levels
  const getIntensityColors = (intensity: number) => {
    if (intensity > 165) return { fill: "#ff3355", fillLight: "rgba(255,51,85,0.3)" };
    if (intensity > 145) return { fill: "#ff6b35", fillLight: "rgba(255,107,53,0.3)" };
    if (intensity > 125) return { fill: "#00d4ff", fillLight: "rgba(0,212,255,0.3)" };
    return { fill: "#00ff88", fillLight: "rgba(0,255,136,0.3)" };
  };

  return (
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={candleData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis
          dataKey="date"
          fontSize={10}
          tickLine={false}
          axisLine={false}
          tick={{ fill: "rgba(255,255,255,0.3)" }}
        />
        <YAxis
          yAxisId="hr"
          fontSize={10}
          tickLine={false}
          axisLine={false}
          tick={{ fill: "rgba(255,255,255,0.3)" }}
          domain={[
            (dataMin: number) => Math.max(0, dataMin - 20),
            (dataMax: number) => dataMax + 15,
          ]}
        />

        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,212,255,0.04)" }} />

        {candleData.map((entry, index) => {
          if (entry.avgHr === 0) return null;
          return null;
        })}

        <Bar
          yAxisId="hr"
          dataKey="avgHr"
          barSize={28}
          shape={(props: any) => {
            const { x, y, width, height, payload } = props;
            if (!payload || payload.avgHr === 0) {
              return (
                <rect
                  x={x}
                  y={y}
                  width={width}
                  height={4}
                  fill="rgba(255,255,255,0.06)"
                  rx={2}
                />
              );
            }

            const barCenter = x + width / 2;
            const intensity = payload.avgHr;
            const { fill, fillLight } = getIntensityColors(intensity);

            const scale = height / payload.avgHr;
            const wickTopY = y - (payload.hrHigh - payload.avgHr) * scale;
            const wickBottomY = y + (payload.avgHr - payload.hrLow) * scale;

            return (
              <g>
                {/* Glow effect behind the candle */}
                <rect
                  x={x - 2}
                  y={y - 2}
                  width={width + 4}
                  height={Math.max(height, 8) + 4}
                  fill={fill}
                  opacity={0.1}
                  rx={6}
                  ry={6}
                  filter="url(#glow)"
                />
                {/* Wick line */}
                <line
                  x1={barCenter}
                  y1={wickTopY}
                  x2={barCenter}
                  y2={wickBottomY}
                  stroke={fill}
                  strokeWidth={2}
                  opacity={0.5}
                />
                {/* Top tick */}
                <line
                  x1={barCenter - 8}
                  y1={wickTopY}
                  x2={barCenter + 8}
                  y2={wickTopY}
                  stroke={fill}
                  strokeWidth={1.5}
                  opacity={0.5}
                />
                {/* Bottom tick */}
                <line
                  x1={barCenter - 8}
                  y1={wickBottomY}
                  x2={barCenter + 8}
                  y2={wickBottomY}
                  stroke={fill}
                  strokeWidth={1.5}
                  opacity={0.5}
                />
                {/* Body rectangle */}
                <rect
                  x={x + 2}
                  y={y}
                  width={width - 4}
                  height={Math.max(height, 8)}
                  fill={fillLight}
                  stroke={fill}
                  strokeWidth={2}
                  rx={4}
                  ry={4}
                />
                {/* Avg HR label on body */}
                <text
                  x={barCenter}
                  y={y + Math.max(height, 8) / 2 + 4}
                  textAnchor="middle"
                  fontSize={10}
                  fontWeight={600}
                  fill={fill}
                  style={{ fontFamily: "monospace" }}
                >
                  {payload.avgHr}
                </text>
              </g>
            );
          }}
        >
          {candleData.map((entry, index) => {
            const { fill } = entry.avgHr > 0 ? getIntensityColors(entry.avgHr) : { fill: "rgba(255,255,255,0.06)" };
            return <Cell key={index} fill={fill} />;
          })}
        </Bar>

        {/* TRIMP line overlay */}
        <Line
          yAxisId="hr"
          type="monotone"
          dataKey="avgTrimp"
          stroke="#ff6b35"
          strokeWidth={2}
          strokeDasharray="5 3"
          dot={{ r: 3, fill: "#ff6b35", strokeWidth: 2, stroke: "#0a0e1a" }}
          activeDot={{ r: 5, strokeWidth: 2, stroke: "#ff6b35", fill: "#0a0e1a" }}
          name="Avg TRIMP"
          connectNulls={false}
          style={{ filter: "drop-shadow(0 0 4px rgba(255,107,53,0.5))" }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
