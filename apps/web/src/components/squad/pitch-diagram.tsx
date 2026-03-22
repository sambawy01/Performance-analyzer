"use client";

import { useState } from "react";

export interface PitchPlayer {
  id: string;
  name: string;
  jerseyNumber: number;
  position: string;
  acwrRatio: number | null;
  riskFlag: string | null;
  hrAvg: number | null;
  trimpScore: number | null;
  recentForm: string | null;
}

export type Formation = "4-3-3" | "4-2-3-1" | "4-4-2" | "3-5-2";

const FORMATION_POSITIONS: Record<
  Formation,
  { label: string; x: number; y: number }[]
> = {
  "4-3-3": [
    { label: "GK", x: 50, y: 90 },
    { label: "LB", x: 20, y: 70 },
    { label: "CB", x: 38, y: 75 },
    { label: "CB", x: 62, y: 75 },
    { label: "RB", x: 80, y: 70 },
    { label: "CM", x: 30, y: 50 },
    { label: "CM", x: 50, y: 45 },
    { label: "CM", x: 70, y: 50 },
    { label: "LW", x: 20, y: 25 },
    { label: "ST", x: 50, y: 20 },
    { label: "RW", x: 80, y: 25 },
  ],
  "4-2-3-1": [
    { label: "GK", x: 50, y: 90 },
    { label: "LB", x: 20, y: 70 },
    { label: "CB", x: 38, y: 75 },
    { label: "CB", x: 62, y: 75 },
    { label: "RB", x: 80, y: 70 },
    { label: "CDM", x: 38, y: 55 },
    { label: "CDM", x: 62, y: 55 },
    { label: "LW", x: 20, y: 35 },
    { label: "CAM", x: 50, y: 35 },
    { label: "RW", x: 80, y: 35 },
    { label: "ST", x: 50, y: 18 },
  ],
  "4-4-2": [
    { label: "GK", x: 50, y: 90 },
    { label: "LB", x: 20, y: 70 },
    { label: "CB", x: 38, y: 75 },
    { label: "CB", x: 62, y: 75 },
    { label: "RB", x: 80, y: 70 },
    { label: "LM", x: 20, y: 45 },
    { label: "CM", x: 38, y: 50 },
    { label: "CM", x: 62, y: 50 },
    { label: "RM", x: 80, y: 45 },
    { label: "ST", x: 38, y: 22 },
    { label: "ST", x: 62, y: 22 },
  ],
  "3-5-2": [
    { label: "GK", x: 50, y: 90 },
    { label: "CB", x: 28, y: 75 },
    { label: "CB", x: 50, y: 78 },
    { label: "CB", x: 72, y: 75 },
    { label: "LWB", x: 15, y: 50 },
    { label: "CM", x: 35, y: 52 },
    { label: "CM", x: 50, y: 48 },
    { label: "CM", x: 65, y: 52 },
    { label: "RWB", x: 85, y: 50 },
    { label: "ST", x: 38, y: 22 },
    { label: "ST", x: 62, y: 22 },
  ],
};

function getRiskColor(flag: string | null): string {
  switch (flag) {
    case "green":
      return "#00ff88";
    case "blue":
      return "#00d4ff";
    case "amber":
      return "#ff6b35";
    case "red":
      return "#ff3355";
    default:
      return "#94a3b8";
  }
}

interface PitchDiagramProps {
  formation: Formation;
  startingXI: PitchPlayer[];
  onPlayerClick?: (player: PitchPlayer) => void;
}

export function PitchDiagram({
  formation,
  startingXI,
  onPlayerClick,
}: PitchDiagramProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const positions = FORMATION_POSITIONS[formation];

  return (
    <div className="relative w-full" style={{ paddingBottom: "66.67%" }}>
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 w-full h-full"
        style={{ background: "#0a1628" }}
      >
        {/* Pitch outline */}
        <rect
          x="2"
          y="2"
          width="96"
          height="96"
          rx="1"
          fill="none"
          stroke="#00ff88"
          strokeWidth="0.4"
          opacity="0.6"
        />

        {/* Halfway line */}
        <line
          x1="2"
          y1="50"
          x2="98"
          y2="50"
          stroke="#00ff88"
          strokeWidth="0.3"
          opacity="0.4"
        />

        {/* Center circle */}
        <circle
          cx="50"
          cy="50"
          r="10"
          fill="none"
          stroke="#00ff88"
          strokeWidth="0.3"
          opacity="0.4"
        />
        <circle cx="50" cy="50" r="0.6" fill="#00ff88" opacity="0.4" />

        {/* Top penalty box */}
        <rect
          x="25"
          y="2"
          width="50"
          height="16"
          fill="none"
          stroke="#00ff88"
          strokeWidth="0.3"
          opacity="0.4"
        />
        {/* Top goal area */}
        <rect
          x="35"
          y="2"
          width="30"
          height="6"
          fill="none"
          stroke="#00ff88"
          strokeWidth="0.3"
          opacity="0.4"
        />
        {/* Top penalty arc */}
        <path
          d="M 38 18 Q 50 23 62 18"
          fill="none"
          stroke="#00ff88"
          strokeWidth="0.3"
          opacity="0.4"
        />

        {/* Bottom penalty box */}
        <rect
          x="25"
          y="82"
          width="50"
          height="16"
          fill="none"
          stroke="#00ff88"
          strokeWidth="0.3"
          opacity="0.4"
        />
        {/* Bottom goal area */}
        <rect
          x="35"
          y="92"
          width="30"
          height="6"
          fill="none"
          stroke="#00ff88"
          strokeWidth="0.3"
          opacity="0.4"
        />
        {/* Bottom penalty arc */}
        <path
          d="M 38 82 Q 50 77 62 82"
          fill="none"
          stroke="#00ff88"
          strokeWidth="0.3"
          opacity="0.4"
        />

        {/* Corner arcs */}
        <path
          d="M 2 5 Q 5 5 5 2"
          fill="none"
          stroke="#00ff88"
          strokeWidth="0.3"
          opacity="0.4"
        />
        <path
          d="M 95 2 Q 95 5 98 5"
          fill="none"
          stroke="#00ff88"
          strokeWidth="0.3"
          opacity="0.4"
        />
        <path
          d="M 2 95 Q 5 95 5 98"
          fill="none"
          stroke="#00ff88"
          strokeWidth="0.3"
          opacity="0.4"
        />
        <path
          d="M 95 98 Q 95 95 98 95"
          fill="none"
          stroke="#00ff88"
          strokeWidth="0.3"
          opacity="0.4"
        />

        {/* Pitch grass lines (subtle) */}
        {[20, 35, 50, 65, 80].map((y) => (
          <line
            key={y}
            x1="2"
            y1={y}
            x2="98"
            y2={y}
            stroke="#00ff88"
            strokeWidth="0.08"
            opacity="0.15"
          />
        ))}

        {/* Player dots */}
        {positions.map((pos, i) => {
          const player = startingXI[i];
          if (!player) return null;
          const riskColor = getRiskColor(player.riskFlag);
          const isHovered = hoveredIndex === i;

          return (
            <g
              key={i}
              className="cursor-pointer"
              onClick={() => onPlayerClick?.(player)}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Glow effect */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={isHovered ? 5 : 3.5}
                fill={riskColor}
                opacity={isHovered ? 0.25 : 0.1}
              />

              {/* Player circle */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={isHovered ? 3.5 : 2.8}
                fill="#0a1628"
                stroke={riskColor}
                strokeWidth="0.4"
              />

              {/* ACWR badge dot */}
              <circle
                cx={pos.x + 2.2}
                cy={pos.y - 2.2}
                r="0.7"
                fill={riskColor}
              />

              {/* Position label INSIDE circle */}
              <text
                x={pos.x}
                y={pos.y + 0.8}
                textAnchor="middle"
                fill="white"
                fontSize="1.8"
                fontWeight="700"
                fontFamily="Arial, Helvetica, sans-serif"
                style={{ pointerEvents: "none" }}
              >
                {pos.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* HTML tooltips — rendered outside SVG for proper text rendering */}
      {positions.map((pos, i) => {
        const player = startingXI[i];
        if (!player || hoveredIndex !== i) return null;

        return (
          <div
            key={`tooltip-${i}`}
            className="absolute pointer-events-none z-10"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y + 5}%`,
              transform: "translate(-50%, 0)",
            }}
          >
            <div className="bg-[#0a0e1a]/95 backdrop-blur-xl border border-white/15 rounded-lg px-3 py-2 shadow-[0_0_20px_rgba(0,0,0,0.5)] whitespace-nowrap">
              <p className="text-sm font-bold text-white">
                #{player.jerseyNumber} {player.name}
              </p>
              <p className="text-xs font-mono" style={{ color: getRiskColor(player.riskFlag) }}>
                ACWR: {player.acwrRatio?.toFixed(2) ?? "N/A"} | HR: {player.hrAvg ?? "N/A"} bpm
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export { FORMATION_POSITIONS };
