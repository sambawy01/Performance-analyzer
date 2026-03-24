import Link from "next/link";
import { getAllPlayersForSelector } from "@/lib/queries/player-portal";

export default async function PlayerSelectorPage() {
  const players = await getAllPlayersForSelector();

  // Group by position
  const positions = ["GK", "CB", "LB", "RB", "CDM", "CM", "CAM", "LW", "RW", "ST", "CF"];
  const grouped = new Map<string, typeof players>();
  for (const p of players) {
    const pos = p.position ?? "Unknown";
    if (!grouped.has(pos)) grouped.set(pos, []);
    grouped.get(pos)!.push(p);
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-10">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00d4ff] to-[#a855f7] flex items-center justify-center">
            <span className="font-mono text-lg font-bold text-[#0a0e1a]">M8</span>
          </div>
          <span className="text-xl font-bold text-white">Coach M8</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Player Portal</h1>
        <p className="text-sm text-white/40">
          Select your profile to view your personal performance dashboard
        </p>
      </div>

      {/* Player Grid */}
      <div className="w-full max-w-2xl space-y-8">
        {positions.map((pos) => {
          const posPlayers = grouped.get(pos);
          if (!posPlayers || posPlayers.length === 0) return null;
          return (
            <div key={pos}>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-3 pl-1">
                {pos}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {posPlayers.map((p) => (
                  <Link
                    key={p.id}
                    href={`/player/${p.id}`}
                    className="glass glass-hover rounded-xl p-4 flex items-center gap-3 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] group"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00d4ff]/80 to-[#a855f7]/80 flex items-center justify-center flex-shrink-0 group-hover:shadow-[0_0_12px_rgba(0,212,255,0.3)] transition-shadow">
                      <span className="font-mono text-sm font-bold text-white">
                        {p.jersey_number ?? "?"}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {p.name}
                      </p>
                      <p className="text-[10px] text-white/40 uppercase tracking-wider">
                        {p.position} &middot; U{p.age_group ? 2026 - parseInt(p.age_group) : "?"}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
