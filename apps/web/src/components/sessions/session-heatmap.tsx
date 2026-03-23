"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MapPin } from "lucide-react";

interface CvMetric {
  player_id: string;
  heatmap_data: { defensive_third: number; middle_third: number; attacking_third: number } | null;
  time_in_zones: { defensive_pct: number; middle_pct: number; attacking_pct: number } | null;
  avg_position_x: number | null;
  avg_position_y: number | null;
  players?: { name: string; jersey_number: number; position: string } | null;
}

interface SessionHeatmapProps {
  cvMetrics: CvMetric[];
}

function getZoneColor(pct: number): string {
  if (pct > 40) return "rgba(255, 51, 85, 0.5)";    // red — high time
  if (pct > 25) return "rgba(255, 107, 53, 0.35)";   // orange
  if (pct > 15) return "rgba(0, 212, 255, 0.25)";    // cyan
  return "rgba(0, 255, 136, 0.15)";                    // green — low time
}

export function SessionHeatmap({ cvMetrics }: SessionHeatmapProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);

  if (cvMetrics.length === 0) return null;

  // If a player is selected, show their individual heatmap. Otherwise show team average.
  const metricsToShow = selectedPlayer
    ? cvMetrics.filter((m) => m.player_id === selectedPlayer)
    : cvMetrics;

  // Calculate averages
  const avgDefensive = metricsToShow.reduce((s, m) => s + (m.time_in_zones?.defensive_pct ?? 0), 0) / metricsToShow.length;
  const avgMiddle = metricsToShow.reduce((s, m) => s + (m.time_in_zones?.middle_pct ?? 0), 0) / metricsToShow.length;
  const avgAttacking = metricsToShow.reduce((s, m) => s + (m.time_in_zones?.attacking_pct ?? 0), 0) / metricsToShow.length;

  const selectedName = selectedPlayer
    ? cvMetrics.find((m) => m.player_id === selectedPlayer)?.players?.name ?? "Unknown"
    : "Team Average";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <MapPin className="h-4 w-4 text-[#00d4ff]" />
          Position Heatmap — {selectedName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Pitch diagram with zones */}
          <div className="lg:col-span-2">
            <div className="relative w-full" style={{ paddingBottom: "66%" }}>
              <svg viewBox="0 0 100 66" className="absolute inset-0 w-full h-full" style={{ background: "#0a1628" }}>
                {/* Pitch outline */}
                <rect x="2" y="2" width="96" height="62" rx="1" fill="none" stroke="#00ff88" strokeWidth="0.3" opacity="0.4" />
                <line x1="2" y1="33" x2="98" y2="33" stroke="#00ff88" strokeWidth="0.2" opacity="0.3" />
                <circle cx="50" cy="33" r="8" fill="none" stroke="#00ff88" strokeWidth="0.2" opacity="0.3" />

                {/* Defensive third */}
                <rect x="2" y="44" width="96" height="20" fill={getZoneColor(avgDefensive)} rx="0.5" />
                <text x="50" y="55" textAnchor="middle" fill="white" fontSize="3" fontWeight="600" fontFamily="Arial">
                  DEFENSIVE
                </text>
                <text x="50" y="59" textAnchor="middle" fill="white" fontSize="2.5" fontFamily="monospace" opacity="0.8">
                  {Math.round(avgDefensive)}%
                </text>

                {/* Middle third */}
                <rect x="2" y="22" width="96" height="22" fill={getZoneColor(avgMiddle)} rx="0.5" />
                <text x="50" y="33" textAnchor="middle" fill="white" fontSize="3" fontWeight="600" fontFamily="Arial">
                  MIDFIELD
                </text>
                <text x="50" y="37" textAnchor="middle" fill="white" fontSize="2.5" fontFamily="monospace" opacity="0.8">
                  {Math.round(avgMiddle)}%
                </text>

                {/* Attacking third */}
                <rect x="2" y="2" width="96" height="20" fill={getZoneColor(avgAttacking)} rx="0.5" />
                <text x="50" y="11" textAnchor="middle" fill="white" fontSize="3" fontWeight="600" fontFamily="Arial">
                  ATTACKING
                </text>
                <text x="50" y="15" textAnchor="middle" fill="white" fontSize="2.5" fontFamily="monospace" opacity="0.8">
                  {Math.round(avgAttacking)}%
                </text>

                {/* Player positions (dots) */}
                {metricsToShow.map((m, i) => {
                  if (m.avg_position_x == null || m.avg_position_y == null) return null;
                  // Map x (0-100) and y (0-100) to pitch coordinates
                  const px = 2 + (m.avg_position_x / 100) * 96;
                  const py = 64 - (m.avg_position_y / 100) * 62; // Invert Y — higher position = closer to attacking
                  return (
                    <g key={i}>
                      <circle cx={px} cy={py} r="2" fill="#00d4ff" opacity="0.6" />
                      <circle cx={px} cy={py} r="1" fill="white" opacity="0.9" />
                      {m.players && (
                        <text x={px} y={py - 3} textAnchor="middle" fill="white" fontSize="1.5" opacity="0.7">
                          {m.players.jersey_number}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Player selector + zone breakdown */}
          <div className="space-y-3">
            <div>
              <p className="text-xs text-white/50 uppercase tracking-wider mb-2">Select Player</p>
              <div className="space-y-1 max-h-[280px] overflow-y-auto pr-1">
                <button
                  onClick={() => setSelectedPlayer(null)}
                  className={`w-full text-left text-xs px-2 py-1.5 rounded ${!selectedPlayer ? "bg-[#00d4ff]/15 text-[#00d4ff] border border-[#00d4ff]/30" : "text-white/60 hover:bg-white/[0.05]"}`}
                >
                  Team Average
                </button>
                {cvMetrics.filter((m) => m.players).map((m) => (
                  <button
                    key={m.player_id}
                    onClick={() => setSelectedPlayer(m.player_id === selectedPlayer ? null : m.player_id)}
                    className={`w-full text-left text-xs px-2 py-1.5 rounded flex justify-between ${m.player_id === selectedPlayer ? "bg-[#00d4ff]/15 text-[#00d4ff] border border-[#00d4ff]/30" : "text-white/60 hover:bg-white/[0.05]"}`}
                  >
                    <span>#{m.players!.jersey_number} {m.players!.name}</span>
                    <span className="text-white/30 font-mono">{m.players!.position}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Zone breakdown */}
            <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3 space-y-2">
              <p className="text-xs text-white/50 uppercase tracking-wider">Time in Zones</p>
              {[
                { label: "Attacking", pct: avgAttacking, color: "#ff3355" },
                { label: "Midfield", pct: avgMiddle, color: "#ff6b35" },
                { label: "Defensive", pct: avgDefensive, color: "#00d4ff" },
              ].map((z) => (
                <div key={z.label} className="flex items-center gap-2">
                  <span className="text-xs text-white/60 w-16">{z.label}</span>
                  <div className="flex-1 h-2 rounded-full bg-white/[0.06] overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${z.pct}%`, backgroundColor: z.color, boxShadow: `0 0 6px ${z.color}40` }} />
                  </div>
                  <span className="text-xs font-mono text-white/80 w-8 text-right">{Math.round(z.pct)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
