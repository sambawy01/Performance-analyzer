import { notFound } from "next/navigation";
import { getPlayerPortalData } from "@/lib/queries/player-portal";
import { PlayerShell } from "@/components/player/player-shell";
import { PlayerHomeClient } from "@/components/player/player-home-client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PlayerHomePage({ params }: Props) {
  const { id } = await params;
  const data = await getPlayerPortalData(id);

  if (!data) return notFound();

  const { player, wearableMetrics, cvMetrics, loadRecords, upcomingSessions } =
    data;

  // Compute composite performance score (0-100)
  const recentWearable = wearableMetrics.slice(0, 5);
  const recentCv = cvMetrics.slice(0, 5);

  const avgTrimp =
    recentWearable.length > 0
      ? recentWearable.reduce((s, m) => s + (m.trimp_score ?? 0), 0) /
        recentWearable.length
      : 0;
  const avgRecovery =
    recentWearable.filter((m) => m.hr_recovery_60s).length > 0
      ? recentWearable
          .filter((m) => m.hr_recovery_60s)
          .reduce((s, m) => s + (m.hr_recovery_60s ?? 0), 0) /
        recentWearable.filter((m) => m.hr_recovery_60s).length
      : 0;
  const avgDistance =
    recentCv.length > 0
      ? recentCv.reduce((s, m) => s + (m.total_distance_m ?? 0), 0) /
        recentCv.length
      : 0;
  const avgSprints =
    recentCv.length > 0
      ? recentCv.reduce((s, m) => s + (m.sprint_count ?? 0), 0) /
        recentCv.length
      : 0;

  // Normalize each to 0-25, sum for 0-100
  const trimpScore = Math.min(25, (avgTrimp / 200) * 25);
  const recoveryScore = Math.min(25, (avgRecovery / 50) * 25);
  const distanceScore = Math.min(25, (avgDistance / 8000) * 25);
  const sprintScore = Math.min(25, (avgSprints / 15) * 25);
  const compositeScore = Math.round(
    trimpScore + recoveryScore + distanceScore + sprintScore
  );

  // Weekly stats
  const weekWearable = wearableMetrics.slice(0, 5);
  const weekCv = cvMetrics.slice(0, 5);
  const prevWearable = wearableMetrics.slice(5, 10);
  const prevCv = cvMetrics.slice(5, 10);

  const avgHr =
    weekWearable.length > 0
      ? Math.round(
          weekWearable.reduce((s, m) => s + (m.hr_avg ?? 0), 0) /
            weekWearable.length
        )
      : 0;
  const prevAvgHr =
    prevWearable.length > 0
      ? Math.round(
          prevWearable.reduce((s, m) => s + (m.hr_avg ?? 0), 0) /
            prevWearable.length
        )
      : 0;

  const totalDistanceKm =
    weekCv.length > 0
      ? (
          weekCv.reduce((s, m) => s + (m.total_distance_m ?? 0), 0) / 1000
        ).toFixed(1)
      : "0";
  const prevTotalDistanceKm =
    prevCv.length > 0
      ? prevCv.reduce((s, m) => s + (m.total_distance_m ?? 0), 0) / 1000
      : 0;

  const totalSprints =
    weekCv.length > 0
      ? weekCv.reduce((s, m) => s + (m.sprint_count ?? 0), 0)
      : 0;
  const prevTotalSprints =
    prevCv.length > 0
      ? prevCv.reduce((s, m) => s + (m.sprint_count ?? 0), 0)
      : 0;

  const recoveryVal =
    weekWearable.filter((m) => m.hr_recovery_60s).length > 0
      ? Math.round(
          weekWearable
            .filter((m) => m.hr_recovery_60s)
            .reduce((s, m) => s + (m.hr_recovery_60s ?? 0), 0) /
            weekWearable.filter((m) => m.hr_recovery_60s).length
        )
      : 0;
  const prevRecoveryVal =
    prevWearable.filter((m) => m.hr_recovery_60s).length > 0
      ? Math.round(
          prevWearable
            .filter((m) => m.hr_recovery_60s)
            .reduce((s, m) => s + (m.hr_recovery_60s ?? 0), 0) /
            prevWearable.filter((m) => m.hr_recovery_60s).length
        )
      : 0;

  // Session count this month
  const thisMonth = new Date().getMonth();
  const sessionsThisMonth = wearableMetrics.filter((m) => {
    const d = m.session?.date ? new Date(m.session.date) : null;
    return d && d.getMonth() === thisMonth;
  }).length;

  // Recent sessions (last 5 enriched)
  const recentSessions = wearableMetrics.slice(0, 5).map((wm) => {
    const cv = cvMetrics.find((c) => c.session_id === wm.session_id);
    return {
      session_id: wm.session_id,
      date: wm.session?.date ?? "",
      type: wm.session?.type ?? "Training",
      duration: wm.session?.duration_minutes ?? 0,
      hr_avg: wm.hr_avg ?? 0,
      trimp: wm.trimp_score ?? 0,
      distance_m: cv?.total_distance_m ?? 0,
    };
  });

  // Next session
  const nextSession = upcomingSessions[0] ?? null;

  return (
    <PlayerShell player={player}>
      <PlayerHomeClient
        player={{
          id: player.id,
          name: player.name,
          jersey_number: player.jersey_number,
          position: player.position,
        }}
        compositeScore={compositeScore}
        sessionsThisMonth={sessionsThisMonth}
        nextSession={
          nextSession
            ? {
                date: nextSession.date,
                type: nextSession.type,
                location: nextSession.location,
              }
            : null
        }
        weeklyStats={{
          avgHr,
          avgHrTrend: avgHr - prevAvgHr,
          totalDistanceKm: parseFloat(totalDistanceKm),
          distanceTrend:
            prevTotalDistanceKm > 0
              ? parseFloat(totalDistanceKm) - prevTotalDistanceKm
              : 0,
          totalSprints,
          sprintsTrend: totalSprints - prevTotalSprints,
          recoveryScore: recoveryVal,
          recoveryTrend: recoveryVal - prevRecoveryVal,
        }}
        recentSessions={recentSessions}
      />
    </PlayerShell>
  );
}
