import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigin = "https://flamencoevents.github.io";
const cors = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Vary": "Origin",
};
function reply(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

Deno.serve(async (request: Request) => {
  const origin = request.headers.get("origin");
  if (origin && origin !== allowedOrigin) return reply(403, { error: "Origin not allowed" });
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (request.method !== "POST") return reply(405, { error: "Method not allowed" });

  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return reply(401, { error: "Authentication required" });

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) return reply(503, { error: "Server not configured" });

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: authenticated, error: authError } = await admin.auth.getUser(token);
  if (authError || !authenticated.user) return reply(401, { error: "Invalid session" });

  const { data: profile, error: profileError } = await admin
    .from("profiles").select("role").eq("id", authenticated.user.id).maybeSingle();
  if (profileError || profile?.role !== "admin") {
    return reply(403, { error: "Administrator permission required" });
  }

  let body: { enquiry_id?: unknown };
  try { body = await request.json(); }
  catch { return reply(400, { error: "Invalid JSON" }); }
  if (typeof body.enquiry_id !== "string" || !uuid.test(body.enquiry_id)) {
    return reply(400, { error: "A valid enquiry_id is required" });
  }

  const { data: enquiry, error: enquiryError } = await admin.from("enquiries")
    .select("id,contact_email,contact_name,service,venue,event_date,stage,call_completed_at,approved_at,quote_sent_at")
    .eq("id", body.enquiry_id).maybeSingle();
  if (enquiryError) return reply(500, { error: "Enquiry lookup failed" });
  if (!enquiry || enquiry.stage !== "accepted" || !enquiry.call_completed_at ||
      !enquiry.approved_at || !enquiry.quote_sent_at) {
    return reply(409, { error: "Quotation has not completed the commercial approval workflow" });
  }
  if (!enquiry.contact_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(enquiry.contact_email)) {
    return reply(422, { error: "A validated client email address is required" });
  }

  const existing = await admin.from("events").select("id").eq("enquiry_id", enquiry.id).maybeSingle();
  if (existing.error) return reply(500, { error: "Cannot verify existing event" });
  if (existing.data) return reply(409, { error: "An event already exists for this enquiry" });

  // This is the only step that sends an email, and it only runs after
  // explicit authenticated administrator invocation and accepted-quote verification.
  const invited = await admin.auth.admin.inviteUserByEmail(enquiry.contact_email, {
    redirectTo: "https://flamencoevents.github.io/Flamenco-Events-app/portal.html",
  });
  if (invited.error || !invited.data.user) {
    return reply(409, { error: "Client invitation failed; check whether account already exists" });
  }
  const clientId = invited.data.user.id;
  const createdProfile = await admin.from("profiles").upsert(
    { id: clientId, role: "client", display_name: enquiry.contact_name },
    { onConflict: "id", ignoreDuplicates: true },
  );
  if (createdProfile.error) {
    return reply(500, { error: "Invitation sent; profile creation requires reconciliation" });
  }
  const created = await admin.from("events").insert({
    enquiry_id: enquiry.id,
    client_id: clientId,
    title: enquiry.service ? enquiry.service : "Evento Flamenco Events",
    venue: enquiry.venue,
    event_date: enquiry.event_date,
    status: "accepted",
  }).select("id").single();
  if (created.error) {
    return reply(500, { error: "Invitation sent; event creation requires reconciliation" });
  }
  return reply(201, { event_id: created.data.id, state: "accepted_pending_contract" });
});
