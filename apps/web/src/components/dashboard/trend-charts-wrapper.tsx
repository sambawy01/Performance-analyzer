"use client";

import { Component, type ReactNode } from "react";
import dynamic from "next/dynamic";

const TrendCharts = dynamic(
  () =>
    import("@/components/dashboard/trend-charts").then(
      (mod) => mod.TrendCharts
    ),
  {
    ssr: false,
    loading: () => (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-[320px] rounded-lg border bg-card animate-pulse" />
        <div className="h-[320px] rounded-lg border bg-card animate-pulse" />
      </div>
    ),
  }
);

class TrendChartsErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("TrendCharts render error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-[320px] rounded-lg border bg-card flex items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Unable to load trend charts. Please refresh the page.
            </p>
          </div>
          <div className="h-[320px] rounded-lg border bg-card flex items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Unable to load risk chart. Please refresh the page.
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

interface TrendChartsWrapperProps {
  sessions: Array<{
    id: string;
    date: string;
    wearable_metrics: Array<{
      hr_avg: number;
      hr_max: number;
      trimp_score: number;
    }>;
  }>;
  riskDistribution: {
    blue: number;
    green: number;
    amber: number;
    red: number;
  };
}

export function TrendChartsWrapper({
  sessions,
  riskDistribution,
}: TrendChartsWrapperProps) {
  return (
    <TrendChartsErrorBoundary>
      <TrendCharts sessions={sessions} riskDistribution={riskDistribution} />
    </TrendChartsErrorBoundary>
  );
}
