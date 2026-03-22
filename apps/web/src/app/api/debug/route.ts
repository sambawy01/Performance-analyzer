import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {}
        },
      },
    }
  );

  // 1. Check auth
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  // 2. Check profile
  const { data: profile, error: profileError } = user
    ? await supabase.from("users").select("*").eq("auth_user_id", user.id).single()
    : { data: null, error: null };

  // 3. Check sessions query
  const { data: sessions, error: sessionsError } = await supabase
    .from("sessions")
    .select("id, date, type, age_group")
    .order("date", { ascending: false })
    .limit(5);

  // 4. Check sessions with academy filter
  const { data: filteredSessions, error: filteredError } = profile
    ? await supabase
        .from("sessions")
        .select("id, date, type")
        .eq("academy_id", profile.academy_id)
        .order("date", { ascending: false })
        .limit(5)
    : { data: null, error: null };

  // 5. Check load records
  const { data: loadRecords, error: loadError } = await supabase
    .from("load_records")
    .select("id, risk_flag, acwr_ratio")
    .limit(5);

  // 6. Check wearable metrics
  const { data: metrics, error: metricsError } = await supabase
    .from("wearable_metrics")
    .select("id, session_id, hr_avg")
    .limit(5);

  return NextResponse.json({
    auth: {
      userId: user?.id ?? null,
      email: user?.email ?? null,
      error: authError?.message ?? null
    },
    profile: {
      found: !!profile,
      role: profile?.role ?? null,
      academy_id: profile?.academy_id ?? null,
      error: profileError?.message ?? null
    },
    sessions: {
      count: sessions?.length ?? 0,
      data: sessions,
      error: sessionsError?.message ?? null
    },
    filteredSessions: {
      count: filteredSessions?.length ?? 0,
      data: filteredSessions,
      error: filteredError?.message ?? null
    },
    loadRecords: {
      count: loadRecords?.length ?? 0,
      data: loadRecords,
      error: loadError?.message ?? null
    },
    wearableMetrics: {
      count: metrics?.length ?? 0,
      data: metrics,
      error: metricsError?.message ?? null
    },
    env: {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      anonKeyPrefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + "...",
    }
  }, { status: 200 });
}
