import { createClient } from "npm:@supabase/supabase-js@2";
const originAllowed = "https://flamencoevents.github.io";
const cors = {
  "Access-Control-Allow-Origin": originAllowed,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Vary": "Origin",
};
function reply(status: number, value: Record<string, unknown>) {
  return new Response(JSON.stringify(value), {
    status, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
Deno.serve(async (req: Request) => {
  const origin=req.headers.get("origin");
  if(origin && origin!==originAllowed) return reply(403,{error:"Origin forbidden"});
  if(req.method==="OPTIONS") return new Response(null,{status:204,headers:cors});
  if(req.method!=="POST") return reply(405,{error:"Method not allowed"});
  const token=req.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if(!token) return reply(401,{error:"Login required"});
  const url=Deno.env.get("SUPABASE_URL");
  const key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if(!url||!key) return reply(503,{error:"Server unavailable"});
  const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const auth=await db.auth.getUser(token);
  if(auth.error||!auth.data.user) return reply(401,{error:"Invalid session"});
  const actor=await db.from("profiles").select("role").eq("id",auth.data.user.id).maybeSingle();
  if(actor.error||actor.data?.role!=="admin") return reply(403,{error:"Admin only"});
  let body:{email?:unknown};
  try{body=await req.json()}catch{return reply(400,{error:"Invalid request"})}
  if(typeof body.email!=="string"||body.email.length>254||!/^\S+@\S+\.\S+$/.test(body.email.trim()))
    return reply(422,{error:"Enter a valid staff email"});
  const email=body.email.trim().toLowerCase();
  // Invitation creates a nonprivileged client account only.
  const invited=await db.auth.admin.inviteUserByEmail(email,{
    redirectTo:"https://flamencoevents.github.io/Flamenco-Events-app/portal.html",
  });
  if(invited.error||!invited.data.user)
    return reply(409,{error:"Invitation failed or email already registered"});
  const record=await db.from("profiles").upsert({
    id:invited.data.user.id,role:"client"
  },{onConflict:"id",ignoreDuplicates:true});
  if(record.error) return reply(500,{error:"Invitation may have been sent; profile needs reconciliation"});
  return reply(201,{status:"invited_as_client",note:"Grant sales access only after verified login and explicit admin approval"});
});

