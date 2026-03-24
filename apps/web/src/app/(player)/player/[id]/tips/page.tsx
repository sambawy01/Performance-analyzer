import { notFound } from "next/navigation";
import { getPlayerPortalData } from "@/lib/queries/player-portal";
import { PlayerShell } from "@/components/player/player-shell";
import { PlayerTipsClient } from "@/components/player/player-tips-client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PlayerTipsPage({ params }: Props) {
  const { id } = await params;
  const data = await getPlayerPortalData(id);

  if (!data) return notFound();

  const { player, wearableMetrics, cvMetrics, loadRecords } = data;

  // Compute summary stats for context
  const recent = wearableMetrics.slice(0, 5);
  const recentCv = cvMetrics.slice(0, 5);

  const avgTrimp =
    recent.length > 0
      ? Math.round(
          recent.reduce((s, m) => s + (m.trimp_score ?? 0), 0) / recent.length
        )
      : 0;
  const avgRecovery =
    recent.filter((m) => m.hr_recovery_60s).length > 0
      ? Math.round(
          recent
            .filter((m) => m.hr_recovery_60s)
            .reduce((s, m) => s + (m.hr_recovery_60s ?? 0), 0) /
            recent.filter((m) => m.hr_recovery_60s).length
        )
      : 0;
  const maxSpeed =
    recentCv.length > 0
      ? Math.max(...recentCv.map((m) => m.max_speed_kmh ?? 0))
      : 0;
  const avgDistance =
    recentCv.length > 0
      ? Math.round(
          recentCv.reduce((s, m) => s + (m.total_distance_m ?? 0), 0) /
            recentCv.length /
            1000 *
            10
        ) / 10
      : 0;
  const latestAcwr =
    loadRecords.length > 0 ? loadRecords[0]?.acwr_ratio ?? 0 : 0;

  // Determine strength and growth area
  const metrics = [
    { label: "Endurance", value: avgDistance, ref: 6 },
    { label: "Speed", value: maxSpeed, ref: 25 },
    { label: "Intensity", value: avgTrimp, ref: 150 },
    { label: "Recovery", value: avgRecovery, ref: 40 },
  ];

  const sorted = metrics
    .map((m) => ({ ...m, pct: m.ref > 0 ? m.value / m.ref : 0 }))
    .sort((a, b) => b.pct - a.pct);

  const strength = sorted[0];
  const growthArea = sorted[sorted.length - 1];

  return (
    <PlayerShell player={player}>
      <PlayerTipsClient
        playerId={player.id}
        playerName={player.name}
        position={player.position}
        stats={{
          avgTrimp,
          avgRecovery,
          maxSpeed,
          avgDistance,
          acwr: latestAcwr,
          strength: strength.label,
          strengthValue: `${strength.value}`,
          growthArea: growthArea.label,
          growthValue: `${growthArea.value}`,
        }}
      />
    </PlayerShell>
  );
}
