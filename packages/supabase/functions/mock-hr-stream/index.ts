// Supabase Edge Function: mock-hr-stream
// Simulates HR data flowing from ESP32 wearables for the live dashboard demo.
//
// Invoke via:
//   curl -X POST 'https://<project>.supabase.co/functions/v1/mock-hr-stream' \
//     -H 'Authorization: Bearer <anon-key>' \
//     -H 'Content-Type: application/json' \
//     -d '{"session_id": "<uuid>", "iterations": 300, "interval_ms": 1000}'
//
// The function:
//   1. Takes session_id + optional player_ids[] in the request body
//   2. Finds players in the session's age group (up to 22)
//   3. Creates/resets wearable_sessions rows for each player
//   4. Streams realistic HR readings (warm-up → high intensity → cooldown)
//   5. Returns a summary when done

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface HrReading {
  timestamp_ms: number;
  hr: number;
}

// Simulate realistic HR for a youth footballer across a session arc.
// playerSeed provides per-player variance so all players aren't identical.
function simulateHr(
  elapsedSeconds: number,
  durationSeconds: number,
  playerSeed: number
): number {
  const phase = elapsedSeconds / durationSeconds;
  const noise = Math.sin(elapsedSeconds * 0.1 + playerSeed) * 5;
  const positionVariance = (playerSeed % 7) * 2; // GK lower, ST higher

  let baseHr: number;

  if (phase < 0.1) {
    // Warm-up: 100 → 130
    baseHr = 100 + phase * 300;
  } else if (phase < 0.3) {
    // Build: 130 → 155
    baseHr = 130 + (phase - 0.1) * 125;
  } else if (phase < 0.7) {
    // High intensity with intervals
    const interval = Math.sin(elapsedSeconds * 0.05 + playerSeed) * 15;
    baseHr = 155 + interval;
  } else if (phase < 0.85) {
    // Active recovery: 145 → 130
    baseHr = 145 - (phase - 0.7) * 100;
  } else {
    // Cooldown: 130 → 100
    baseHr = 130 - (phase - 0.85) * 200;
  }

  return Math.max(80, Math.min(210, Math.round(baseHr + noise + positionVariance)));
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
      },
    });
  }

  try {
    const body = await req.json();
    const {
      session_id,
      player_ids,
      iterations = 300,
      interval_ms = 1000,
    } = body;

    if (!session_id) {
      return new Response(
        JSON.stringify({ error: "session_id is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Clamp iterations to prevent runaway functions (max 10 minutes at 1 Hz)
    const safeIterations = Math.min(iterations, 600);
    const safeIntervalMs = Math.max(interval_ms, 500);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Get session details
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("id, age_group, academy_id")
      .eq("id", session_id)
      .single();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ error: "Session not found", detail: sessionError?.message }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. Get players for the session's age group (or use supplied player_ids)
    let playersQuery = supabase
      .from("players")
      .select("id, name, jersey_number")
      .eq("academy_id", session.academy_id)
      .eq("age_group", session.age_group)
      .eq("status", "active")
      .limit(22);

    if (player_ids && Array.isArray(player_ids) && player_ids.length > 0) {
      playersQuery = playersQuery.in("id", player_ids);
    }

    const { data: players, error: playersError } = await playersQuery;

    if (playersError || !players || players.length === 0) {
      return new Response(
        JSON.stringify({
          error: "No players found for this session's age group",
          detail: playersError?.message,
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3. Reset wearable_sessions for this session (clean slate)
    await supabase
      .from("wearable_sessions")
      .delete()
      .eq("session_id", session_id);

    const startTime = Date.now();

    const wearableSessions = players.map((p, i) => ({
      session_id: session_id,
      player_id: p.id,
      device_type: "magene_h303",
      device_id: `mock-device-${String(i + 1).padStart(2, "0")}`,
      started_at: new Date(startTime).toISOString(),
      hr_stream: [] as HrReading[],
    }));

    const { error: insertError } = await supabase
      .from("wearable_sessions")
      .insert(wearableSessions);

    if (insertError) {
      return new Response(
        JSON.stringify({ error: "Failed to create wearable sessions", detail: insertError.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 4. Stream HR data — append one reading per player per iteration
    const totalDurationSeconds = safeIterations * (safeIntervalMs / 1000);

    for (let i = 0; i < safeIterations; i++) {
      const elapsedSeconds = i * (safeIntervalMs / 1000);
      const timestamp_ms = startTime + i * safeIntervalMs;

      // Update each player's hr_stream in parallel
      const updates = players.map(async (p, playerIndex) => {
        const hr = simulateHr(elapsedSeconds, totalDurationSeconds, playerIndex);
        const reading: HrReading = { timestamp_ms, hr };

        await supabase.rpc("append_hr_reading", {
          p_session_id: session_id,
          p_player_id: p.id,
          p_reading: reading,
        });
      });

      await Promise.all(updates);

      // Respect the interval between readings
      if (i < safeIterations - 1) {
        await new Promise((resolve) => setTimeout(resolve, safeIntervalMs));
      }
    }

    // 5. Mark sessions as ended
    await supabase
      .from("wearable_sessions")
      .update({ ended_at: new Date().toISOString() })
      .eq("session_id", session_id);

    return new Response(
      JSON.stringify({
        success: true,
        players_simulated: players.length,
        iterations_completed: safeIterations,
        duration_seconds: totalDurationSeconds,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Unexpected error", detail: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
