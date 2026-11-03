import {route,body,database,staff,runtime,selection,accepted,scriptRead,quotation,hash,settings,mac,Problem,uuid} from '../_shared/bridge.ts';
Deno.serve(route(async request=>{
 const db=database(),actor=await staff(request,db),b=await body(request),testMode=await runtime(db);
 if(b.operation==='preview'){
  const choice=selection(b);await accepted(db,choice.enquiry_id,testMode);
  if(!testMode&&choice.source_sheet==='FE_App_Pruebas')throw new Problem(409,'Origen reservado a pruebas');
  const p=quotation(await scriptRead('preview',choice),choice);
  if(testMode&&!p.is_test)throw new Problem(409,'La copia no está marcada como ficticia');
  const saved=await db.from('quote_bridge_previews').insert({enquiry_id:choice.enquiry_id,requested_by:actor.user.id,payload:p,payload_hash:await hash(JSON.stringify(p))}).select('id,payload,expires_at,state').single();
  if(saved.error)throw new Problem(500,'No se pudo guardar la revisión');return saved.data;
 }
 if(b.operation!=='approve'||!uuid(b.preview_id)||b.authorize!==true)throw new Problem(422,'Se requiere autorización expresa de una revisión');
 const lookup=await db.from('quote_bridge_previews').select('*').eq('id',b.preview_id).single();const preview=lookup.data;
 if(lookup.error||!preview||preview.requested_by!==actor.user.id)throw new Problem(403,'La revisión pertenece a otra sesión de equipo');
 await accepted(db,preview.enquiry_id,testMode);
 if(preview.state==='imported')return{state:'already_recorded',terms_id:preview.terms_id};
 if(preview.state!=='preview'||Date.parse(preview.expires_at)<Date.now())throw new Problem(409,'La revisión ha caducado o ya se está procesando');
 const p=quotation(preview.payload),choice=selection({...p,source_key:p.quote_number+'-v'+p.version});
 const current=quotation(await scriptRead('preview',choice),choice);
 if(await hash(JSON.stringify(current))!==preview.payload_hash)throw new Problem(409,'La copia de Sheets ha cambiado. Obtén una nueva revisión antes de autorizar');
 const claim=await db.from('quote_bridge_previews').update({state:'processing',approved_by:actor.user.id,approved_at:new Date().toISOString()}).eq('id',preview.id).eq('state','preview').select('id').single();
 if(claim.error)throw new Problem(409,'Otra operación está procesando esa revisión');
 try{
  const {url,secret}=settings(),raw=JSON.stringify(current),timestamp=String(Math.floor(Date.now()/1000));
  const sent=await fetch(url+'/functions/v1/ingest-accepted-quote',{method:'POST',headers:{'Content-Type':'application/json','x-fe-timestamp':timestamp,'x-fe-signature':await mac(secret,timestamp+'.'+raw)},body:raw,signal:AbortSignal.timeout(25000)});
  if(!sent.ok)throw new Problem(409,'Supabase no confirmó la importación. Revisa el estado antes de repetir');
  const result=await sent.json();if(!['recorded','already_recorded'].includes(result.state))throw new Problem(502,'Respuesta de importación no válida');
  const terms=await db.from('accepted_quote_terms').select('id').eq('enquiry_id',current.enquiry_id).eq('quote_number',current.quote_number).eq('version',current.version).single();
  if(terms.error)throw new Problem(500,'Falta comprobar el registro importado');
  const done=await db.from('quote_bridge_previews').update({state:'imported',terms_id:terms.data.id}).eq('id',preview.id);
  if(done.error)throw new Problem(500,'Importación registrada, seguimiento pendiente');
  return{state:result.state,terms_id:terms.data.id};
 }catch(e){await db.from('quote_bridge_previews').update({state:'failed',error_code:'IMPORT_NOT_CONFIRMED'}).eq('id',preview.id);throw e;}
}));
