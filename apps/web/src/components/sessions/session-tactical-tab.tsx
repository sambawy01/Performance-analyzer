import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crosshair, ArrowUpRight, ArrowDownRight, Maximize2, Minimize2, Target, Zap } from "lucide-react";

interface TacticalData {
  avg_formation: string | null;
  compactness_avg: number | null;
  compactness_std: number | null;
  defensive_line_height_avg: number | null;
  team_width_avg: number | null;
  team_length_avg: number | null;
  pressing_intensity: number | null;
  transition_speed_atk_s: number | null;
  transition_speed_def_s: number | null;
  possession_pct: number | null;
  formation_snapshots: Array<{ minute: number; formation: string }> | null;
}

export function SessionTacticalTab({ tactical }: { tactical: TacticalData | null }) {
  if (!tactical) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tactical Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Crosshair className="h-10 w-10 text-white/10 mb-4" />
            <p className="text-white/40 mb-2">No tactical data for this session.</p>
            <p className="text-sm text-white/20">
              Process a video through the CV pipeline to generate formation maps, pressing analysis, and transition metrics.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const pressingLabel = tactical.pressing_intensity
    ? tactical.pressing_intensity < 8 ? "Low" : tactical.pressing_intensity < 11 ? "Medium" : "High"
    : null;

  const pressingColor = tactical.pressing_intensity
    ? tactical.pressing_intensity < 8 ? "text-[#00d4ff]" : tactical.pressing_intensity < 11 ? "text-[#ff6b35]" : "text-[#ff3355]"
    : "";

  return (
    <div className="space-y-4">
      {/* Formation + Key Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Formation Card */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Crosshair className="h-4 w-4 text-[#00d4ff]" />
              Formation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-mono font-bold text-[#00d4ff] text-glow-blue mb-3">
              {tactical.avg_formation ?? "--"}
            </p>
            {tactical.formation_snapshots && tactical.formation_snapshots.length > 1 && (
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-widest text-white/30">Formation Changes</p>
                <div className="flex flex-wrap gap-1.5">
                  {tactical.formation_snapshots.map((snap, i) => (
                    <Badge key={i} variant="outline" className="font-mono text-xs border-white/10">
                      {snap.minute}&apos; → {snap.formation}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tactical Metrics Grid */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Key Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {/* Possession */}
              {tactical.possession_pct !== null && (
                <div>
                  <p className="data-label mb-1">Possession</p>
                  <p className="metric-value text-[#00d4ff]">{Math.round(tactical.possession_pct)}%</p>
                </div>
              )}

              {/* Pressing Intensity (PPDA) */}
              {tactical.pressing_intensity !== null && (
                <div>
                  <p className="data-label mb-1">Pressing (PPDA)</p>
                  <div className="flex items-baseline gap-2">
                    <p className={`metric-value ${pressingColor}`}>{tactical.pressing_intensity.toFixed(1)}</p>
                    <span className={`text-xs ${pressingColor}`}>{pressingLabel}</span>
                  </div>
                </div>
              )}

              {/* Compactness */}
              {tactical.compactness_avg !== null && (
                <div>
                  <p className="data-label mb-1">Compactness</p>
                  <p className="metric-value text-white">{tactical.compactness_avg.toFixed(1)}m</p>
                  <p className="text-[10px] text-white/30">±{tactical.compactness_std?.toFixed(1)}m</p>
                </div>
              )}

              {/* Defensive Line */}
              {tactical.defensive_line_height_avg !== null && (
                <div>
                  <p className="data-label mb-1">Def. Line Height</p>
                  <p className="metric-value text-white">{tactical.defensive_line_height_avg.toFixed(0)}m</p>
                  <p className="text-[10px] text-white/30">from own goal</p>
                </div>
              )}

              {/* Team Shape */}
              {tactical.team_width_avg !== null && tactical.team_length_avg !== null && (
                <div>
                  <p className="data-label mb-1">Team Shape</p>
                  <div className="flex items-center gap-1">
                    <Maximize2 className="h-3 w-3 text-white/40" />
                    <p className="font-mono text-sm text-white">{tactical.team_width_avg.toFixed(0)}m × {tactical.team_length_avg.toFixed(0)}m</p>
                  </div>
                  <p className="text-[10px] text-white/30">width × length</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transitions */}
      {(tactical.transition_speed_atk_s || tactical.transition_speed_def_s) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4 text-[#ff6b35]" />
              Transition Speed
            </CardTitle>
            <CardDescription>Average time to reorganize after gaining/losing possession</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              {tactical.transition_speed_atk_s !== null && (
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-[#00ff88]/10 p-2">
                    <ArrowUpRight className="h-5 w-5 text-[#00ff88]" />
                  </div>
                  <div>
                    <p className="data-label">Defense → Attack</p>
                    <p className="metric-value text-[#00ff88]">{tactical.transition_speed_atk_s.toFixed(1)}s</p>
                  </div>
                </div>
              )}
              {tactical.transition_speed_def_s !== null && (
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-[#ff3355]/10 p-2">
                    <ArrowDownRight className="h-5 w-5 text-[#ff3355]" />
                  </div>
                  <div>
                    <p className="data-label">Attack → Defense</p>
                    <p className="metric-value text-[#ff3355]">{tactical.transition_speed_def_s.toFixed(1)}s</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
