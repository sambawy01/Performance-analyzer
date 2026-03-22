"use client";

import dynamic from "next/dynamic";

const IntensityChart = dynamic(
  () => import("@/components/dashboard/intensity-chart"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[260px] rounded-lg bg-muted/30 animate-pulse" />
    ),
  }
);

interface IntensityChartWrapperProps {
  data: Array<{
    date: string;
    avgHr: number;
    hrLow: number;
    hrHigh: number;
    avgTrimp: number;
    trimpLow: number;
    trimpHigh: number;
    players: number;
  }>;
}

export function IntensityChartWrapper({ data }: IntensityChartWrapperProps) {
  return <IntensityChart data={data} />;
}
