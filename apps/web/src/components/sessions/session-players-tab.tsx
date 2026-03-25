import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { riskFlagBadgeVariant } from "@/lib/format";

interface PlayerMetric {
  id: string;
  hr_avg: number;
  hr_max: number;
  hr_min: number;
  trimp_score: number;
  hr_zone_1_pct: number;
  hr_zone_2_pct: number;
  hr_zone_3_pct: number;
  hr_zone_4_pct: number;
  hr_zone_5_pct: number;
  hr_recovery_60s: number | null;
  player_id: string;
  players: {
    name: string;
    jersey_number: number;
    position: string;
    photo_url: string | null;
  };
}

interface LoadRecord {
  player_id: string;
  risk_flag: string;
  acwr_ratio: number;
}

interface CvMetric {
  player_id: string;
  total_distance_m: number;
  max_speed_kmh: number;
  sprint_count: number;
  high_speed_run_count: number;
  accel_events: number;
  decel_events: number;
  off_ball_movement_score: number | null;
}

export function SessionPlayersTab({
  metrics,
  cvMetrics = [],
  loadRecords,
}: {
  metrics: PlayerMetric[];
  cvMetrics?: CvMetric[];
  loadRecords: LoadRecord[];
}) {
  const loadMap = new Map(loadRecords.map((r) => [r.player_id, r]));
  const cvMap = new Map(cvMetrics.map((c) => [c.player_id, c]));

  const sorted = [...metrics].sort(
    (a, b) => a.players.jersey_number - b.players.jersey_number
  );

  if (sorted.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No wearable data for this session.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sorted.map((m) => {
        const load = loadMap.get(m.player_id);
        const initials = m.players.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .slice(0, 2);

        const cv = cvMap.get(m.player_id);

        return (
          <Card key={m.id}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-sm">
                    #{m.players.jersey_number} {m.players.name}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {m.players.position}
                  </p>
                </div>
                {load && (
                  <Badge variant={riskFlagBadgeVariant(load.risk_flag)}>
                    {load.risk_flag.toUpperCase()}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Avg HR</p>
                  <p className="font-semibold">{m.hr_avg}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Max HR</p>
                  <p className="font-semibold">{m.hr_max}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">TRIMP</p>
                  <p className="font-semibold">{Math.round(m.trimp_score)}</p>
                </div>
              </div>

              {/* HR Zone bars */}
              <div className="mt-3 space-y-1">
                {[
                  { label: "Z1", pct: m.hr_zone_1_pct, color: "bg-[#3b82f6]" },
                  { label: "Z2", pct: m.hr_zone_2_pct, color: "bg-[#00ff88]" },
                  { label: "Z3", pct: m.hr_zone_3_pct, color: "bg-[#eab308]" },
                  { label: "Z4", pct: m.hr_zone_4_pct, color: "bg-[#ff6b35]" },
                  { label: "Z5", pct: m.hr_zone_5_pct, color: "bg-[#ff3355]" },
                ].map((z) => (
                  <div
                    key={z.label}
                    className="flex items-center gap-2 text-xs"
                  >
                    <span className="w-6 text-muted-foreground">{z.label}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${z.color} rounded-full`}
                        style={{ width: `${Math.min(z.pct, 100)}%` }}
                      />
                    </div>
                    <span className="w-10 text-right">
                      {Math.round(z.pct)}%
                    </span>
                  </div>
                ))}
              </div>

              {m.hr_recovery_60s !== null && (
                <p className="text-xs text-muted-foreground mt-2">
                  HR Recovery (60s): {m.hr_recovery_60s} bpm
                </p>
              )}

              {/* CV Metrics row */}
              {cv && (
                <div className="mt-3 pt-3 border-t border-white/[0.06]">
                  <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Video Tracking</p>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs mb-2">
                    <div className="rounded-md bg-white/[0.03] border border-white/[0.05] p-1.5">
                      <p className="font-mono font-semibold text-[#00d4ff]">
                        {((cv.total_distance_m ?? 0) / 1000).toFixed(1)} km
                      </p>
                      <p className="text-[9px] text-white/40">Distance</p>
                    </div>
                    <div className="rounded-md bg-white/[0.03] border border-white/[0.05] p-1.5">
                      <p className="font-mono font-semibold text-[#00ff88]">
                        {(cv.max_speed_kmh ?? 0).toFixed(1)} km/h
                      </p>
                      <p className="text-[9px] text-white/40">Top Speed</p>
                    </div>
                    <div className="rounded-md bg-white/[0.03] border border-white/[0.05] p-1.5">
                      <p className="font-mono font-semibold text-[#ff6b35]">
                        {cv.sprint_count}
                      </p>
                      <p className="text-[9px] text-white/40">Sprints</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-md bg-white/[0.03] border border-white/[0.05] p-1.5">
                      <p className="font-mono font-semibold text-[#00d4ff]">
                        {cv.accel_events}
                      </p>
                      <p className="text-[9px] text-white/40">Accels</p>
                    </div>
                    <div className="rounded-md bg-white/[0.03] border border-white/[0.05] p-1.5">
                      <p className="font-mono font-semibold text-[#ff3355]">
                        {cv.decel_events}
                      </p>
                      <p className="text-[9px] text-white/40">Decels</p>
                    </div>
                    <div className="rounded-md bg-white/[0.03] border border-white/[0.05] p-1.5">
                      <p className="font-mono font-semibold text-[#a855f7]">
                        {cv.off_ball_movement_score !== null ? Math.round(cv.off_ball_movement_score) : "—"}
                      </p>
                      <p className="text-[9px] text-white/40">Mvmt</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-3">
                <Link
                  href={`/players/${m.player_id}`}
                  className="text-xs text-primary hover:underline"
                >
                  View Full Profile
                </Link>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
