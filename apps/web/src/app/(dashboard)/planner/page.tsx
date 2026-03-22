import { createClient } from "@/lib/supabase/server";
import { WeeklyPlanner } from "@/components/planner/weekly-planner";

export default async function PlannerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("auth_user_id", user!.id)
    .single();

  if (!profile) return null;

  // Get current week boundaries (Monday to Sunday)
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - day + (day === 0 ? -6 : 1));
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const weekStart = monday.toISOString().split("T")[0];
  const weekEnd = sunday.toISOString().split("T")[0];

  // Fetch sessions for the current week
  const { data: sessionsRaw } = await supabase
    .from("sessions")
    .select("*")
    .eq("academy_id", profile.academy_id)
    .gte("date", weekStart)
    .lte("date", weekEnd)
    .order("date", { ascending: true });

  const sessions = sessionsRaw ?? [];

  // Fetch players at risk (amber/red ACWR)
  const { data: riskRecords } = await supabase
    .from("load_records")
    .select(
      "player_id, acwr_ratio, risk_flag, date, players!inner(name, jersey_number, academy_id)"
    )
    .eq("players.academy_id", profile.academy_id)
    .in("risk_flag", ["amber", "red"])
    .order("date", { ascending: false })
    .limit(50);

  // Deduplicate — latest per player
  const seenPlayers = new Set<string>();
  const playersAtRisk: Array<{
    jerseyNumber: number;
    name: string;
    acwr: number;
    riskFlag: string;
  }> = [];

  for (const r of riskRecords ?? []) {
    if (!seenPlayers.has(r.player_id)) {
      seenPlayers.add(r.player_id);
      const player = r.players as unknown as {
        name: string;
        jersey_number: number;
      };
      playersAtRisk.push({
        jerseyNumber: player.jersey_number,
        name: player.name,
        acwr: r.acwr_ratio,
        riskFlag: r.risk_flag,
      });
    }
  }

  // Find next match — look for match/friendly sessions coming up
  const { data: nextMatchSession } = await supabase
    .from("sessions")
    .select("date, notes, type")
    .eq("academy_id", profile.academy_id)
    .in("type", ["match", "friendly"])
    .gte("date", now.toISOString().split("T")[0])
    .order("date", { ascending: true })
    .limit(1);

  const nextMatch =
    nextMatchSession && nextMatchSession.length > 0
      ? {
          date: nextMatchSession[0].date,
          opponent: nextMatchSession[0].notes ?? "TBD",
        }
      : null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold">Weekly Planner</h2>
        <p className="text-sm text-muted-foreground">
          Plan and optimize your training week with AI-powered load management.
        </p>
      </div>

      {/* Planner */}
      <WeeklyPlanner
        initialSessions={sessions}
        playersAtRisk={playersAtRisk}
        nextMatch={nextMatch}
      />
    </div>
  );
}
