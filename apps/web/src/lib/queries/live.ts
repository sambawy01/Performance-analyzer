import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface LiveHrReading {
  session_id: string;
  player_id: string;
  device_id: string;
  hr_stream: Array<{ timestamp_ms: number; hr: number }>;
  started_at: string;
  ended_at: string | null;
  // joined from subscription or local state
  player_name?: string;
  jersey_number?: number;
  position?: string;
  hr_max_measured?: number | null;
  dob?: string;
}

/**
 * Subscribe to realtime updates on wearable_sessions for a given session.
 * Supabase Realtime listens for UPDATE events on hr_stream column changes.
 */
export function subscribeToLiveHr(
  sessionId: string,
  onUpdate: (payload: LiveHrReading) => void
): RealtimeChannel {
  const supabase = createClient();

  const channel = supabase
    .channel(`live-hr-${sessionId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "wearable_sessions",
        filter: `session_id=eq.${sessionId}`,
      },
      (payload) => {
        onUpdate(payload.new as LiveHrReading);
      }
    )
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "wearable_sessions",
        filter: `session_id=eq.${sessionId}`,
      },
      (payload) => {
        onUpdate(payload.new as LiveHrReading);
      }
    )
    .subscribe();

  return channel;
}

export function unsubscribeFromLiveHr(channel: RealtimeChannel) {
  const supabase = createClient();
  supabase.removeChannel(channel);
}

/**
 * Fetch initial state of all wearable sessions for a given session.
 */
export async function getActiveWearableSessions(sessionId: string) {
  const supabase = createClient();

  const { data } = await supabase
    .from("wearable_sessions")
    .select(
      `
      *,
      *
    `
    )
    .eq("session_id", sessionId)
    .is("ended_at", null);

  return data ?? [];
}
