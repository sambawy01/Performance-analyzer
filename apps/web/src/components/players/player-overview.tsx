import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ageGroupLabel, formatDate, riskFlagBadgeVariant } from "@/lib/format";
import type { Player } from "@opsnerve/types";

interface PlayerOverviewProps {
  player: Player;
  latestLoad: {
    risk_flag: string;
    acwr_ratio: number;
    date: string;
  } | null;
  sessionCount: number;
}

export function PlayerOverview({
  player,
  latestLoad,
  sessionCount,
}: PlayerOverviewProps) {
  const initials = player.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  const age = Math.floor(
    (Date.now() - new Date(player.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-xl">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-xl">
              #{player.jersey_number} {player.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {player.position} | {ageGroupLabel(player.age_group)} | Age {age}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <Badge
              variant={
                player.status === "active" ? "secondary" : "destructive"
              }
            >
              {player.status.charAt(0).toUpperCase() + player.status.slice(1)}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Load Risk</p>
            {latestLoad ? (
              <Badge variant={riskFlagBadgeVariant(latestLoad.risk_flag)}>
                {latestLoad.risk_flag.toUpperCase()} (ACWR:{" "}
                {latestLoad.acwr_ratio})
              </Badge>
            ) : (
              <span className="text-sm">--</span>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Sessions (28d)</p>
            <p className="text-lg font-semibold">{sessionCount}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Foot</p>
            <p className="text-sm capitalize">{player.dominant_foot}</p>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Height</p>
            <p>{player.height_cm ? `${player.height_cm} cm` : "--"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Weight</p>
            <p>{player.weight_kg ? `${player.weight_kg} kg` : "--"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">HR Max (measured)</p>
            <p>
              {player.hr_max_measured
                ? `${player.hr_max_measured} bpm`
                : "Not measured"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">DOB</p>
            <p>{formatDate(player.dob)}</p>
          </div>
        </div>

        {/* AI Development Summary Placeholder */}
        <div className="mt-4 p-3 bg-muted/50 rounded-md">
          <p className="text-xs text-muted-foreground italic">
            AI development summary will be generated here once the AI layer is
            connected. It will analyze the player&apos;s recent trends across
            physical, tactical, and workload dimensions.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
