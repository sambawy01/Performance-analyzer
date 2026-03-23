import Link from "next/link";
import { Heart, Zap, Activity, TrendingUp, Shield, Gauge } from "lucide-react";

interface EnrichedPlayer {
  id: string;
  name: string;
  jersey_number: number;
  position: string;
  age_group: string;
  dominant_foot: string;
  status: string;
  height_cm: number | null;
  weight_kg: number | null;
  acwr: number | null;
  riskFlag: string | null;
  hrAvg: number | null;
  trimp: number | null;
  recovery: number | null;
  sessions28d: number;
  distance: number | null;
  maxSpeed: number | null;
  sprintCount: number | null;
}

function getAgeLabel(ageGroup: string): string {
  const year = parseInt(ageGroup, 10);
  if (isNaN(year)) return ageGroup;
  return `U${2026 - year}`;
}

function getRiskStyle(flag: string | null): { color: string; bg: string; border: string; label: string; glow: string } {
  switch (flag) {
    case "green": return { color: "text-[#00ff88]", bg: "bg-[#00ff88]/10", border: "border-[#00ff88]/20", label: "Optimal", glow: "shadow-[0_0_8px_rgba(0,255,136,0.3)]" };
    case "amber": return { color: "text-[#ff6b35]", bg: "bg-[#ff6b35]/10", border: "border-[#ff6b35]/20", label: "Caution", glow: "shadow-[0_0_8px_rgba(255,107,53,0.3)]" };
    case "red": return { color: "text-[#ff3355]", bg: "bg-[#ff3355]/10", border: "border-[#ff3355]/20", label: "Danger", glow: "shadow-[0_0_8px_rgba(255,51,85,0.3)]" };
    case "blue": return { color: "text-[#00d4ff]", bg: "bg-[#00d4ff]/10", border: "border-[#00d4ff]/20", label: "Under", glow: "" };
    default: return { color: "text-white/40", bg: "bg-white/5", border: "border-white/10", label: "N/A", glow: "" };
  }
}

function getPositionColor(pos: string): string {
  if (pos === "GK") return "from-[#eab308] to-[#eab308]/60";
  if (["CB", "FB", "LB", "RB"].includes(pos)) return "from-[#00d4ff] to-[#00d4ff]/60";
  if (["CM", "CDM", "CAM"].includes(pos)) return "from-[#00ff88] to-[#00ff88]/60";
  if (["W", "LW", "RW", "LM", "RM"].includes(pos)) return "from-[#a855f7] to-[#a855f7]/60";
  return "from-[#ff3355] to-[#ff3355]/60"; // ST
}

export function PlayerCard({ player }: { player: EnrichedPlayer }) {
  const risk = getRiskStyle(player.riskFlag);
  const posColor = getPositionColor(player.position);
  const initials = player.name.split(" ").map((n) => n[0]).join("").slice(0, 2);

  return (
    <Link href={`/players/${player.id}`}>
      <div className="group relative rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl overflow-hidden hover:border-white/[0.15] hover:bg-white/[0.05] transition-all duration-300 cursor-pointer">
        {/* Top accent bar */}
        <div className={`h-1 bg-gradient-to-r ${posColor}`} />

        <div className="p-4">
          {/* Header: Avatar + Name + Position */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className={`h-11 w-11 rounded-lg bg-gradient-to-br ${posColor} flex items-center justify-center`}>
                  <span className="text-sm font-bold text-white">{initials}</span>
                </div>
                {/* Status dot */}
                <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0a0e1a] ${player.status === "active" ? "bg-[#00ff88] animate-pulse shadow-[0_0_6px_rgba(0,255,136,0.6)]" : player.status === "injured" ? "bg-[#ff3355]" : "bg-white/30"}`} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-[#00d4ff] transition-colors">
                  #{player.jersey_number} {player.name}
                </h3>
                <div className="flex items-center gap-2 text-xs text-white/50">
                  <span className="font-semibold">{player.position}</span>
                  <span className="text-white/20">|</span>
                  <span>{getAgeLabel(player.age_group)}</span>
                  <span className="text-white/20">|</span>
                  <span>{player.dominant_foot}</span>
                </div>
              </div>
            </div>

            {/* ACWR Badge */}
            {player.acwr !== null && (
              <div className={`rounded-lg ${risk.bg} ${risk.border} border px-2 py-1 ${risk.glow}`}>
                <p className={`font-mono text-xs font-bold ${risk.color}`}>{player.acwr.toFixed(2)}</p>
                <p className="text-[9px] text-white/40 text-center">{risk.label}</p>
              </div>
            )}
          </div>

          {/* Stats row */}
          {(player.hrAvg || player.trimp || player.recovery) ? (
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2 text-center">
                <Heart className="h-3 w-3 text-[#ff3355] mx-auto mb-0.5" />
                <p className="font-mono text-sm font-bold text-white">{player.hrAvg ?? "—"}</p>
                <p className="text-[9px] text-white/40">HR avg</p>
              </div>
              <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2 text-center">
                <Zap className="h-3 w-3 text-[#ff6b35] mx-auto mb-0.5" />
                <p className="font-mono text-sm font-bold text-white">{player.trimp ? Math.round(player.trimp) : "—"}</p>
                <p className="text-[9px] text-white/40">TRIMP</p>
              </div>
              <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2 text-center">
                <TrendingUp className="h-3 w-3 text-[#00ff88] mx-auto mb-0.5" />
                <p className="font-mono text-sm font-bold text-white">{player.recovery ?? "—"}</p>
                <p className="text-[9px] text-white/40">Recovery</p>
              </div>
            </div>
          ) : (
            <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-3 mb-3 text-center">
              <p className="text-xs text-white/30">No wearable data yet</p>
            </div>
          )}

          {/* CV Stats row */}
          {(player.distance !== null || player.maxSpeed !== null || player.sprintCount !== null) && (
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2 text-center">
                <TrendingUp className="h-3 w-3 text-[#00d4ff] mx-auto mb-0.5" />
                <p className="font-mono text-sm font-bold text-white">
                  {player.distance !== null ? (player.distance / 1000).toFixed(1) : "—"}
                </p>
                <p className="text-[9px] text-white/40">km</p>
              </div>
              <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2 text-center">
                <Gauge className="h-3 w-3 text-[#00ff88] mx-auto mb-0.5" />
                <p className="font-mono text-sm font-bold text-white">
                  {player.maxSpeed !== null ? player.maxSpeed.toFixed(1) : "—"}
                </p>
                <p className="text-[9px] text-white/40">km/h</p>
              </div>
              <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-2 text-center">
                <Zap className="h-3 w-3 text-[#ff6b35] mx-auto mb-0.5" />
                <p className="font-mono text-sm font-bold text-white">{player.sprintCount ?? "—"}</p>
                <p className="text-[9px] text-white/40">sprints</p>
              </div>
            </div>
          )}

          {/* Bottom: Sessions + Physical */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-white/50">
              <Activity className="h-3 w-3" />
              <span className="font-mono">{player.sessions28d}</span>
              <span>sessions (28d)</span>
            </div>
            {player.height_cm && player.weight_kg && (
              <span className="text-white/30 font-mono">
                {player.height_cm}cm / {player.weight_kg}kg
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
