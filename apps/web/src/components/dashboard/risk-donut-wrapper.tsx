"use client";

import dynamic from "next/dynamic";

const RiskDonut = dynamic(
  () => import("@/components/dashboard/risk-donut"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[260px] rounded-lg bg-muted/30 animate-pulse" />
    ),
  }
);

interface RiskDonutWrapperProps {
  distribution: { blue: number; green: number; amber: number; red: number };
}

export function RiskDonutWrapper({ distribution }: RiskDonutWrapperProps) {
  return <RiskDonut distribution={distribution} />;
}
