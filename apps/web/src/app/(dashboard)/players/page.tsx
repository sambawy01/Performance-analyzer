import { createClient } from "@/lib/supabase/server";
import { getPlayers } from "@/lib/queries/players";
import { PlayerFilters } from "@/components/players/player-filters";
import { PlayerCard } from "@/components/players/player-card";

interface PlayersPageProps {
  searchParams: Promise<{
    age_group?: string;
    position?: string;
    status?: string;
  }>;
}

export default async function PlayersPage({ searchParams }: PlayersPageProps) {
  const params = await searchParams;
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

  const players = await getPlayers(profile.academy_id, {
    ageGroup: params.age_group,
    position: params.position,
    status: params.status,
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Players ({players.length})</h2>

      <PlayerFilters />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {players.map((player) => (
          <PlayerCard key={player.id} player={player as any} />
        ))}
      </div>

      {players.length === 0 && (
        <p className="text-center text-muted-foreground py-8">
          No players found matching the current filters.
        </p>
      )}
    </div>
  );
}
