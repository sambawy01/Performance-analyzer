"use client";

import { useEffect, useState, useRef } from "react";
import {
  subscribeToLiveHr,
  unsubscribeFromLiveHr,
  getActiveWearableSessions,
} from "@/lib/queries/live";
import { PlayerHrBar } from "./player-hr-bar";
import { FatigueAlertPanel } from "./fatigue-alerts";
import { LiveVideoPlayer } from "./live-video-player";
import { estimateHrMax, getHrZone } from "@/lib/hr-zones";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Radio, Users, Heart } from "lucide-react";
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
  streamUrl?: string | null;
  veoShareUrl?: string | null;
}

export function LiveHrDashboard({
  sessionId,
  streamUrl,
  veoShareUrl,
}: LiveHrDashboardProps) {
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

  // Subscribe to realtime updates
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

  // Team stats
  const avgHr =
    playerArray.length > 0
      ? Math.round(
          playerArray.reduce((s, p) => s + p.currentHr, 0) /
            playerArray.filter((p) => p.currentHr > 0).length || 0
        )
      : 0;

  const zone5Count = playerArray.filter(
    (p) => p.currentHr > 0 && getHrZone(p.currentHr, p.hrMax) === 5
  ).length;

  return (
    <div className="space-y-4">
      {/* Status bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                connected ? "bg-green-500 animate-pulse" : "bg-gray-400"
              }`}
            />
            <span className="text-sm font-medium">
              {connected ? "Live" : "Waiting for data..."}
            </span>
          </div>
          {lastUpdate && (
            <span className="text-xs text-muted-foreground">
              Last: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {avgHr > 0 && (
            <div className="flex items-center gap-1.5">
              <Heart className="h-3.5 w-3.5 text-red-500" />
              <span className="text-sm font-medium">Team avg: {avgHr} bpm</span>
            </div>
          )}
          {zone5Count > 0 && (
            <Badge variant="destructive">{zone5Count} in Z5</Badge>
          )}
          <Badge variant="outline" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {playerArray.length}
          </Badge>
        </div>
      </div>

      {/* Fatigue alerts — always visible at top */}
      <FatigueAlertPanel alerts={fatigueAlerts} />

      {/* Main layout: Video (left) + HR bars (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Video panel — takes 3 cols on large screens */}
        <div className="lg:col-span-3">
          <LiveVideoPlayer
            streamUrl={streamUrl}
            veoShareUrl={veoShareUrl}
          />
        </div>

        {/* HR bars — takes 2 cols, scrollable */}
        <div className="lg:col-span-2">
          {playerArray.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Radio className="h-8 w-8 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">
                  No active heart rate streams.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Waiting for ESP32 nodes or mock data seeder...
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
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
      </div>
    </div>
  );
}
