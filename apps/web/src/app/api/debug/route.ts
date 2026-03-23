import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET() {
  // Use service role key directly — bypass RLS
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: sessions } = await supabase.from("sessions").select("id,date,type").order("date", { ascending: false }).limit(5);
  const { data: players } = await supabase.from("players").select("id,name").limit(5);
  const { data: users } = await supabase.from("users").select("id,name,email,auth_user_id");
  const { data: loadRecords } = await supabase.from("load_records").select("id").limit(5);
  const { data: metrics } = await supabase.from("wearable_metrics").select("id").limit(5);

  return NextResponse.json({
    env: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30),
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
    },
    sessions: { count: sessions?.length ?? 0, data: sessions },
    players: { count: players?.length ?? 0, data: players },
    users: users,
    loadRecords: loadRecords?.length ?? 0,
    metrics: metrics?.length ?? 0,
  });
}
