import { createClient } from "npm:@supabase/supabase-js@2";

function respond(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const budget = /^(?:[0-9]{5,7})$/;
const modes = new Set(["no_vat_quote", "individual_reservation", "business_full_invoice"]);
function money(v: unknown): number | null {
  if (typeof v !== "number" || !Number.isFinite(v) || v < 0 ||
      v > 9999999999.99 || Math.round(v*100) !== v*100 && Math.abs(Math.round(v*100)-v*100)>1e-7) return null;
  return Math.round(v*100)/100;
}
Deno.serve(async (request: Request) => {
  if (request.method !== "POST") return respond(405, { error: "Method not allowed" });
  if (request.headers.has("origin")) return respond(403, { error: "Browser submissions are not accepted" });
  const secret = Deno.env.get("FE_APP_BRIDGE_SECRET");
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!secret || secret.length < 32 || !url || !serviceKey) {
    return respond(503, { error: "Bridge not configured" });
  }

  const timestamp = request.headers.get("x-fe-timestamp") || "";
  const sig = request.headers.get("x-fe-signature") || "";
  if (!/^\d{10}$/.test(timestamp) || !/^[0-9a-f]{64}$/.test(sig)) {
    return respond(401, { error: "Signed request required" });
  }
  const seconds = Number(timestamp);
  if (Math.abs(Date.now()/1000 - seconds)>300) return respond(401, { error: "Expired signature" });

  const raw = await request.text();
  if (raw.length > 8192) return respond(413, { error: "Payload too large" });
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
  const hexBytes = new Uint8Array(sig.match(/.{2}/g)!.map(x=>Number.parseInt(x,16)));
  const verified = await crypto.subtle.verify("HMAC", key, hexBytes,
    new TextEncoder().encode(timestamp + "." + raw));
  if (!verified) return respond(401, { error: "Invalid signature" });

  let data: Record<string, unknown>;
  try { data = JSON.parse(raw); } catch { return respond(400, { error: "Invalid JSON" }); }
  const enquiryId = data.enquiry_id, quoteNumber = data.quote_number;
  const amount = money(data.total_payable_eur);
  const deposit = data.deposit_payable_eur == null ? null : money(data.deposit_payable_eur);
  const version = data.version;
  const billingMode = data.billing_mode;
  if (typeof enquiryId!=="string" || !uuid.test(enquiryId) ||
      typeof quoteNumber!=="string" || !budget.test(quoteNumber) ||
      !Number.isInteger(version) || Number(version)<1 || Number(version)>99 ||
      amount===null || (data.deposit_payable_eur!=null && deposit===null) ||
      (deposit!==null && deposit>amount) ||
      typeof billingMode!=="string" || !modes.has(billingMode)) {
    return respond(422, { error: "Invalid accepted quotation data" });
  }

  const db = createClient(url, serviceKey, { auth: { persistSession:false, autoRefreshToken:false } });
  const enquiry = await db.from("enquiries")
    .select("id,stage,call_completed_at,approved_at,quote_sent_at").eq("id",enquiryId).maybeSingle();
  if (enquiry.error) return respond(500, { error: "Cannot verify commercial workflow" });
  if (!enquiry.data || enquiry.data.stage!=="accepted" || !enquiry.data.call_completed_at ||
      !enquiry.data.approved_at || !enquiry.data.quote_sent_at) {
    return respond(409, { error: "Quotation not accepted through approved workflow" });
  }

  const existing = await db.from("accepted_quote_terms").select(
    "enquiry_id,total_payable_eur,deposit_payable_eur,billing_mode"
  ).eq("quote_number",quoteNumber).eq("version",Number(version)).maybeSingle();
  if (existing.error) return respond(500, { error: "Unable to verify existing record" });
  if (existing.data) {
    const x = existing.data;
    if (x.enquiry_id===enquiryId && Number(x.total_payable_eur)===amount &&
        (x.deposit_payable_eur==null?null:Number(x.deposit_payable_eur))===deposit &&
        x.billing_mode===billingMode) return respond(200, { state:"already_recorded" });
    return respond(409, { error: "Conflicting quotation number or version" });
  }

  const saved = await db.from("accepted_quote_terms").insert({
    enquiry_id: enquiryId,
    quote_number: quoteNumber,
    version: Number(version),
    total_payable_eur: amount,
    deposit_payable_eur: deposit,
    billing_mode: billingMode,
    source_system:"appscript",
    external_reference:"appscript:" + quoteNumber,
  });
  if (saved.error) {
    if (saved.error.code==="23505") return respond(409,{error:"Quotation already imported; check records"});
    return respond(500,{error:"Import rejected",code:saved.error.code});
  }
  return respond(201,{state:"recorded",quote_number:quoteNumber});
});

