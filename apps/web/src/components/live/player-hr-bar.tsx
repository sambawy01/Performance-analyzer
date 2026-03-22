"use client";

import { Badge } from "@/components/ui/badge";
import { getHrZone, HR_ZONE_COLORS, HR_ZONE_LABELS } from "@/lib/hr-zones";

interface PlayerHrBarProps {
  name: string;
  jerseyNumber: number;
  position: string;
  currentHr: number;
  hrMax: number;
  timeInZone5Seconds: number;
}

export function PlayerHrBar({
  name,
  jerseyNumber,
  position,
  currentHr,
  hrMax,
  timeInZone5Seconds,
}: PlayerHrBarProps) {
  const zone = getHrZone(currentHr, hrMax);
  const pct = Math.min((currentHr / hrMax) * 100, 100);
  const barColor = HR_ZONE_COLORS[zone];
  const zoneLabel = HR_ZONE_LABELS[zone];
  const isHighAlert = timeInZone5Seconds >= 240; // 4+ minutes in Zone 5

  return (
    <div
      className={`rounded-lg border p-3 transition-colors ${
        isHighAlert ? "border-[#ff3355]/40 bg-[#ff3355]/10 shadow-[0_0_15px_rgba(255,51,85,0.15)]" : "border-white/[0.08] bg-white/[0.04]"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">
            #{jerseyNumber} {name}
          </span>
          <span className="text-xs text-muted-foreground">{position}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold tabular-nums" style={{ color: barColor }}>
            {currentHr}
          </span>
          <span className="text-xs text-muted-foreground">bpm</span>
          <Badge
            variant="outline"
            style={{
              borderColor: barColor,
              color: barColor,
            }}
          >
            {zoneLabel}
          </Badge>
        </div>
      </div>

      {/* HR bar */}
      <div className="h-4 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            backgroundColor: barColor,
          }}
        />
      </div>

      {/* Zone scale */}
      <div className="flex mt-1 text-[10px] text-muted-foreground">
        <span className="flex-1">Z1</span>
        <span className="flex-1 text-center">Z2</span>
        <span className="flex-1 text-center">Z3</span>
        <span className="flex-1 text-center">Z4</span>
        <span className="flex-1 text-right">Z5</span>
      </div>

      {isHighAlert && (
        <p className="text-xs text-red-600 font-medium mt-1">
          Zone 5 for {Math.floor(timeInZone5Seconds / 60)}+ min — consider subbing
        </p>
      )}
    </div>
  );
}
