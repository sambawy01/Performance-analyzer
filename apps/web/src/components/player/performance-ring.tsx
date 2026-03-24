"use client";

import { useEffect, useState } from "react";

interface PerformanceRingProps {
  score: number; // 0-100
  size?: number;
  strokeWidth?: number;
}

export function PerformanceRing({
  score,
  size = 140,
  strokeWidth = 10,
}: PerformanceRingProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  // Color based on score
  const getColor = (s: number) => {
    if (s >= 80) return "#00ff88";
    if (s >= 60) return "#00d4ff";
    if (s >= 40) return "#ff6b35";
    return "#ff3355";
  };

  const color = getColor(score);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        {/* Animated progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
            filter: `drop-shadow(0 0 8px ${color}50)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-mono text-3xl font-bold"
          style={{ color, textShadow: `0 0 15px ${color}40` }}
        >
          {score}
        </span>
        <span className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">
          Score
        </span>
      </div>
    </div>
  );
}
