import {
  Users, CalendarDays, Heart, AlertTriangle, Activity,
  Zap, Gauge, TrendingUp,
} from "lucide-react";

interface StatCardsProps {
  totalPlayers: number;
  activeSessions: number;
  avgTeamHR: number | null;
  playersAtRisk: number;
  avgTrimp: number | null;
  avgDistance: number | null;
  avgSpeed: number | null;
  avgSprints: number | null;
}

export function StatCards({
  totalPlayers, activeSessions, avgTeamHR, playersAtRisk, avgTrimp,
  avgDistance, avgSpeed, avgSprints,
}: StatCardsProps) {
  const stats = [
    { label: "Total Players", value: totalPlayers, icon: Users, color: "text-[#00d4ff]", iconBg: "bg-[#00d4ff]/10", glow: "hover:border-[#00d4ff]/30 shadow-[0_0_12px_rgba(0,212,255,0.15)]" },
    { label: "Sessions (14d)", value: activeSessions, icon: CalendarDays, color: "text-[#a855f7]", iconBg: "bg-[#a855f7]/10", glow: "hover:border-[#a855f7]/30 shadow-[0_0_12px_rgba(168,85,247,0.15)]" },
    { label: "Avg Team HR", value: avgTeamHR ? `${avgTeamHR} bpm` : "--", icon: Heart, color: "text-[#ff3355]", iconBg: "bg-[#ff3355]/10", glow: "hover:border-[#ff3355]/30 shadow-[0_0_12px_rgba(255,51,85,0.15)]" },
    { label: "Avg Distance", value: avgDistance ? `${(avgDistance / 1000).toFixed(1)} km` : "--", icon: TrendingUp, color: "text-[#00d4ff]", iconBg: "bg-[#00d4ff]/10", glow: "hover:border-[#00d4ff]/30 shadow-[0_0_12px_rgba(0,212,255,0.15)]" },
    { label: "Avg Speed", value: avgSpeed ? `${avgSpeed.toFixed(1)} km/h` : "--", icon: Gauge, color: "text-[#00ff88]", iconBg: "bg-[#00ff88]/10", glow: "hover:border-[#00ff88]/30 shadow-[0_0_12px_rgba(0,255,136,0.15)]" },
    { label: "Avg Sprints", value: avgSprints ?? "--", icon: Zap, color: "text-[#ff6b35]", iconBg: "bg-[#ff6b35]/10", glow: "hover:border-[#ff6b35]/30 shadow-[0_0_12px_rgba(255,107,53,0.15)]" },
    { label: "Players at Risk", value: playersAtRisk, icon: AlertTriangle, color: "text-[#ff6b35]", iconBg: "bg-[#ff6b35]/10", glow: "hover:border-[#ff6b35]/30 shadow-[0_0_12px_rgba(255,107,53,0.15)]" },
    { label: "Avg TRIMP", value: avgTrimp ?? "--", icon: Activity, color: "text-[#00ff88]", iconBg: "bg-[#00ff88]/10", glow: "hover:border-[#00ff88]/30 shadow-[0_0_12px_rgba(0,255,136,0.15)]" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className={`rounded-xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl p-3 flex flex-col gap-2 transition-all duration-300 hover:bg-white/[0.06] hover:scale-[1.02] ${stat.glow}`}
          >
            <div className={`rounded-lg p-1.5 w-fit ${stat.iconBg}`}>
              <Icon className={`h-3.5 w-3.5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight font-mono text-white">{stat.value}</p>
              <p className="text-[10px] text-white/50 uppercase tracking-wider">{stat.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
