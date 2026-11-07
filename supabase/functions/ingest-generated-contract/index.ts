import {createClient} from 'npm:@supabase/supabase-js@2.57.4';
const enc=new TextEncoder();
export function validate(v:any){
 if(!v||Array.isArray(v)||v.is_test!==true||!/^X\d{2}-P\d{6}$/.test(v.quote_number)||!Number.isInteger(v.revision)||v.revision<1||v.revision>99||v.source_key!==v.quote_number+'-v'+v.revision)throw Error('Invalid test reference');
 if(typeof v.event_date!=='string'||!/^\d{4}-\d\d-\d\d$/.test(v.event_date)||isNaN(Date.parse(v.event_date+'T12:00:00Z'))||new Date(v.event_date+'T12:00:00Z').toISOString().slice(0,10)!==v.event_date)throw Error('Invalid event date');
 for(const [key,max] of [['client_label',150],['venue',180],['service',600]] as const)if(typeof v[key]!=='string'||!v[key].trim()||v[key].length>max||/[\x00-\x1f]/.test(v[key]))throw Error('Invalid text');
 if(!v.client_label.startsWith('PRUEBA · '))throw Error('Missing test label');
 for(const k of ['total_eur','deposit_eur','balance_eur'])if(typeof v[k]!=='number'||!Number.isFinite(v[k])||v[k]<0||v[k]>99999999.99||Math.abs(v[k]*100-Math.round(v[k]*100))>1e-6)throw Error('Invalid money');
 if(Math.round((v.deposit_eur+v.balance_eur)*100)!==Math.round(v.total_eur*100))throw Error('Unbalanced amounts');
 const books:Record<string,string>={'2026':'1dsgfqv6YG49-_QaAx-0dUyvLImBTdkkDEvgXBu1QZuY','2027':'1ZE66Ko8bnh3qp9Z2Mfp8VOG2pmH_a-EyUJZRvQVnHtE'};
 const accountsMatch=typeof v.accounts_url==='string'&&v.accounts_url.match(/^https:\/\/docs\.google\.com\/spreadsheets\/d\/([\w-]+)\/edit#gid=\d+&range=A\d+:N\d+$/);
 if(!accountsMatch||accountsMatch[1]!==books[v.event_date.slice(0,4)])throw Error('Account workbook does not match event year');
 if(typeof v.pdf_sha256!=='string'||!/^[a-f0-9]{64}$/.test(v.pdf_sha256)||typeof v.contract_url!=='string'||!/^https:\/\/drive\.google\.com\/file\/d\/[\w-]+\/view(?:\?[^#]*)?$/.test(v.contract_url)||typeof v.accounts_url!=='string'||!accountsMatch)throw Error('Invalid source evidence');
 return Object.fromEntries(['source_key','quote_number','revision','is_test','event_date','client_label','venue','service','total_eur','deposit_eur','balance_eur','contract_url','pdf_sha256','accounts_url'].map(k=>[k,v[k]]));
}
const reply=(status:number,data:any)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
Deno.serve(async(req:Request)=>{
 try{
  if(req.method!=='POST')return reply(405,{error:'POST required'});
  if(req.headers.has('origin'))return reply(403,{error:'Server requests only'});
  const secret=Deno.env.get('FE_APP_BRIDGE_SECRET')||'',url=Deno.env.get('SUPABASE_URL'),key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if(secret.length<32||!url||!key)return reply(503,{error:'Integration unavailable'});
  const ts=req.headers.get('x-fe-timestamp')||'',signature=req.headers.get('x-fe-signature')||'';
  if(!/^\d{10}$/.test(ts)||Math.abs(Date.now()/1000-Number(ts))>300||!/^[a-f0-9]{64}$/.test(signature))return reply(401,{error:'Signed request required'});
  const raw=await req.text();if(raw.length>8192)return reply(413,{error:'Payload too large'});
  const hmac=await crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['verify']);
  if(!await crypto.subtle.verify('HMAC',hmac,Uint8Array.from(signature.match(/../g)!,s=>parseInt(s,16)),enc.encode(ts+'.'+raw)))return reply(401,{error:'Invalid signature'});
  let p;try{p=validate(JSON.parse(raw));}catch{return reply(422,{error:'Invalid contract evidence'});}
  const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const mode=await db.from('app_runtime').select('test_mode').eq('singleton',true).single();
  if(mode.error||mode.data?.test_mode!==true)return reply(409,{error:'Test integration requires test mode'});
  const digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(JSON.stringify(p))))].map(x=>x.toString(16).padStart(2,'0')).join('');
  const entry={source_key:p.source_key,quote_number:p.quote_number,revision:p.revision,event_date:p.event_date,is_test:true,payload:p,source_hash:digest};
  const saved=await db.from('generated_contract_intake').insert(entry).select('id').single();
  if(!saved.error)return reply(201,{state:'recorded',intake_id:saved.data.id});
  if(saved.error.code!=='23505')return reply(500,{error:'Contract intake not confirmed'});
  const old=await db.from('generated_contract_intake').select('id,source_hash').eq('source_key',p.source_key).single();
  if(old.error||old.data.source_hash!==digest)return reply(409,{error:'Source changed; reconciliation required'});
  return reply(200,{state:'already_recorded',intake_id:old.data.id});
 }catch{return reply(500,{error:'Contract integration not confirmed'});}
});

