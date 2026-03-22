"use client";

import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { riskFlagBadgeVariant, ageGroupLabel } from "@/lib/format";
import {
  AlertTriangle,
  TrendingUp,
  Activity,
  ChevronDown,
  ChevronUp,
  Brain,
  Shield,
  Lightbulb,
  Search,
} from "lucide-react";

interface Alert {
  id: string;
  acwr_ratio: number;
  risk_flag: string;
  date: string;
  daily_load: number;
  acute_load_7d: number;
  chronic_load_28d: number;
  player_id: string;
  players: {
    name: string;
    jersey_number: number;
    age_group: string;
    position: string;
  };
}

function getAlertMessage(alert: Alert): string {
  const ratio = alert.acwr_ratio;
  if (ratio > 1.8) {
    return `Extreme load spike — ${Math.round((ratio - 1) * 100)}% above chronic baseline. High injury risk.`;
  }
  if (ratio > 1.5) {
    return `Significant load increase — training load is ${Math.round((ratio - 1) * 100)}% above 28-day average.`;
  }
  if (ratio > 1.3) {
    return `Moderate load increase — approaching danger zone.`;
  }
  return `Load trending upward — keep monitoring.`;
}

function getAiReason(alert: Alert): string {
  const ratio = alert.acwr_ratio;
  const pos = alert.players.position;
  const acute = Math.round(alert.acute_load_7d);
  const chronic = Math.round(alert.chronic_load_28d);

  if (ratio > 1.8) {
    return `${alert.players.name}'s 7-day acute load (${acute}) is nearly double the 28-day chronic average (${chronic}). This rapid spike pattern is the #1 predictor of soft tissue injuries in youth athletes. ${pos === "ST" || pos === "W" || pos === "CAM" ? "As an attacking player, high-speed running and deceleration loads compound the risk — hamstring and groin injuries are most likely." : pos === "CB" || pos === "FB" ? "As a defender, repeated acceleration/deceleration during pressing and recovery runs increases strain on the posterior chain." : "Midfield players cover the most ground — cumulative fatigue affects decision-making before the body shows visible signs."}`;
  }
  if (ratio > 1.5) {
    return `Training load has increased ${Math.round((ratio - 1) * 100)}% over the past week compared to the monthly baseline. The body adapts to gradual load increases (5-10% per week), but this jump exceeds safe thresholds. ${alert.players.age_group === "2013" || alert.players.age_group === "2012" ? "Youth players under 14 are particularly vulnerable during growth spurts — their musculoskeletal system hasn't matured enough to absorb sudden load spikes." : "At U16 level, players can handle more load, but recovery windows between sessions become critical."}`;
  }
  return `Load is creeping above the optimal 0.8-1.3 ACWR zone. While not immediately dangerous, consecutive sessions at this level without adequate recovery will push into the red zone. Current trajectory suggests reaching ACWR 1.5+ within 2-3 sessions if intensity is maintained.`;
}

function getAiSuggestion(alert: Alert): string[] {
  const ratio = alert.acwr_ratio;

  if (ratio > 1.8) {
    return [
      "Rest from team training for 24-48 hours — individual light work only",
      "If a match is within 48 hours, limit to 45 minutes or use as sub",
      "Replace high-intensity drills with technical/tactical work at walking pace",
      "Schedule a 1-on-1 check-in — ask about sleep quality, muscle tightness, mood",
    ];
  }
  if (ratio > 1.5) {
    return [
      "Reduce session intensity by 20-30% for the next 2 sessions",
      "Avoid back-to-back high-intensity days — alternate with recovery sessions",
      "Monitor HR recovery between drills — if recovery slows, pull from the drill",
      "Consider reducing match minutes this weekend (start on bench, sub in at 60')",
    ];
  }
  return [
    "No immediate changes needed — but don't increase intensity this week",
    "Prioritize sleep and nutrition conversations with the player",
    "Watch for early fatigue signs: slower sprint recovery, reduced engagement",
    "Reassess after next session — if ACWR continues rising, reduce load",
  ];
}

function getAiPrevention(alert: Alert): string[] {
  const ratio = alert.acwr_ratio;

  if (ratio > 1.8) {
    return [
      "Implement a mandatory recovery protocol: foam rolling, stretching, cold water immersion",
      "Add RPE tracking — have the player rate effort after each session to catch subjective fatigue early",
      "Review the weekly schedule — identify which session caused the spike and restructure",
      "Consider a periodization adjustment: build in a deload week every 3 weeks",
    ];
  }
  if (ratio > 1.5) {
    return [
      "Build progressive overload into the training plan — increase load by max 10% per week",
      "Ensure at least 48 hours between high-intensity sessions for this player",
      "Track HR recovery post-session — declining recovery rate is an early warning sign",
      "Educate the player on self-reporting: muscle soreness, sleep quality, energy levels",
    ];
  }
  return [
    "Maintain current training structure — the load is manageable if it stabilizes",
    "Use the next 7 days to establish a new baseline before adding intensity",
    "Monitor the ACWR trend line — you want it to flatten, not continue climbing",
  ];
}

function getAlertIcon(riskFlag: string) {
  if (riskFlag === "red")
    return <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />;
  if (riskFlag === "amber")
    return <TrendingUp className="h-5 w-5 text-amber-500 shrink-0" />;
  return <Activity className="h-5 w-5 text-blue-500 shrink-0" />;
}

function getRiskBorderColor(riskFlag: string): string {
  if (riskFlag === "red") return "border-l-4 border-l-red-500";
  if (riskFlag === "amber") return "border-l-4 border-l-amber-400";
  return "border-l-4 border-l-blue-400";
}

function AlertCard({ alert }: { alert: Alert }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`rounded-md border p-3 ${getRiskBorderColor(alert.risk_flag)} cursor-pointer transition-colors hover:bg-muted/30`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start gap-3">
        {getAlertIcon(alert.risk_flag)}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold">
              #{alert.players.jersey_number} {alert.players.name}
            </span>
            <div className="flex items-center gap-2">
              <Badge variant={riskFlagBadgeVariant(alert.risk_flag)}>
                ACWR {alert.acwr_ratio}
              </Badge>
              {expanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
          <div className="flex gap-2 text-xs text-muted-foreground mb-1.5">
            <span>{alert.players.position}</span>
            <span>{ageGroupLabel(alert.players.age_group)}</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {getAlertMessage(alert)}
          </p>
          <div className="flex gap-4 mt-2 text-xs">
            <span className="text-muted-foreground">
              7d load:{" "}
              <span className="font-medium text-foreground">
                {Math.round(alert.acute_load_7d)}
              </span>
            </span>
            <span className="text-muted-foreground">
              28d avg:{" "}
              <span className="font-medium text-foreground">
                {Math.round(alert.chronic_load_28d)}
              </span>
            </span>
          </div>

          {expanded && (
            <div className="mt-4 space-y-4 border-t pt-4">
              {/* AI Analysis */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Search className="h-3.5 w-3.5 text-blue-500" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                    Why this is happening
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {getAiReason(alert)}
                </p>
              </div>

              {/* Suggestions */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-amber-600">
                    What to do now
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {getAiSuggestion(alert).map((s, i) => (
                    <li
                      key={i}
                      className="text-xs text-muted-foreground flex items-start gap-2"
                    >
                      <span className="text-amber-500 mt-0.5 shrink-0">
                        {i + 1}.
                      </span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Prevention */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Shield className="h-3.5 w-3.5 text-green-500" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-green-600">
                    Prevention measures
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {getAiPrevention(alert).map((p, i) => (
                    <li
                      key={i}
                      className="text-xs text-muted-foreground flex items-start gap-2"
                    >
                      <span className="text-green-500 mt-0.5 shrink-0">
                        {i + 1}.
                      </span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>

              {/* AI badge */}
              <div className="flex items-center gap-1.5 pt-2 border-t">
                <Brain className="h-3 w-3 text-violet-500" />
                <span className="text-[10px] text-violet-500 font-medium">
                  AI-generated analysis based on ACWR data, position, and age
                  group
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function AlertPanel({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Injury Risk Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center py-6 text-center">
            <div className="rounded-full bg-green-50 p-3 mb-3">
              <Activity className="h-6 w-6 text-green-500" />
            </div>
            <p className="text-sm font-medium text-green-700">All clear</p>
            <p className="text-xs text-muted-foreground mt-1">
              No players in the amber or red ACWR zone.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const redCount = alerts.filter((a) => a.risk_flag === "red").length;
  const amberCount = alerts.filter((a) => a.risk_flag === "amber").length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          Injury Risk Alerts
        </CardTitle>
        <div className="flex gap-2 mt-1">
          {redCount > 0 && (
            <Badge variant="destructive">{redCount} high risk</Badge>
          )}
          {amberCount > 0 && (
            <Badge
              variant="default"
              className="bg-amber-500 hover:bg-amber-600"
            >
              {amberCount} caution
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.slice(0, 8).map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
