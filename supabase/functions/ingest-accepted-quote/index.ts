import {Problem,reply,settings,verify,database,runtime,accepted,quotation} from '../_shared/bridge.ts';
Deno.serve(async(request:Request)=>{try{
 if(request.method!=='POST')throw new Problem(405,'Method not allowed');
 if(request.headers.has('origin'))throw new Problem(403,'Browser submissions are not accepted');
 const {secret}=settings(),timestamp=request.headers.get('x-fe-timestamp')||'',signature=request.headers.get('x-fe-signature')||'';
 if(!/^\d{10}$/.test(timestamp)||Math.abs(Date.now()/1000-Number(timestamp))>300)throw new Problem(401,'Signed request required');
 const raw=await request.text();if(raw.length>8192)throw new Problem(413,'Payload too large');
 if(!await verify(secret,timestamp+'.'+raw,signature))throw new Problem(401,'Invalid signature');
 let data;try{data=JSON.parse(raw);}catch{throw new Problem(400,'Invalid JSON');}
 if(!data||typeof data!=='object'||Array.isArray(data))throw new Problem(400,'Invalid JSON object');
 let p;try{p=quotation(data);}catch{throw new Problem(422,'Invalid accepted quotation data');}
 const db=database(),testMode=await runtime(db);await accepted(db,p.enquiry_id,testMode);
 if(testMode&&!p.is_test||!testMode&&p.source_sheet==='FE_App_Pruebas')throw new Problem(409,'MODO PRUEBA: incompatible quotation source');
 const existing=await db.from('accepted_quote_terms').select('id,enquiry_id,total_payable_eur,deposit_payable_eur,billing_mode,external_reference,tax_details').eq('quote_number',p.quote_number).eq('version',p.version).maybeSingle();
 if(existing.error)throw new Problem(500,'Unable to verify existing record');
 if(existing.data){const x=existing.data;
  const taxEqual=!p.tax_details||(x.tax_details&&Object.keys(p.tax_details).every(k=>p.tax_details[k]===x.tax_details[k])&&Object.keys(x.tax_details).length===Object.keys(p.tax_details).length);
  if(x.enquiry_id===p.enquiry_id&&Number(x.total_payable_eur)===p.total_payable_eur&&(x.deposit_payable_eur==null?null:Number(x.deposit_payable_eur))===p.deposit_payable_eur&&x.billing_mode===p.billing_mode&&(!p.source_reference||x.external_reference===p.source_reference)&&taxEqual)return reply(200,{state:'already_recorded'});
  throw new Problem(409,'Conflicting quotation number or version');
 }
 const saved=await db.from('accepted_quote_terms').insert({enquiry_id:p.enquiry_id,quote_number:p.quote_number,version:p.version,total_payable_eur:p.total_payable_eur,deposit_payable_eur:p.deposit_payable_eur,billing_mode:p.billing_mode,tax_details:p.tax_details??null,source_system:'appscript',external_reference:p.source_reference??('appscript:'+p.quote_number)});
 if(saved.error)throw new Problem(saved.error.code==='23505'?409:500,'Import rejected');
 return reply(201,{state:'recorded',quote_number:p.quote_number});
 }catch(e){return reply(e instanceof Problem?e.status:500,{error:e instanceof Problem?e.message:'Import not confirmed'});}});

