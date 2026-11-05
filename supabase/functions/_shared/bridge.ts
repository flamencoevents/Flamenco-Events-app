import { createClient } from "npm:@supabase/supabase-js@2.57.4";
export class Problem extends Error { status:number;constructor(status:number,message:string){super(message);this.status=status;} }
export const origin="https://flamencoevents.github.io";
export const cors={"Access-Control-Allow-Origin":origin,"Access-Control-Allow-Methods":"POST, OPTIONS","Access-Control-Allow-Headers":"authorization, apikey, content-type, x-client-info","Vary":"Origin"};
export function reply(status:number,data:unknown){return new Response(JSON.stringify(data),{status,headers:{...cors,"Content-Type":"application/json","Cache-Control":"no-store"}});}
export function route(handler:(r:Request)=>Promise<unknown>){return async(r:Request)=>{try{
 if(r.headers.has('origin')&&r.headers.get('origin')!==origin)throw new Problem(403,'Origen no autorizado');
 if(r.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
 if(r.method!=='POST')throw new Problem(405,'Método no permitido');
 return reply(200,await handler(r));
 }catch(e){return reply(e instanceof Problem?e.status:500,{error:e instanceof Problem?e.message:'No se pudo completar la operación'});}};}
export function settings(){const url=Deno.env.get('SUPABASE_URL'),key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),secret=Deno.env.get('FE_APP_BRIDGE_SECRET');
 if(!url||!key||!secret||secret.length<32)throw new Problem(503,'Integración pendiente de configuración');return{url,key,secret};}
export function database(){const {url,key}=settings();return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});}
export async function body(r:Request,max=8192){const raw=await r.text();if(raw.length>max)throw new Problem(413,'Petición demasiado larga');let b;try{b=JSON.parse(raw);}catch{throw new Problem(400,'JSON no válido');}
 if(!b||typeof b!=='object'||Array.isArray(b))throw new Problem(400,'Petición no válida');return b;}
export const uuid=(x:unknown):x is string=>typeof x==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(x);
export async function staff(r:Request,db:any,adminOnly=false){const token=r.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];if(!token)throw new Problem(401,'Acceso requerido');
 const auth=await db.auth.getUser(token);if(auth.error||!auth.data?.user)throw new Problem(401,'Sesión no válida');
 const profile=await db.from('profiles').select('role').eq('id',auth.data.user.id).single();
 if(profile.error||!(adminOnly?['admin']:['admin','sales']).includes(profile.data?.role))throw new Problem(403,'Permiso de equipo requerido');
 return{user:auth.data.user,role:profile.data.role};}
export async function runtime(db:any){const x=await db.from('app_runtime').select('test_mode').eq('singleton',true).single();if(x.error||!x.data)throw new Problem(503,'No se puede comprobar modo prueba');return x.data.test_mode;}
const enc=new TextEncoder();
export async function hash(text:string){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(text)))].map(x=>x.toString(16).padStart(2,'0')).join('');}
export async function mac(secret:string,text:string){const key=await crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 return [...new Uint8Array(await crypto.subtle.sign('HMAC',key,enc.encode(text)))].map(x=>x.toString(16).padStart(2,'0')).join('');}
export async function verify(secret:string,text:string,signature:unknown){if(typeof signature!=='string'||!/^[a-f0-9]{64}$/.test(signature))return false;
 const key=await crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['verify']);
 return crypto.subtle.verify('HMAC',key,Uint8Array.from(signature.match(/../g)!,x=>parseInt(x,16)),enc.encode(text));}
export function selection(b:any){if(!uuid(b.enquiry_id)||typeof b.quote_number!=='string'||!/^(?:\d{5,7}|X\d{2}-P\d{6})$/.test(b.quote_number)||!Number.isInteger(b.version)||b.version<1||b.version>99||b.source_key!==b.quote_number+'-v'+b.version||!['FE_Cola','FE_App_Pruebas'].includes(b.source_sheet||'FE_Cola'))throw new Problem(422,'Selecciona solicitud, número, revisión y clave exactos');
 return{enquiry_id:b.enquiry_id,quote_number:b.quote_number,version:b.version,source_key:b.source_key,source_sheet:b.source_sheet||'FE_Cola'};}
export async function accepted(db:any,id:string,testMode:boolean){const x=await db.from('enquiries').select('id,stage,is_test,call_completed_at,approved_at,quote_sent_at').eq('id',id).single();
 if(x.error||x.data.stage!=='accepted'||!x.data.call_completed_at||!x.data.approved_at||!x.data.quote_sent_at)throw new Problem(409,'Completa llamada, autorización, envío y aceptación antes de importar');
 if(testMode&&x.data.is_test!==true)throw new Problem(409,'MODO PRUEBA: selecciona una solicitud ficticia');return x.data;}
const scriptUrl='https://script.google.com/macros/s/AKfycbwuqhtUABn3lExsnnmnkn5f9n80xLvsL02rkvL_b373uPGr0EEyuiCViqcza9Xx9MtKgg/exec?fe_app_bridge=1';
export async function scriptRead(operation:string,choice:any){const {secret}=settings();const requestId=crypto.randomUUID(),timestamp=String(Math.floor(Date.now()/1000));
 const payload=JSON.stringify({operation,request_id:requestId,...choice});const envelope={kind:'fe_app_bridge',timestamp,payload,signature:await mac(secret,'request:'+timestamp+'.'+payload)};
 let target=scriptUrl,method='POST',data:BodyInit|undefined=JSON.stringify(envelope);let response:Response|undefined;let retryRemaining=1;
 for(let n=0;n<4;n++){
  // This endpoint only reads. Never replay database writes or semantic failures.
  for(;;){
   try{response=await fetch(target,{method,body:data,headers:method==='POST'?{'Content-Type':'application/json'}:{},redirect:'manual',signal:AbortSignal.timeout(25000)});}
   catch(e){if(retryRemaining-->0)continue;throw new Problem(502,'No se pudo leer Google tras el reintento limitado');}
   if([502,503,504].includes(response.status)&&retryRemaining-->0){await response.body?.cancel();continue;}
   break;
  }
  if([301,302,303,307,308].includes(response.status)){
   const next=new URL(response.headers.get('location')||'',target);
   if(next.protocol!=='https:'||!['script.google.com','script.googleusercontent.com'].includes(next.hostname))throw new Problem(502,'Redirección de Google no autorizada');
   target=next.href;method='GET';data=undefined;continue;
  }break;
 }
 if(!response?.ok)throw new Problem(502,'Google no confirmó la lectura');
 const raw=await response.text();if(raw.length>15000000)throw new Problem(413,'Documento demasiado grande');
 let answer;try{answer=JSON.parse(raw);}catch{throw new Problem(502,'Respuesta de Google no válida');}
 if(typeof answer.payload!=='string'||!/^\d{10}$/.test(answer.timestamp)||Math.abs(Date.now()/1000-Number(answer.timestamp))>300||!await verify(secret,'response:'+answer.timestamp+'.'+answer.payload,answer.signature))throw new Problem(502,'No se pudo verificar la respuesta de Google');
 let decoded;try{decoded=JSON.parse(answer.payload);}catch{throw new Problem(502,'Respuesta firmada no válida');}
 if(decoded.request_id!==requestId)throw new Problem(502,'Respuesta de otra operación');
 if(decoded.ok!==true)throw new Problem(422,'Google no pudo verificar esa versión o documento. Revisa la selección exacta.');return decoded.data;
}
export const modes=['no_vat_quote','individual_reservation','individual_full_invoice','business_full_invoice'];
export function taxes(t:any){if(t==null)return null;const names=['base_eur','invoiced_base_eur','vat_eur','withholding_eur','rounding_eur'];
 if(!t||Array.isArray(t)||typeof t!=='object'||Object.keys(t).sort().join(',')!==[...names,'payment_method'].sort().join(',')||!['habitual','efectivo100'].includes(t.payment_method))throw new Problem(422,'Detalle fiscal no válido');
 for(const k of names)if(typeof t[k]!=='number'||!Number.isFinite(t[k])||Math.abs(t[k])>9999999999.99||(k!=='rounding_eur'&&t[k]<0)||Math.abs(Math.round(t[k]*100)-t[k]*100)>1e-7)throw new Problem(422,'Importe fiscal no válido');return t;}
export function quotation(p:any,choice?:any){if(!p||!uuid(p.enquiry_id)||typeof p.quote_number!=='string'||!/^(?:\d{5,7}|X\d{2}-P\d{6})$/.test(p.quote_number)||!Number.isInteger(p.version)||p.version<1||p.version>99||!modes.includes(p.billing_mode))throw new Problem(422,'Presupuesto no válido');
 for(const k of ['total_payable_eur','deposit_payable_eur'])if(p[k]!=null&&(typeof p[k]!=='number'||!Number.isFinite(p[k])||p[k]<0||p[k]>9999999999.99||Math.abs(Math.round(p[k]*100)-p[k]*100)>1e-7))throw new Problem(422,'Importe no válido');
 if(p.total_payable_eur==null||p.deposit_payable_eur>p.total_payable_eur)throw new Problem(422,'Importes inconsistentes');
 const fiscal=taxes(p.tax_details);if(p.billing_mode==='individual_full_invoice'&&(!fiscal||fiscal.payment_method!=='efectivo100'||p.deposit_payable_eur!==0))throw new Problem(422,'Faltan condiciones de facturación completa del particular');
 if(p.quote_number.startsWith('X')&&p.is_test!==true)throw new Problem(422,'Referencia ficticia sin marca de prueba');
 const sheet=p.source_sheet||'FE_Cola';const ref='sheet:12djLXZ7he8Znhp8ngNn_VvBPiV9-gzWR1HGtGycV0RY:'+sheet+':'+p.quote_number+'-v'+p.version;
 if(p.source_reference!=null&&(!['FE_Cola','FE_App_Pruebas'].includes(sheet)||p.source_reference!==ref))throw new Problem(422,'Origen no válido');
 if(choice&&(p.enquiry_id!==choice.enquiry_id||p.quote_number!==choice.quote_number||p.version!==choice.version||sheet!==choice.source_sheet||p.source_reference!==ref))throw new Problem(409,'La respuesta no coincide con la selección');
 return{enquiry_id:p.enquiry_id,quote_number:p.quote_number,version:p.version,total_payable_eur:p.total_payable_eur,deposit_payable_eur:p.deposit_payable_eur??null,billing_mode:p.billing_mode,is_test:p.is_test===true,source_sheet:sheet,...(p.source_reference?{source_reference:p.source_reference}:{}),...(fiscal?{tax_details:fiscal}:{})};
}

