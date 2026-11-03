import { createClient } from "npm:@supabase/supabase-js@2";
const allowedOrigin = "https://flamencoevents.github.io";
const cors = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Vary": "Origin",
};
const reply = (code: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status: code,
    headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

Deno.serve(async (req: Request) => {
  if (req.headers.get("origin") && req.headers.get("origin") !== allowedOrigin)
    return reply(403, { error: "Origin not allowed" });
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return reply(405, { error: "Method not allowed" });

  const jwt = req.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!jwt) return reply(401, { error: "Authentication required" });
  const url = Deno.env.get("SUPABASE_URL");
  const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !secret) return reply(503, { error: "Server not configured" });
  const db = createClient(url, secret, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: session, error: authError } = await db.auth.getUser(jwt);
  if (authError || !session.user) return reply(401, { error: "Invalid session" });
  const actor = session.user;
  const { data: actorProfile, error: actorError } = await db.from("profiles")
    .select("role").eq("id", actor.id).maybeSingle();
  if (actorError || actorProfile?.role !== "admin")
    return reply(403, { error: "Only the owner administrator can assign sales roles" });

  let body: { user_id?: unknown; role?: unknown };
  try { body = await req.json(); }
  catch { return reply(400, { error: "Invalid JSON" }); }
  if (typeof body.user_id !== "string" || !uuid.test(body.user_id) ||
      (body.role !== "client" && body.role !== "sales")) {
    return reply(400, { error: "Valid user_id and role (client/sales) required" });
  }
  if (body.user_id === actor.id)
    return reply(403, { error: "Own administrative role cannot be modified" });

  // Only users with verified emails can receive commercial access.
  const { data: target, error: targetError } = await db.auth.admin.getUserById(body.user_id);
  if (targetError || !target.user?.email_confirmed_at)
    return reply(409, { error: "Target identity is not verified" });
  const { data: previous, error: previousError } = await db.from("profiles")
    .select("role").eq("id", body.user_id).maybeSingle();
  if (previousError) return reply(500, { error: "Role lookup failed" });
  if (previous?.role === "admin") return reply(403, { error: "Administrators cannot be modified here" });
  if (previous?.role === body.role) return reply(200, { status: "unchanged" });

  // The service-role-only RPC performs the profile update and audit in one transaction.
  const { data: outcome, error: assignmentError } = await db.rpc("assign_sales_role_atomic", {
    p_actor: actor.id,
    p_target: body.user_id,
    p_new_role: body.role,
  });
  if (assignmentError) {
    return reply(500, { error: "Role assignment rejected by database", detail: assignmentError.code });
  }
  return reply(200, { status: outcome, role: body.role });
});

