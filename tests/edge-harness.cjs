const vm=require('node:vm'),fs=require('node:fs'),crypto=require('node:crypto');
const {stripTypeScriptTypes}=require('node:module');
const secret='test-only-secret-for-receiver-not-deployed';
const userId='00000000-0000-4000-8000-000000000101',enquiryId='00000000-0000-4000-8000-000000000201',eventId='00000000-0000-4000-8000-000000000301';
const payload=()=>({enquiry_id:enquiryId,quote_number:'9999926',version:1,total_payable_eur:100,deposit_payable_eur:30,billing_mode:'individual_reservation',is_test:true});
function env(options={}){
 let handler,scriptAttempts=0;const handlers={},writes=[],network=[],uploads=[],downloads=[],calls=[];
 const p=options.scriptPayload||{...payload(),source_sheet:'FE_Cola',source_reference:'sheet:12djLXZ7he8Znhp8ngNn_VvBPiV9-gzWR1HGtGycV0RY:FE_Cola:9999926-v1'};
 const tables={enquiries:[{id:enquiryId,source:options.sourceTag||'admin_test',is_test:!options.sourceTag||options.sourceTag==='admin_test',stage:options.stage||'accepted',call_completed_at:'test',approved_at:'test',quote_sent_at:'test'}],profiles:[{id:userId,role:options.actorRole||'sales'}],app_runtime:options.runtimeError?[]:[{singleton:true,test_mode:options.testMode??true}],accepted_quote_terms:options.existing?[{id:'terms-existing',quote_number:'9999926',version:1,...options.existing}]:[],quote_bridge_previews:options.previews||[],events:[{id:eventId,enquiry_id:enquiryId,quote_terms_id:'terms-document',is_test:true}],event_documents:[]};
 if(options.document)tables.accepted_quote_terms.push({id:'terms-document',quote_number:p.quote_number,version:p.version,external_reference:p.source_reference});
 const db={auth:{getUser:async()=>options.invalidToken?{error:{message:'invalid'}}:{data:{user:{id:userId,email:'test@example.invalid'}}}},storage:{from:bucket=>({upload:async(path,bytes)=>{uploads.push({path,bytes});return{error:null}},download:async path=>{downloads.push({bucket,path});if(options.storageError)return{data:null,error:{message:'PRIVATE_STORAGE_ERROR'}};if(options.storageThrow)throw Error('PRIVATE_STORAGE_ERROR');return{data:options.storageBlob||new Blob([options.storagePdf??'%PDF-1.4\nTEST']),error:null};}})},rpc:async(name,args)=>{calls.push({name,args});return options.rpcError?{error:options.rpcError}:{data:enquiryId};},from:table=>{
  const predicates=[];let operation='select',value,done=null;
  const execute=()=>{if(done)return done;let rows=(tables[table]||[]).filter(r=>predicates.every(([k,v])=>r[k]===v));let error=null;
   if(table==='app_runtime'&&options.runtimeError)error=options.runtimeError;
   if(operation==='insert'){const row={id:crypto.randomUUID(),state:table==='quote_bridge_previews'?'preview':undefined,expires_at:new Date(Date.now()+600000).toISOString(),...value};(tables[table]??=[]).push(row);writes.push({table,row});rows=[row];}
   if(operation==='update'){rows.forEach(r=>Object.assign(r,value));writes.push({table,value});}
   done={data:rows,error};return done;
  };
  const q={select:()=>q,eq:(k,v)=>{predicates.push([k,v]);return q;},insert:v=>{operation='insert';value=v;return q;},update:v=>{operation='update';value=v;return q;},single:async()=>{const r=execute();return{data:r.data[0]||null,error:r.error||(!r.data.length?{code:'PGRST116'}:null)};},maybeSingle:async()=>{const r=execute();return{data:r.data[0]||null,error:r.error};},then:(yes,no)=>Promise.resolve(execute()).then(yes,no)};return q;
 }};
 const ctx=vm.createContext({createClient:()=>db,Deno:{env:{get:k=>({FE_APP_BRIDGE_SECRET:secret,SUPABASE_URL:'https://example.invalid',SUPABASE_SERVICE_ROLE_KEY:'mock-only-key'})[k]},serve:f=>handler=f},Response,Request,Headers,TextEncoder,TextDecoder,Uint8Array,AbortSignal,URL,atob,btoa,crypto:crypto.webcrypto,Date,fetch:async(url,init)=>{
  network.push({url,init});if(url.includes('/ingest-accepted-quote'))return handlers['ingest-accepted-quote'](new Request(url,init));
  scriptAttempts++;if(options.transientFailure&&scriptAttempts===1)throw Error('Simulated connection interruption');if(options.persistentFailure)throw Error('Simulated network outage');if(options.transientStatus&&scriptAttempts===1)return new Response(null,{status:options.transientStatus});
  if(options.evilRedirect)return new Response(null,{status:302,headers:{location:'https://evil.invalid/stolen'}});
  const wire=JSON.parse(init.body),request=JSON.parse(wire.payload);
  const expected=crypto.createHmac('sha256',secret).update('request:'+wire.timestamp+'.'+wire.payload).digest('hex');if(expected!==wire.signature)throw Error('Bad outbound signature');
  const data=options.scriptResponses?options.scriptResponses(request):options.document?{source_reference:p.source_reference,pdf_base64:Buffer.from('%PDF-1.4\nTEST').toString('base64')}:p;
  const text=JSON.stringify({request_id:options.wrongNonce?'wrong':request.request_id,ok:!options.sourceRejected,data});
  const stamp=String(Math.floor(Date.now()/1000));return new Response(JSON.stringify({timestamp:stamp,payload:text,signature:options.tamperResponse?'0'.repeat(64):crypto.createHmac('sha256',secret).update('response:'+stamp+'.'+text).digest('hex')}));
 }});
 const compile=file=>stripTypeScriptTypes(fs.readFileSync(file,'utf8').replace(/^import .*;\r?\n/gm,'').replace(/^export /gm,''));
 vm.runInContext(compile('supabase/functions/_shared/bridge.ts'),ctx);
 vm.runInContext(compile('supabase/functions/_shared/source-catalog.ts'),ctx);
 for(const name of ['ingest-accepted-quote','quote-bridge','public-enquiry','import-event-document']){vm.runInContext(compile('supabase/functions/'+name+'/index.ts'),ctx);handlers[name]=handler;}
 const request=async(name,data,opts={})=>{
  const raw=JSON.stringify(data),headers={'Content-Type':'application/json',...(opts.auth===false?{}:{authorization:'Bearer mock-token'}),...opts.headers};
  if(name==='ingest-accepted-quote'){const timestamp=String(opts.timestamp??Math.floor(Date.now()/1000));headers['x-fe-timestamp']=timestamp;headers['x-fe-signature']=opts.tamper?'0'.repeat(64):crypto.createHmac('sha256',secret).update(timestamp+'.'+raw).digest('hex');}
  return handlers[name](new Request('https://example.invalid/functions/v1/'+name,{method:'POST',headers,body:raw}));
 };
 return{ctx,tables,writes,network,uploads,downloads,calls,get inserts(){return writes.filter(w=>w.table==='accepted_quote_terms').map(w=>w.row);},run:(data,o)=>request('ingest-accepted-quote',data,o),request,payload:p,userId,eventId,enquiryId};
}
module.exports={env,payload,secret};

