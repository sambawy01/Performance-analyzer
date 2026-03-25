import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPTS } from "@/lib/ai/prompts";
import { enrichSessionContext } from "@/lib/ai/enrich-context";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const VALID_TYPES = ["session_summary", "tactical_analysis"] as const;
type ReportType = (typeof VALID_TYPES)[number];

/**
 * GET /api/ai/cached-report?sessionId=xxx&type=session_summary
 * Returns cached report if it exists.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const type = searchParams.get("type") as ReportType | null;

    if (!sessionId || !type || !VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: "sessionId and valid type are required" },
        { status: 400 }
      );
    }

    // Auth check
    const authClient = await createClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    const { data: report } = await supabase
      .from("ai_reports")
      .select("id, content, created_at")
      .eq("session_id", sessionId)
      .eq("report_type", type)
      .maybeSingle();

    if (!report) {
      return NextResponse.json({ cached: false, content: null });
    }

    return NextResponse.json({
      cached: true,
      content: report.content,
      createdAt: report.created_at,
    });
  } catch (error) {
    console.error("Cached report GET error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch report",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ai/cached-report
 * { sessionId, type, force? }
 * Generates report, caches it, returns it. If force=true, regenerates even if cached.
 */
export async function POST(request: NextRequest) {
  try {
    const { sessionId, type, force } = await request.json();

    if (
      !sessionId ||
      typeof sessionId !== "string" ||
      !type ||
      !VALID_TYPES.includes(type)
    ) {
      return NextResponse.json(
        { error: "sessionId and valid type are required" },
        { status: 400 }
      );
    }

    // Auth check
    const authClient = await createClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Get user profile
    const { data: profile } = await supabase
      .from("users")
      .select("academy_id")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    // If not forcing, check cache first
    if (!force) {
      const { data: existing } = await supabase
        .from("ai_reports")
        .select("id, content, created_at")
        .eq("session_id", sessionId)
        .eq("report_type", type)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({
          cached: true,
          content: existing.content,
          createdAt: existing.created_at,
        });
      }
    }

    // Get session
    const { data: session } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("academy_id", profile.academy_id)
      .single();

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Fetch all session data
    const [metricsRes, cvRes, loadRes, tacticalRes] = await Promise.all([
      supabase
        .from("wearable_metrics")
        .select("*")
        .eq("session_id", sessionId),
      supabase.from("cv_metrics").select("*").eq("session_id", sessionId),
      supabase.from("load_records").select("*").eq("session_id", sessionId),
      supabase
        .from("tactical_metrics")
        .select("*")
        .eq("session_id", sessionId)
        .maybeSingle(),
    ]);

    const metrics = metricsRes.data ?? [];
    const cvMetrics = cvRes.data ?? [];
    const loadRecords = loadRes.data ?? [];
    const tactical = tacticalRes.data ?? null;

    // Fetch player names separately (NO FK JOINS)
    const playerIds = [
      ...new Set([
        ...metrics.map((m: any) => m.player_id),
        ...cvMetrics.map((m: any) => m.player_id),
        ...loadRecords.map((l: any) => l.player_id),
      ]),
    ];
    const { data: players } =
      playerIds.length > 0
        ? await supabase
            .from("players")
            .select("id, name, position, jersey_number")
            .in("id", playerIds)
            .eq("academy_id", profile.academy_id)
        : { data: [] };
    const playerMap = new Map(
      (players ?? []).map((p: any) => [p.id, p])
    );

    let content: string;

    if (type === "session_summary") {
      content = await generateSessionSummaryReport(
        session,
        metrics,
        cvMetrics,
        loadRecords,
        tactical,
        playerMap,
        supabase,
        profile.academy_id
      );
    } else {
      // tactical_analysis
      content = await generateTacticalAnalysisReport(
        session,
        tactical,
        metrics,
        cvMetrics,
        playerMap,
        supabase,
        sessionId
      );
    }

    // Upsert into ai_reports (delete old + insert — avoids conflict on unique constraint)
    if (force) {
      await supabase
        .from("ai_reports")
        .delete()
        .eq("session_id", sessionId)
        .eq("report_type", type);
    }

    const { data: saved, error: saveError } = await supabase
      .from("ai_reports")
      .upsert(
        {
          session_id: sessionId,
          player_id: null,
          report_type: type,
          content,
        },
        { onConflict: "session_id,report_type" }
      )
      .select("id, content, created_at")
      .single();

    if (saveError) {
      console.error("Failed to cache report:", saveError);
      // Still return the content even if caching failed
      return NextResponse.json({ cached: false, content });
    }

    return NextResponse.json({
      cached: true,
      content: saved.content,
      createdAt: saved.created_at,
    });
  } catch (error) {
    console.error("Cached report POST error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate report",
      },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// Session Summary Generation
// ---------------------------------------------------------------------------
async function generateSessionSummaryReport(
  session: any,
  metrics: any[],
  cvMetrics: any[],
  loadRecords: any[],
  tactical: any | null,
  playerMap: Map<string, any>,
  supabase: any,
  academyId: string
): Promise<string> {
  if (metrics.length === 0) {
    return "No wearable data available for this session. Attach chest straps to generate AI analysis.";
  }

  // Fetch recent session averages for comparison
  const { data: recentSessions } = await supabase
    .from("sessions")
    .select("id")
    .eq("academy_id", academyId)
    .lt("date", session.date)
    .order("date", { ascending: false })
    .limit(5);

  let recentSessionAverages: any = null;
  if (recentSessions && recentSessions.length > 0) {
    const recentIds = recentSessions.map((s: any) => s.id);
    const { data: recentMetrics } = await supabase
      .from("wearable_metrics")
      .select("trimp_score, hr_avg, hr_zone_4_pct, hr_zone_5_pct")
      .in("session_id", recentIds);
    if (recentMetrics && recentMetrics.length > 0) {
      recentSessionAverages = {
        avgTrimp: Math.round(
          recentMetrics.reduce((s: number, m: any) => s + m.trimp_score, 0) /
            recentMetrics.length
        ),
        avgHr: Math.round(
          recentMetrics.reduce((s: number, m: any) => s + m.hr_avg, 0) /
            recentMetrics.length
        ),
        avgZ45: Math.round(
          recentMetrics.reduce(
            (s: number, m: any) => s + m.hr_zone_4_pct + m.hr_zone_5_pct,
            0
          ) / recentMetrics.length
        ),
        count: recentSessions.length,
      };
    }
  }

  // Enrich data with player names
  const enrichedMetrics = metrics.map((m: any) => {
    const p = playerMap.get(m.player_id);
    return {
      ...m,
      name: p?.name ?? "Unknown",
      position: p?.position ?? "",
      jersey_number: p?.jersey_number ?? 0,
    };
  });
  const enrichedCv = cvMetrics.map((m: any) => {
    const p = playerMap.get(m.player_id);
    return {
      ...m,
      name: p?.name ?? "Unknown",
      position: p?.position ?? "",
      jersey_number: p?.jersey_number ?? 0,
    };
  });
  const enrichedLoad = loadRecords.map((l: any) => {
    const p = playerMap.get(l.player_id);
    return {
      ...l,
      name: p?.name ?? "Unknown",
      jersey_number: p?.jersey_number ?? 0,
    };
  });

  const enrichedContext = enrichSessionContext(
    session,
    enrichedMetrics,
    enrichedCv,
    enrichedLoad,
    recentSessionAverages,
    tactical
  );

  const systemPrompt = `${SYSTEM_PROMPTS.BASE_ANALYST}\n\n${SYSTEM_PROMPTS.SESSION_DEBRIEF}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `Generate a session analysis report:\n\n${enrichedContext}\n\nFollow the SESSION DEBRIEF output format. Rate the session 1-10 using the rubric. Identify top/bottom performers relative to their baselines. Give 5 specific recommendations for the next session.`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  return (textBlock as any)?.text ?? "Unable to generate summary.";
}

// ---------------------------------------------------------------------------
// Tactical Analysis Generation
// ---------------------------------------------------------------------------
async function generateTacticalAnalysisReport(
  session: any,
  tactical: any | null,
  metrics: any[],
  cvMetrics: any[],
  playerMap: Map<string, any>,
  supabase: any,
  sessionId: string
): Promise<string> {
  if (!tactical) {
    return "No tactical data available for this session. Process a video through the CV pipeline to generate tactical analysis.";
  }

  // Fetch tactical history for comparison
  const { data: allTactical } = await supabase
    .from("tactical_metrics")
    .select(
      "session_id, avg_formation, compactness_avg, pressing_intensity, possession_pct, transition_speed_atk_s, transition_speed_def_s"
    )
    .neq("session_id", sessionId)
    .limit(10);

  const tacticalSessionIds = (allTactical ?? []).map(
    (t: any) => t.session_id
  );
  const { data: tactSessions } =
    tacticalSessionIds.length > 0
      ? await supabase
          .from("sessions")
          .select("id, date, type")
          .in("id", tacticalSessionIds)
      : { data: [] };
  const tactSessionMap = new Map<string, any>(
    (tactSessions ?? []).map((s: any) => [s.id, s])
  );

  const historyLines = (allTactical ?? [])
    .map((h: any) => {
      const sess = tactSessionMap.get(h.session_id);
      return `${sess?.date ?? "?"} ${sess?.type ?? "?"}: Formation ${h.avg_formation ?? "?"}, Possession ${h.possession_pct ?? "?"}%, PPDA ${h.pressing_intensity ?? "?"}, Compactness ${h.compactness_avg ?? "?"}m, Transition ${h.transition_speed_atk_s ?? "?"}s/${h.transition_speed_def_s ?? "?"}s`;
    })
    .join("\n");

  // Build CV context for player movement data
  const cvContext =
    cvMetrics.length > 0
      ? cvMetrics
          .map((m: any) => {
            const p = playerMap.get(m.player_id);
            return `${p?.name ?? "Unknown"} (#${p?.jersey_number ?? "?"}): ${m.total_distance_m ?? 0}m distance, ${m.sprint_count ?? 0} sprints, max ${m.max_speed_kmh ?? 0}km/h, ${m.accel_events ?? 0} accel, ${m.decel_events ?? 0} decel`;
          })
          .join("\n")
      : "No CV metrics available.";

  const formationSnapshots = tactical.formation_snapshots
    ? (tactical.formation_snapshots as any[])
        .map((s: any) => `${s.minute}' -> ${s.formation}`)
        .join(", ")
    : "none";

  const systemPrompt = `${SYSTEM_PROMPTS.BASE_ANALYST}\n\n${SYSTEM_PROMPTS.TACTICAL_ANALYSIS}`;

  const prompt = `Provide a tactical deep-dive analysis for this session.

SESSION: ${session.type ?? "training"} on ${session.date ?? "?"} (${session.duration_minutes ?? "?"}min)

TACTICAL DATA:
Formation: ${tactical.avg_formation ?? "Unknown"}
Formation changes: ${formationSnapshots}
Possession: ${tactical.possession_pct ?? "?"}%
PPDA (pressing intensity): ${tactical.pressing_intensity ?? "?"}
Compactness: ${tactical.compactness_avg ?? "?"}m (+-${tactical.compactness_std ?? "?"}m)
Defensive line: ${tactical.defensive_line_height_avg ?? "?"}m
Team shape: ${tactical.team_width_avg ?? "?"}m x ${tactical.team_length_avg ?? "?"}m
Transition Def->Atk: ${tactical.transition_speed_atk_s ?? "?"}s
Transition Atk->Def: ${tactical.transition_speed_def_s ?? "?"}s

PLAYER MOVEMENT DATA:
${cvContext}

TACTICAL HISTORY FOR COMPARISON:
${historyLines || "No previous tactical data."}

Provide a complete tactical analysis following the TACTICAL ANALYSIS framework:
1. What tactical patterns are emerging across recent sessions?
2. What's working and what needs coaching attention?
3. How does this session's tactical profile compare to the best-performing sessions?
4. 3 specific tactical drills to work on based on this data
5. Any concerns about tactical discipline or shape?

Reference specific numbers and compare to previous sessions.`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    system: systemPrompt,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  return (textBlock as any)?.text ?? "Unable to generate tactical analysis.";
}
