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
    color: "text-[#00d4ff]",
    glowColor: "shadow-[0_0_12px_rgba(0,212,255,0.25)]",
    iconBg: "bg-[#00d4ff]/10",
    borderGlow: "hover:border-[#00d4ff]/30",
  },
  {
    key: "activeSessions" as const,
    label: "Sessions (14d)",
    icon: CalendarDays,
    color: "text-[#a855f7]",
    glowColor: "shadow-[0_0_12px_rgba(168,85,247,0.25)]",
    iconBg: "bg-[#a855f7]/10",
    borderGlow: "hover:border-[#a855f7]/30",
  },
  {
    key: "avgTeamHR" as const,
    label: "Avg Team HR",
    icon: Heart,
    color: "text-[#ff3355]",
    glowColor: "shadow-[0_0_12px_rgba(255,51,85,0.25)]",
    iconBg: "bg-[#ff3355]/10",
    borderGlow: "hover:border-[#ff3355]/30",
    suffix: " bpm",
  },
  {
    key: "playersAtRisk" as const,
    label: "Players at Risk",
    icon: AlertTriangle,
    color: "text-[#ff6b35]",
    glowColor: "shadow-[0_0_12px_rgba(255,107,53,0.25)]",
    iconBg: "bg-[#ff6b35]/10",
    borderGlow: "hover:border-[#ff6b35]/30",
  },
  {
    key: "avgTrimp" as const,
    label: "Avg TRIMP",
    icon: Activity,
    color: "text-[#00ff88]",
    glowColor: "shadow-[0_0_12px_rgba(0,255,136,0.25)]",
    iconBg: "bg-[#00ff88]/10",
    borderGlow: "hover:border-[#00ff88]/30",
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
            className={`rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl p-4 flex flex-col gap-3 transition-all duration-300 hover:bg-white/[0.06] ${stat.borderGlow} ${stat.glowColor} hover:scale-[1.02]`}
          >
            <div className="flex items-center justify-between">
              <div className={`rounded-lg p-2 ${stat.iconBg}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight font-mono stat-number text-white">
                {value}
                {suffix && (
                  <span className="text-xs font-normal text-white/60 ml-1 font-sans">
                    {suffix}
                  </span>
                )}
              </p>
              <p className="text-xs text-white/60 mt-0.5 uppercase tracking-wider">
                {stat.label}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
