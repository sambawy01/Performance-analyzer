// packages/supabase/functions/health/index.ts
// Health check endpoint for monitoring Mac Mini and RPi connectivity.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
  // Only allow GET
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Verify service role key
  const authHeader = req.headers.get("Authorization");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!authHeader || authHeader !== `Bearer ${serviceRoleKey}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Check database connectivity
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      serviceRoleKey ?? ""
    );

    const { count, error } = await supabase
      .from("academies")
      .select("*", { count: "exact", head: true });

    if (error) throw error;

    return new Response(
      JSON.stringify({
        status: "healthy",
        timestamp: new Date().toISOString(),
        database: "connected",
        academy_count: count,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 503,
      }
    );
  }
});
