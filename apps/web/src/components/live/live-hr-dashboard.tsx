"use client";

import { useEffect, useState, useRef } from "react";
import {
  subscribeToLiveHr,
  unsubscribeFromLiveHr,
  getActiveWearableSessions,
} from "@/lib/queries/live";
import { PlayerHrBar } from "./player-hr-bar";
import { FatigueAlertPanel } from "./fatigue-alerts";
import { estimateHrMax, getHrZone } from "@/lib/hr-zones";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface PlayerLiveState {
  playerId: string;
  playerName: string;
  jerseyNumber: number;
  position: string;
  currentHr: number;
  hrMax: number;
  zone5AccumulatedSeconds: number;
  lastUpdateTime: number;
}

interface LiveHrDashboardProps {
  sessionId: string;
}

export function LiveHrDashboard({ sessionId }: LiveHrDashboardProps) {
  const [players, setPlayers] = useState<Map<string, PlayerLiveState>>(
    new Map()
  );
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Load initial state from existing wearable_sessions rows
  useEffect(() => {
    async function loadInitial() {
      const wearableSessions = await getActiveWearableSessions(sessionId);

      const initialPlayers = new Map<string, PlayerLiveState>();
      for (const ws of wearableSessions) {
        const player = (ws as any).players;
        if (!player) continue;

        const age = player.dob
          ? Math.floor(
              (Date.now() - new Date(player.dob).getTime()) /
                (365.25 * 24 * 60 * 60 * 1000)
            )
          : 14;

        const hrMax = player.hr_max_measured ?? estimateHrMax(age);
        const hrStream: Array<{ timestamp_ms: number; hr: number }> =
          ws.hr_stream ?? [];
        const latestHr =
          hrStream.length > 0 ? hrStream[hrStream.length - 1].hr : 0;

        initialPlayers.set(ws.player_id, {
          playerId: ws.player_id,
          playerName: player.name,
          jerseyNumber: player.jersey_number,
          position: player.position,
          currentHr: latestHr,
          hrMax,
          zone5AccumulatedSeconds: 0,
          lastUpdateTime: Date.now(),
        });
      }

      setPlayers(initialPlayers);
    }

    loadInitial();
  }, [sessionId]);

  // Subscribe to realtime updates — unsubscribe on unmount
  useEffect(() => {
    const channel = subscribeToLiveHr(sessionId, (payload) => {
      setPlayers((prev) => {
        const next = new Map(prev);
        const existing = next.get(payload.player_id);

        const hrStream = payload.hr_stream ?? [];
        const latestHr =
          hrStream.length > 0 ? hrStream[hrStream.length - 1].hr : 0;

        if (existing) {
          const zone = getHrZone(latestHr, existing.hrMax);
          const now = Date.now();
          const elapsed = (now - existing.lastUpdateTime) / 1000;

          let zone5Seconds = existing.zone5AccumulatedSeconds;
          if (zone === 5) {
            zone5Seconds += elapsed;
          }

          next.set(payload.player_id, {
            ...existing,
            currentHr: latestHr,
            zone5AccumulatedSeconds: zone5Seconds,
            lastUpdateTime: now,
          });
        }

        return next;
      });

      setLastUpdate(new Date());
      setConnected(true);
    });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        unsubscribeFromLiveHr(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [sessionId]);

  const playerArray = Array.from(players.values()).sort(
    (a, b) => a.jerseyNumber - b.jerseyNumber
  );

  const fatigueAlerts = playerArray
    .filter((p) => p.zone5AccumulatedSeconds >= 240)
    .map((p) => ({
      playerName: p.playerName,
      jerseyNumber: p.jerseyNumber,
      zone5Minutes: Math.floor(p.zone5AccumulatedSeconds / 60),
      currentHr: p.currentHr,
    }));

  return (
    <div className="space-y-4">
      {/* Connection status bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${
              connected ? "bg-green-500 animate-pulse" : "bg-gray-400"
            }`}
          />
          <span className="text-sm text-muted-foreground">
            {connected ? "Connected" : "Waiting for data..."}
          </span>
          {lastUpdate && (
            <span className="text-xs text-muted-foreground">
              Last update: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>
        <Badge variant="outline">{playerArray.length} players</Badge>
      </div>

      {/* Fatigue alerts */}
      <FatigueAlertPanel alerts={fatigueAlerts} />

      {/* Player HR bars */}
      {playerArray.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No active wearable sessions. Start the mock data seeder or connect
              ESP32 nodes to see live HR data.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Run the <code>mock-hr-stream</code> Edge Function to simulate data.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {playerArray.map((p) => (
            <PlayerHrBar
              key={p.playerId}
              name={p.playerName}
              jerseyNumber={p.jerseyNumber}
              position={p.position}
              currentHr={p.currentHr}
              hrMax={p.hrMax}
              timeInZone5Seconds={p.zone5AccumulatedSeconds}
            />
          ))}
        </div>
      )}
    </div>
  );
}
