import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { riskFlagBadgeVariant } from "@/lib/format";

interface Alert {
  id: string;
  acwr_ratio: number;
  risk_flag: string;
  date: string;
  players: {
    name: string;
    jersey_number: number;
    age_group: string;
    position: string;
  };
}

export function AlertPanel({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No active injury risk alerts.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Injury Risk Alerts ({alerts.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.slice(0, 8).map((alert) => (
            <Link
              key={alert.id}
              href={`/players/${alert.players?.name ? "#" : "#"}`}
              className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">
                  #{alert.players.jersey_number} {alert.players.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {alert.players.position}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  ACWR: {alert.acwr_ratio}
                </span>
                <Badge variant={riskFlagBadgeVariant(alert.risk_flag)}>
                  {alert.risk_flag.toUpperCase()}
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
