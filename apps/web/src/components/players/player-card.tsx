import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ageGroupLabel } from "@/lib/format";
import type { Player } from "@/types";

export function PlayerCard({ player }: { player: Player }) {
  const initials = player.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  const statusColor =
    player.status === "active"
      ? "bg-green-500"
      : player.status === "injured"
        ? "bg-red-500"
        : "bg-gray-400";

  return (
    <Link href={`/players/${player.id}`}>
      <Card className="hover:ring-2 hover:ring-primary/20 transition-all cursor-pointer">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar>
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <span
                className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${statusColor} ${player.status === "active" ? "animate-pulse shadow-[0_0_6px_rgba(0,255,136,0.6)]" : ""}`}
              />
            </div>
            <div className="flex-1">
              <CardTitle className="text-sm">
                #{player.jersey_number} {player.name}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {player.position} | {ageGroupLabel(player.age_group)}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline">{player.dominant_foot}</Badge>
            {player.height_cm && (
              <Badge variant="secondary">{player.height_cm}cm</Badge>
            )}
            {player.status !== "active" && (
              <Badge variant="destructive">
                {player.status.charAt(0).toUpperCase() + player.status.slice(1)}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
