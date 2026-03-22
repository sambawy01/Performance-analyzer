"use client";

import { Badge } from "@/components/ui/badge";

interface FatigueAlert {
  playerName: string;
  jerseyNumber: number;
  zone5Minutes: number;
  currentHr: number;
}

export function FatigueAlertPanel({ alerts }: { alerts: FatigueAlert[] }) {
  if (alerts.length === 0) return null;

  return (
    <div className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-950/30 p-4">
      <h3 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2">
        Fatigue Alerts
      </h3>
      <div className="space-y-2">
        {alerts.map((alert) => (
          <div
            key={alert.jerseyNumber}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-red-700 dark:text-red-400">
              #{alert.jerseyNumber} {alert.playerName} in Zone 5 for{" "}
              {alert.zone5Minutes}+ min
            </span>
            <Badge variant="destructive">{alert.currentHr} bpm</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
