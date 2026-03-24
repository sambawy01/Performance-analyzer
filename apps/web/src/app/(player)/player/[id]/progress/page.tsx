import { notFound } from "next/navigation";
import { getPlayerPortalData } from "@/lib/queries/player-portal";
import { PlayerShell } from "@/components/player/player-shell";
import { PlayerProgressClient } from "@/components/player/player-progress-client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PlayerProgressPage({ params }: Props) {
  const { id } = await params;
  const data = await getPlayerPortalData(id);

  if (!data) return notFound();

  const { player, wearableMetrics, cvMetrics } = data;

  // Build timeline data: merge wearable + CV by session_id, ordered by date
  const sessionMap = new Map<
    string,
    {
      date: string;
      trimp: number;
      maxSpeed: number;
      distance: number;
      hrAvg: number;
      recovery: number;
    }
  >();

  for (const wm of wearableMetrics) {
    const key = wm.session_id;
    if (!sessionMap.has(key)) {
      sessionMap.set(key, {
        date: wm.session?.date ?? "",
        trimp: 0,
        maxSpeed: 0,
        distance: 0,
        hrAvg: 0,
        recovery: 0,
      });
    }
    const entry = sessionMap.get(key)!;
    entry.trimp = wm.trimp_score ?? 0;
    entry.hrAvg = wm.hr_avg ?? 0;
    entry.recovery = wm.hr_recovery_60s ?? 0;
  }

  for (const cv of cvMetrics) {
    const key = cv.session_id;
    if (!sessionMap.has(key)) {
      sessionMap.set(key, {
        date: cv.session?.date ?? "",
        trimp: 0,
        maxSpeed: 0,
        distance: 0,
        hrAvg: 0,
        recovery: 0,
      });
    }
    const entry = sessionMap.get(key)!;
    entry.maxSpeed = cv.max_speed_kmh ?? 0;
    entry.distance = cv.total_distance_m ?? 0;
  }

  const timeline = Array.from(sessionMap.values())
    .filter((e) => e.date)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-20);

  // Personal bests
  const allSpeeds = cvMetrics
    .filter((m) => m.max_speed_kmh)
    .map((m) => ({
      value: m.max_speed_kmh!,
      date: m.session?.date ?? "",
    }));
  const bestSpeed = allSpeeds.length > 0
    ? allSpeeds.reduce((best, cur) => (cur.value > best.value ? cur : best))
    : null;

  const allTrimps = wearableMetrics
    .filter((m) => m.trimp_score)
    .map((m) => ({
      value: m.trimp_score!,
      date: m.session?.date ?? "",
      type: m.session?.type ?? "",
    }));
  const bestTrimp = allTrimps.length > 0
    ? allTrimps.reduce((best, cur) => (cur.value > best.value ? cur : best))
    : null;

  const allRecovery = wearableMetrics
    .filter((m) => m.hr_recovery_60s)
    .map((m) => ({
      value: m.hr_recovery_60s!,
      date: m.session?.date ?? "",
    }));
  const bestRecovery = allRecovery.length > 0
    ? allRecovery.reduce((best, cur) => (cur.value > best.value ? cur : best))
    : null;

  // Month-over-month
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  function isThisMonth(dateStr: string) {
    const d = new Date(dateStr);
    return d >= thisMonthStart;
  }
  function isLastMonth(dateStr: string) {
    const d = new Date(dateStr);
    return d >= lastMonthStart && d < thisMonthStart;
  }

  function monthAvg(
    items: Array<{ session?: { date?: string } | null; [key: string]: any }>,
    key: string,
    filterFn: (d: string) => boolean
  ) {
    const filtered = items.filter(
      (m) => m.session?.date && filterFn(m.session.date) && m[key] != null
    );
    if (filtered.length === 0) return 0;
    return filtered.reduce((s, m) => s + (m[key] ?? 0), 0) / filtered.length;
  }

  const comparison = [
    {
      label: "Avg TRIMP",
      thisMonth: Math.round(monthAvg(wearableMetrics, "trimp_score", isThisMonth)),
      lastMonth: Math.round(monthAvg(wearableMetrics, "trimp_score", isLastMonth)),
    },
    {
      label: "Max Speed",
      thisMonth: parseFloat(
        Math.max(
          ...cvMetrics
            .filter((m) => m.session?.date && isThisMonth(m.session.date))
            .map((m) => m.max_speed_kmh ?? 0),
          0
        ).toFixed(1)
      ),
      lastMonth: parseFloat(
        Math.max(
          ...cvMetrics
            .filter((m) => m.session?.date && isLastMonth(m.session.date))
            .map((m) => m.max_speed_kmh ?? 0),
          0
        ).toFixed(1)
      ),
    },
    {
      label: "Avg Distance",
      thisMonth: parseFloat(
        (monthAvg(cvMetrics, "total_distance_m", isThisMonth) / 1000).toFixed(1)
      ),
      lastMonth: parseFloat(
        (monthAvg(cvMetrics, "total_distance_m", isLastMonth) / 1000).toFixed(1)
      ),
      unit: "km",
    },
    {
      label: "HR Recovery",
      thisMonth: Math.round(
        monthAvg(
          wearableMetrics.filter((m) => m.hr_recovery_60s),
          "hr_recovery_60s",
          isThisMonth
        )
      ),
      lastMonth: Math.round(
        monthAvg(
          wearableMetrics.filter((m) => m.hr_recovery_60s),
          "hr_recovery_60s",
          isLastMonth
        )
      ),
      unit: "bpm/60s",
    },
  ];

  return (
    <PlayerShell player={player}>
      <PlayerProgressClient
        playerId={player.id}
        timeline={timeline}
        milestones={{
          bestSpeed: bestSpeed
            ? { value: bestSpeed.value, date: bestSpeed.date }
            : null,
          bestTrimp: bestTrimp
            ? { value: bestTrimp.value, date: bestTrimp.date, type: bestTrimp.type }
            : null,
          bestRecovery: bestRecovery
            ? { value: bestRecovery.value, date: bestRecovery.date }
            : null,
        }}
        comparison={comparison}
      />
    </PlayerShell>
  );
}
