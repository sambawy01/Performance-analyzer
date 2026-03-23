"use client";

import dynamic from "next/dynamic";

const ComparisonRadar = dynamic(
  () => import("./comparison-radar").then((m) => m.ComparisonRadar),
  { ssr: false, loading: () => <div className="h-[320px] flex items-center justify-center text-white/30 text-sm">Loading chart...</div> }
);

interface RadarDataPoint {
  subject: string;
  [key: string]: string | number;
}

interface ComparisonRadarWrapperProps {
  data: RadarDataPoint[];
  playerNames: string[];
}

export function ComparisonRadarWrapper({ data, playerNames }: ComparisonRadarWrapperProps) {
  return <ComparisonRadar data={data} playerNames={playerNames} />;
}
