import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

interface OverviewTabProps {
  session: {
    notes: string | null;
    duration_minutes: number | null;
  };
  metrics: Array<{
    hr_avg: number;
    hr_max: number;
    trimp_score: number;
    hr_zone_1_pct: number;
    hr_zone_2_pct: number;
    hr_zone_3_pct: number;
    hr_zone_4_pct: number;
    hr_zone_5_pct: number;
  }>;
  loadRecords: Array<{
    risk_flag: string;
    acwr_ratio: number;
    players: { name: string; jersey_number: number };
  }>;
}

export function SessionOverviewTab({
  session,
  metrics,
  loadRecords,
}: OverviewTabProps) {
  const avgHr =
    metrics.length > 0
      ? Math.round(metrics.reduce((s, m) => s + m.hr_avg, 0) / metrics.length)
      : null;
  const maxHr =
    metrics.length > 0 ? Math.max(...metrics.map((m) => m.hr_max)) : null;
  const avgTrimp =
    metrics.length > 0
      ? Math.round(
          metrics.reduce((s, m) => s + m.trimp_score, 0) / metrics.length
        )
      : null;

  const redFlags = loadRecords.filter((r) => r.risk_flag === "red").length;
  const amberFlags = loadRecords.filter((r) => r.risk_flag === "amber").length;

  const statCards = [
    { label: "Avg HR", value: avgHr ? `${avgHr} bpm` : "--" },
    { label: "Max HR", value: maxHr ? `${maxHr} bpm` : "--" },
    { label: "Avg TRIMP", value: avgTrimp ?? "--" },
    { label: "Players Tracked", value: metrics.length },
    {
      label: "Duration",
      value: session.duration_minutes
        ? `${session.duration_minutes} min`
        : "--",
    },
    {
      label: "Injury Flags",
      value: `${redFlags} red, ${amberFlags} amber`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* AI Summary Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>AI Session Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground italic">
            AI-generated session summary will appear here once the AI layer is
            connected. It will analyze HR data, load patterns, and coach notes
            to produce a 2-3 sentence summary.
          </p>
        </CardContent>
      </Card>

      {/* Key Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} size="sm">
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Coach Notes */}
      {session.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Coach Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{session.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
