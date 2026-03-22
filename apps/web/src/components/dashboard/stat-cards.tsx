import {
  Users,
  CalendarDays,
  Heart,
  AlertTriangle,
  Activity,
} from "lucide-react";

interface StatCardsProps {
  totalPlayers: number;
  activeSessions: number;
  avgTeamHR: number | null;
  playersAtRisk: number;
  avgTrimp: number | null;
}

const stats = [
  {
    key: "totalPlayers" as const,
    label: "Total Players",
    icon: Users,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    key: "activeSessions" as const,
    label: "Sessions (14d)",
    icon: CalendarDays,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
  },
  {
    key: "avgTeamHR" as const,
    label: "Avg Team HR",
    icon: Heart,
    color: "text-rose-600",
    bgColor: "bg-rose-50",
    suffix: " bpm",
  },
  {
    key: "playersAtRisk" as const,
    label: "Players at Risk",
    icon: AlertTriangle,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
  {
    key: "avgTrimp" as const,
    label: "Avg TRIMP",
    icon: Activity,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
  },
];

export function StatCards({
  totalPlayers,
  activeSessions,
  avgTeamHR,
  playersAtRisk,
  avgTrimp,
}: StatCardsProps) {
  const values: Record<string, number | string> = {
    totalPlayers,
    activeSessions,
    avgTeamHR: avgTeamHR ?? "--",
    playersAtRisk,
    avgTrimp: avgTrimp ?? "--",
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {stats.map((stat) => {
        const Icon = stat.icon;
        const value = values[stat.key];
        const suffix =
          "suffix" in stat && typeof value === "number" ? stat.suffix : "";

        return (
          <div
            key={stat.key}
            className="rounded-xl border bg-card p-4 flex flex-col gap-3 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div
                className={`rounded-lg p-2 ${stat.bgColor}`}
              >
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight">
                {value}
                {suffix && (
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    {suffix}
                  </span>
                )}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {stat.label}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
