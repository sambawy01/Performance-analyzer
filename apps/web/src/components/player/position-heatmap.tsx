"use client";

interface PositionData {
  x: number;
  y: number;
}

export function PositionHeatmap({
  data,
  position,
}: {
  data: PositionData[];
  position: string | null;
}) {
  if (data.length === 0) {
    return (
      <div className="glass rounded-xl p-6 text-center text-sm text-white/30">
        No position data available yet
      </div>
    );
  }

  // Normalize positions to pitch coordinates (0-100 range)
  // SVG pitch: 300 wide x 450 tall
  const pitchW = 300;
  const pitchH = 450;

  return (
    <div className="glass rounded-xl p-4 overflow-hidden">
      <h3 className="data-label mb-3">Position Map</h3>
      <svg
        viewBox={`0 0 ${pitchW} ${pitchH}`}
        className="w-full"
        style={{ maxHeight: 320 }}
      >
        {/* Pitch background */}
        <rect
          x={0}
          y={0}
          width={pitchW}
          height={pitchH}
          rx={8}
          fill="rgba(0,255,136,0.04)"
          stroke="rgba(0,255,136,0.15)"
          strokeWidth={2}
        />
        {/* Center line */}
        <line
          x1={0}
          y1={pitchH / 2}
          x2={pitchW}
          y2={pitchH / 2}
          stroke="rgba(0,255,136,0.12)"
          strokeWidth={1}
        />
        {/* Center circle */}
        <circle
          cx={pitchW / 2}
          cy={pitchH / 2}
          r={45}
          fill="none"
          stroke="rgba(0,255,136,0.12)"
          strokeWidth={1}
        />
        {/* Penalty areas */}
        <rect
          x={60}
          y={0}
          width={180}
          height={80}
          fill="none"
          stroke="rgba(0,255,136,0.1)"
          strokeWidth={1}
        />
        <rect
          x={60}
          y={pitchH - 80}
          width={180}
          height={80}
          fill="none"
          stroke="rgba(0,255,136,0.1)"
          strokeWidth={1}
        />
        {/* Goal boxes */}
        <rect
          x={100}
          y={0}
          width={100}
          height={35}
          fill="none"
          stroke="rgba(0,255,136,0.08)"
          strokeWidth={1}
        />
        <rect
          x={100}
          y={pitchH - 35}
          width={100}
          height={35}
          fill="none"
          stroke="rgba(0,255,136,0.08)"
          strokeWidth={1}
        />

        {/* Position heat dots */}
        {data.map((pos, i) => {
          const cx = (pos.x / 100) * pitchW;
          const cy = (pos.y / 100) * pitchH;
          return (
            <g key={i}>
              {/* Glow */}
              <circle
                cx={cx}
                cy={cy}
                r={18}
                fill="rgba(0,212,255,0.08)"
              />
              {/* Dot */}
              <circle
                cx={cx}
                cy={cy}
                r={5}
                fill="#00d4ff"
                opacity={0.7}
              />
            </g>
          );
        })}

        {/* Average position */}
        {data.length > 0 && (() => {
          const avgX =
            data.reduce((s, p) => s + p.x, 0) / data.length;
          const avgY =
            data.reduce((s, p) => s + p.y, 0) / data.length;
          const cx = (avgX / 100) * pitchW;
          const cy = (avgY / 100) * pitchH;
          return (
            <g>
              <circle
                cx={cx}
                cy={cy}
                r={25}
                fill="rgba(168,85,247,0.15)"
              />
              <circle
                cx={cx}
                cy={cy}
                r={8}
                fill="#a855f7"
                stroke="rgba(168,85,247,0.5)"
                strokeWidth={2}
              />
              <text
                x={cx}
                y={cy + 3}
                textAnchor="middle"
                fill="white"
                fontSize={7}
                fontWeight={700}
                fontFamily="monospace"
              >
                AVG
              </text>
            </g>
          );
        })()}
      </svg>
      <div className="flex items-center justify-center gap-4 mt-3 text-[10px] text-white/40">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#00d4ff]" />
          Session position
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#a855f7]" />
          Average position
        </span>
      </div>
    </div>
  );
}
