import { createClient, createAdminClient } from "@/lib/supabase/server";
import { SquadBuilder } from "@/components/squad/squad-builder";
import type { PitchPlayer } from "@/components/squad/pitch-diagram";
import type { TacticalMetrics } from "@/types";

export default async function SquadBuilderPage() {
  const authClient = await createClient();
  const supabase = createAdminClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("auth_user_id", user!.id)
    .single();

  if (!profile) return null;

  // Fetch all active players
  const { data: playersRaw } = await supabase
    .from("players")
    .select("id, name, position, jersey_number, status")
    .eq("academy_id", profile.academy_id)
    .eq("status", "active")
    .order("jersey_number", { ascending: true });

  const playerList = playersRaw ?? [];

  // Fetch latest load records for each player (most recent ACWR)
  const playerIds = playerList.map((p) => p.id);

  let loadMap = new Map<
    string,
    { acwr_ratio: number; risk_flag: string }
  >();

  if (playerIds.length > 0) {
    const { data: loadRecords } = await supabase
      .from("load_records")
      .select("player_id, acwr_ratio, risk_flag, date")
      .in("player_id", playerIds)
      .order("date", { ascending: false });

    if (loadRecords) {
      for (const lr of loadRecords) {
        if (!loadMap.has(lr.player_id)) {
          loadMap.set(lr.player_id, {
            acwr_ratio: lr.acwr_ratio,
            risk_flag: lr.risk_flag,
          });
        }
      }
    }
  }

  // Fetch latest wearable metrics for each player (recent HR/TRIMP)
  let metricsMap = new Map<
    string,
    { hr_avg: number; trimp_score: number }
  >();

  if (playerIds.length > 0) {
    const { data: wearableMetrics } = await supabase
      .from("wearable_metrics")
      .select("player_id, hr_avg, trimp_score, session_id")
      .in("player_id", playerIds)
      .order("created_at", { ascending: false });

    if (wearableMetrics) {
      for (const wm of wearableMetrics) {
        if (!metricsMap.has(wm.player_id)) {
          metricsMap.set(wm.player_id, {
            hr_avg: wm.hr_avg,
            trimp_score: wm.trimp_score,
          });
        }
      }
    }
  }

  // Build PitchPlayer array
  const pitchPlayers: PitchPlayer[] = playerList.map((p) => {
    const load = loadMap.get(p.id);
    const metrics = metricsMap.get(p.id);
    return {
      id: p.id,
      name: p.name,
      jerseyNumber: p.jersey_number,
      position: p.position,
      acwrRatio: load?.acwr_ratio ?? null,
      riskFlag: load?.risk_flag ?? null,
      hrAvg: metrics?.hr_avg ?? null,
      trimpScore: metrics?.trimp_score ?? null,
      recentForm: null,
    };
  });

  // Fetch tactical metrics for formation comparison
  const { data: tacticalRaw } = await supabase
    .from("tactical_metrics")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  const tacticalMetrics: TacticalMetrics[] = tacticalRaw ?? [];

  // Fetch goals per session from video_tags
  const sessionIds = tacticalMetrics.map((tm) => tm.session_id);
  let goalsBySession: Record<string, number> = {};

  if (sessionIds.length > 0) {
    const { data: goalTags } = await supabase
      .from("video_tags")
      .select("video_id, tag_type")
      .eq("tag_type", "goal");

    if (goalTags) {
      // We need to map video_id to session_id through videos table
      const videoIds = goalTags.map((g) => g.video_id);
      if (videoIds.length > 0) {
        const { data: videos } = await supabase
          .from("videos")
          .select("id, session_id")
          .in("id", videoIds);

        if (videos) {
          for (const v of videos) {
            goalsBySession[v.session_id] =
              (goalsBySession[v.session_id] ?? 0) + 1;
          }
        }
      }
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold">Squad Builder</h2>
        <p className="text-sm text-muted-foreground">
          Build your match squad with AI-powered recommendations
        </p>
      </div>
      <SquadBuilder
        players={pitchPlayers}
        tacticalMetrics={tacticalMetrics}
        goalsBySession={goalsBySession}
      />
    </div>
  );
}
