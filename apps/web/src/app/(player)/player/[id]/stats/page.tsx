import { notFound } from "next/navigation";
import { getPlayerPortalData } from "@/lib/queries/player-portal";
import { PlayerShell } from "@/components/player/player-shell";
import { PlayerStatsClient } from "@/components/player/player-stats-client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PlayerStatsPage({ params }: Props) {
  const { id } = await params;
  const data = await getPlayerPortalData(id);

  if (!data) return notFound();

  const { player, wearableMetrics, cvMetrics, loadRecords } = data;

  const recent5W = wearableMetrics.slice(0, 5);
  const recent5Cv = cvMetrics.slice(0, 5);
  const prev5W = wearableMetrics.slice(5, 10);
  const prev5Cv = cvMetrics.slice(5, 10);

  function avg(arr: number[]) {
    return arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  }

  // Detailed metrics with trends
  const avgHr = Math.round(avg(recent5W.map((m) => m.hr_avg ?? 0)));
  const prevAvgHr = Math.round(avg(prev5W.map((m) => m.hr_avg ?? 0)));

  const maxSpeed = parseFloat(
    Math.max(...recent5Cv.map((m) => m.max_speed_kmh ?? 0), 0).toFixed(1)
  );
  const prevMaxSpeed = parseFloat(
    Math.max(...prev5Cv.map((m) => m.max_speed_kmh ?? 0), 0).toFixed(1)
  );

  const avgTrimp = Math.round(avg(recent5W.map((m) => m.trimp_score ?? 0)));
  const prevAvgTrimp = Math.round(avg(prev5W.map((m) => m.trimp_score ?? 0)));

  const totalSprints = recent5Cv.reduce(
    (s, m) => s + (m.sprint_count ?? 0),
    0
  );
  const prevTotalSprints = prev5Cv.reduce(
    (s, m) => s + (m.sprint_count ?? 0),
    0
  );

  const avgDistM = Math.round(
    avg(recent5Cv.map((m) => m.total_distance_m ?? 0))
  );
  const prevAvgDistM = Math.round(
    avg(prev5Cv.map((m) => m.total_distance_m ?? 0))
  );

  const avgRecovery = Math.round(
    avg(
      recent5W
        .filter((m) => m.hr_recovery_60s)
        .map((m) => m.hr_recovery_60s!)
    )
  );
  const prevAvgRecovery = Math.round(
    avg(
      prev5W
        .filter((m) => m.hr_recovery_60s)
        .map((m) => m.hr_recovery_60s!)
    )
  );

  const latestAcwr =
    loadRecords.length > 0 ? loadRecords[0].acwr_ratio ?? 0 : 0;
  const latestRisk =
    loadRecords.length > 0 ? loadRecords[0].risk_flag ?? "low" : "low";

  const sessionsAttended = wearableMetrics.length;

  // Radar chart data: normalize to 0-100
  // Speed: max_speed / 35 * 100
  // Endurance: avg_distance / 8000 * 100
  // Intensity: avg_trimp / 200 * 100
  // Recovery: avg_recovery / 50 * 100
  // Consistency: sessions_attended / 20 * 100
  // Work Rate: avg_hr / 180 * 100 (inverted — higher HR = more work)
  const radarData = [
    {
      metric: "Speed",
      value: Math.min(100, Math.round((maxSpeed / 30) * 100)),
      avg: 60,
    },
    {
      metric: "Endurance",
      value: Math.min(100, Math.round((avgDistM / 7000) * 100)),
      avg: 55,
    },
    {
      metric: "Intensity",
      value: Math.min(100, Math.round((avgTrimp / 180) * 100)),
      avg: 50,
    },
    {
      metric: "Recovery",
      value: Math.min(100, Math.round((avgRecovery / 45) * 100)),
      avg: 52,
    },
    {
      metric: "Consistency",
      value: Math.min(100, Math.round((sessionsAttended / 20) * 100)),
      avg: 65,
    },
    {
      metric: "Work Rate",
      value: Math.min(100, Math.round((avgHr / 170) * 100)),
      avg: 58,
    },
  ];

  // Position heatmap data
  const positionData = cvMetrics
    .filter((m) => m.avg_position_x != null && m.avg_position_y != null)
    .map((m) => ({
      x: m.avg_position_x ?? 50,
      y: m.avg_position_y ?? 50,
    }));

  return (
    <PlayerShell player={player}>
      <PlayerStatsClient
        radarData={radarData}
        metrics={[
          {
            label: "Avg HR",
            value: `${avgHr}`,
            unit: "bpm",
            trend: avgHr - prevAvgHr,
            context: avgHr > 150 ? "High intensity zone" : avgHr > 130 ? "Optimal training zone" : "Low intensity",
          },
          {
            label: "Max Speed",
            value: `${maxSpeed}`,
            unit: "km/h",
            trend: parseFloat((maxSpeed - prevMaxSpeed).toFixed(1)),
            context: maxSpeed > 25 ? "Elite sprint speed" : maxSpeed > 20 ? "Good acceleration" : "Building speed",
          },
          {
            label: "Avg TRIMP",
            value: `${avgTrimp}`,
            unit: "",
            trend: avgTrimp - prevAvgTrimp,
            context: avgTrimp > 150 ? "Very high training load" : avgTrimp > 100 ? "Good session load" : "Moderate load",
          },
          {
            label: "Sprint Count",
            value: `${totalSprints}`,
            unit: "this week",
            trend: totalSprints - prevTotalSprints,
            context: totalSprints > 40 ? "Explosive week" : totalSprints > 20 ? "Active sprinter" : "Building explosiveness",
          },
          {
            label: "Distance / Session",
            value: `${(avgDistM / 1000).toFixed(1)}`,
            unit: "km",
            trend: parseFloat(((avgDistM - prevAvgDistM) / 1000).toFixed(1)),
            context: avgDistM > 6000 ? "High volume runner" : avgDistM > 4000 ? "Good coverage" : "Building endurance",
          },
          {
            label: "HR Recovery",
            value: `${avgRecovery}`,
            unit: "bpm/60s",
            trend: avgRecovery - prevAvgRecovery,
            context: avgRecovery > 40 ? "Excellent fitness" : avgRecovery > 30 ? "Good recovery" : "Improving",
          },
          {
            label: "ACWR",
            value: latestAcwr.toFixed(2),
            unit: "",
            trend: 0,
            context:
              latestAcwr > 1.5
                ? "Danger zone - reduce load"
                : latestAcwr > 1.3
                ? "Caution - monitor closely"
                : latestAcwr >= 0.8
                ? "Optimal sweet spot"
                : "Under-training",
            risk: latestRisk,
          },
          {
            label: "Sessions",
            value: `${sessionsAttended}`,
            unit: "total",
            trend: 0,
            context: `${sessionsAttended} sessions tracked`,
          },
        ]}
        positionData={positionData}
        playerPosition={player.position}
      />
    </PlayerShell>
  );
}
