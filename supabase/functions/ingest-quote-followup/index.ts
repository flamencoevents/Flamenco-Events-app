import {createClient} from 'npm:@supabase/supabase-js@2.57.4';
const enc=new TextEncoder();
const reply=(status:number,body:unknown)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
function validate(p:any){
 if(!p||Array.isArray(p)||typeof p!=='object')throw Error('Invalid payload');
 if(typeof p.quote_number!=='string'||!/^(?:\d{5,7}|X\d{2}-P\d{6})$/.test(p.quote_number)||!Number.isInteger(p.revision)||p.revision<1||p.revision>99||p.source_key!==p.quote_number+'-v'+p.revision)throw Error('Invalid reference');
 if(!['ENVIADO','CERRADO'].includes(p.commercial_status))throw Error('Invalid state');
 if(typeof p.sent_at!=='string'||typeof p.expires_at!=='string'||!Number.isFinite(Date.parse(p.sent_at))||!Number.isFinite(Date.parse(p.expires_at))||Date.parse(p.expires_at)<Date.parse(p.sent_at))throw Error('Invalid dates');
 if(p.commercial_status==='CERRADO'&&(typeof p.contract_requested_at!=='string'||!Number.isFinite(Date.parse(p.contract_requested_at))))throw Error('Missing contract request timestamp');
 if(p.contract_requested_at!=null&&(typeof p.contract_requested_at!=='string'||!Number.isFinite(Date.parse(p.contract_requested_at))))throw Error('Invalid contract timestamp');
 if(typeof p.client_label!=='string'||p.client_label.length>150||typeof p.venue!=='string'||p.venue.length>200||/[\x00-\x1f]/.test(p.client_label+p.venue))throw Error('Invalid labels');
 if(p.event_date!==null&&(typeof p.event_date!=='string'||!/^\d{4}-\d\d-\d\d$/.test(p.event_date)||!Number.isFinite(Date.parse(p.event_date+'T12:00:00Z'))))throw Error('Invalid event date');
 if(typeof p.pdf_url!=='string'||!/^https:\/\/drive\.google\.com\/file\/d\/[\w-]+\/view(?:\?[^#]*)?$/.test(p.pdf_url))throw Error('Invalid PDF');
 const alerts=['PENDIENTE','ENVIANDO','ENVIADO_A_AZAHARA','REVISAR_FECHA','REVISAR_ENVIO','EVENTO_PASADO'];
 if(!alerts.includes(p.reminder_status)||typeof p.is_test!=='boolean')throw Error('Invalid reminder');
 return {source_key:p.source_key,quote_number:p.quote_number,revision:p.revision,brand:'FLAMENCO_EVENTS',commercial_status:p.commercial_status,sent_at:p.sent_at,expires_at:p.expires_at,contract_requested_at:p.contract_requested_at||null,client_label:p.client_label,venue:p.venue,event_date:p.event_date||null,pdf_url:p.pdf_url,reminder_status:p.reminder_status,is_test:p.is_test,reminded_at:p.reminded_at||null,synced_at:new Date().toISOString()};
}
Deno.serve(async (req:Request)=>{
 try{
  if(req.method!=='POST')return reply(405,{error:'POST required'});
  if(req.headers.has('origin'))return reply(403,{error:'Server requests only'});
  const secret=Deno.env.get('FE_APP_BRIDGE_SECRET')||'',url=Deno.env.get('SUPABASE_URL'),key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if(secret.length<32||!url||!key)return reply(503,{error:'Integration unavailable'});
  const ts=req.headers.get('x-fe-timestamp')||'',signature=req.headers.get('x-fe-signature')||'';
  if(!/^\d{10}$/.test(ts)||Math.abs(Date.now()/1000-Number(ts))>300||!/^[a-f0-9]{64}$/.test(signature))return reply(401,{error:'Signed request required'});
  const raw=await req.text();if(raw.length>8192)return reply(413,{error:'Payload too large'});
  const k=await crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['verify']);
  if(!await crypto.subtle.verify('HMAC',k,Uint8Array.from(signature.match(/../g)!,s=>parseInt(s,16)),enc.encode(ts+'.'+raw)))return reply(401,{error:'Invalid signature'});
  let p;try{p=validate(JSON.parse(raw));}catch{return reply(422,{error:'Invalid quote payload'});}
  const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const mode=await db.from('app_runtime').select('test_mode').eq('singleton',true).single();
  if(mode.error)return reply(503,{error:'Runtime unavailable'});
  if(mode.data.test_mode===true&&!p.is_test)return reply(409,{error:'MODO PRUEBA: solo cotizaciones ficticias'});
  const old=await db.from('fe_quote_followups').select('commercial_status,quote_number,revision,is_test,sent_at,expires_at,pdf_url').eq('source_key',p.source_key).maybeSingle();
  if(old.error)return reply(500,{error:'Read failed'});
  if(old.data){
    if(old.data.quote_number!==p.quote_number||old.data.revision!==p.revision||old.data.is_test!==p.is_test||old.data.pdf_url!==p.pdf_url||Date.parse(old.data.sent_at)!==Date.parse(p.sent_at)||Date.parse(old.data.expires_at)!==Date.parse(p.expires_at))return reply(409,{error:'Conflicting source evidence'});
    if(old.data.commercial_status==='CERRADO'&&p.commercial_status==='ENVIADO')return reply(200,{state:'already_closed'});
    const updated=await db.from('fe_quote_followups').update(p).eq('source_key',p.source_key);
    if(updated.error)return reply(500,{error:'Update not confirmed'});
    return reply(200,{state:'updated'});
  }
  const inserted=await db.from('fe_quote_followups').insert(p);
  if(inserted.error)return reply(inserted.error.code==='23505'?409:500,{error:'Insert not confirmed'});
  return reply(201,{state:'recorded'});
 }catch{return reply(500,{error:'Integration not confirmed'});}
});
