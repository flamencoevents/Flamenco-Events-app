const {test}=require('node:test'),assert=require('node:assert/strict');
const {env,payload}=require('./edge-harness.cjs');
const choice=e=>({enquiry_id:e.enquiryId,quote_number:'9999926',version:1,source_key:'9999926-v1',source_sheet:'FE_Cola'});
test('Preview requires a real session, staff role and completed commercial sequence',async()=>{
 for(const [opts,requestOpts,status] of [[{},{auth:false},401],[{actorRole:'client'},{},403],[{stage:'approved'},{},409]]){
  const e=env(opts);assert.equal((await e.request('quote-bridge',{operation:'preview',...choice(e)},requestOpts)).status,status);assert.equal(e.network.length,0);assert.equal(e.writes.length,0);
 }
});
test('Signed preview contains source values, ignores client supplied amounts and requires explicit approval',async()=>{
 const e=env(),r=await e.request('quote-bridge',{operation:'preview',...choice(e),total_payable_eur:1});assert.equal(r.status,200);const review=await r.json();assert.equal(review.payload.total_payable_eur,100);assert.equal(e.inserts.length,0);
 assert.equal((await e.request('quote-bridge',{operation:'approve',preview_id:review.id,authorize:false})).status,422);assert.equal(e.inserts.length,0);
 const approved=await e.request('quote-bridge',{operation:'approve',preview_id:review.id,authorize:true});assert.equal(approved.status,200);assert.equal((await approved.json()).state,'recorded');assert.equal(e.inserts.length,1);
 const repeated=await e.request('quote-bridge',{operation:'approve',preview_id:review.id,authorize:true});assert.equal((await repeated.json()).state,'already_recorded');assert.equal(e.inserts.length,1);
});
test('Tampered responses, wrong operation nonce and external redirects fail before a preview is stored',async()=>{
 for(const o of [{tamperResponse:true},{wrongNonce:true},{evilRedirect:true}]){const e=env(o);assert.equal((await e.request('quote-bridge',{operation:'preview',...choice(e)})).status,502);assert.equal(e.writes.length,0);}
});
test('Changed Sheet snapshot, expired preview and another actor cannot authorize transfer',async()=>{
 for(const mutation of ['changed','expired','owner']){
  const e=env(),r=await e.request('quote-bridge',{operation:'preview',...choice(e)}),review=await r.json();
  if(mutation==='changed')e.payload.total_payable_eur=101;
  if(mutation==='expired')e.tables.quote_bridge_previews[0].expires_at='2000-01-01';
  if(mutation==='owner')e.tables.quote_bridge_previews[0].requested_by='someone-else';
  const answer=await e.request('quote-bridge',{operation:'approve',preview_id:review.id,authorize:true});assert.equal(answer.status,mutation==='owner'?403:409);assert.equal(e.inserts.length,0);
 }
});
test('Cash invoice preserves fiscal values and rejects a fiscal conflict on replay',async()=>{
 const p={...payload(),total_payable_eur:1210,deposit_payable_eur:0,billing_mode:'individual_full_invoice',tax_details:{base_eur:1000,invoiced_base_eur:1000,vat_eur:210,withholding_eur:0,rounding_eur:0,payment_method:'efectivo100'}};
 const e=env();assert.equal((await e.run(p)).status,201);assert.equal(e.inserts[0].tax_details.vat_eur,210);assert.equal(e.inserts[0].deposit_payable_eur,0);
 assert.equal((await e.run({...p,tax_details:{...p.tax_details,vat_eur:211}})).status,409);
 assert.equal((await e.run({...p,tax_details:null})).status,422);
});
const publicData=()=>({submission_id:'00000000-0000-4000-8000-000000000901',name:'PRUEBA ficticia',email:'test@example.invalid',venue:'Recinto ficticio',service:'Son del Alma Dúo',notes:'Prueba',event_date:'2027-01-12',started_at:Date.now()-5000,is_test:true,consent:true,consent_version:'test-2026-11-v1'});
test('Public intake validates fictional contact data and consent, with no budget or account writes',async()=>{
 const e=env(),r=await e.request('public-enquiry',publicData(),{auth:false});assert.equal(r.status,200);assert.equal(e.calls[0].name,'submit_public_test_enquiry');assert.equal(e.network.length,0);assert.equal(e.writes.length,0);
 for(const patch of [{email:'real@example.com'},{consent:false},{is_test:false},{honeypot:'bot'},{started_at:Date.now()},{event_date:'2027-99-99'}])assert.equal((await e.request('public-enquiry',{...publicData(),...patch},{auth:false})).status,422);
});
test('Public quota errors and production mode are enforced by server',async()=>{
 const e=env({rpcError:{code:'P0001'}});assert.equal((await e.request('public-enquiry',publicData(),{auth:false})).status,429);
 const production=env({testMode:false});assert.equal((await production.request('public-enquiry',publicData(),{auth:false})).status,503);assert.equal(production.calls.length,0);
});
test('Document import is admin-only and uploads only exact-version PDF bytes privately',async()=>{
 for(const role of ['sales','client']){const e=env({actorRole:role,document:true});assert.equal((await e.request('import-event-document',{event_id:e.eventId,kind:'quotation'})).status,403);assert.equal(e.uploads.length,0);}
 const e=env({actorRole:'admin',document:true});const r=await e.request('import-event-document',{event_id:e.eventId,kind:'quotation'});assert.equal(r.status,200);assert.equal(e.uploads.length,1);assert.match(e.uploads[0].path,new RegExp('^'+e.eventId+'/quotation-v1-'));assert.equal(e.tables.event_documents.length,1);assert.equal(e.tables.events[0].status,undefined);
});

test('Changed PDF for the same event/type/version is rejected before another upload',async()=>{
 const e=env({actorRole:'admin',document:true});e.tables.event_documents.push({id:'existing-pdf',event_id:e.eventId,kind:'quotation',version:1,storage_path:e.eventId+'/previous.pdf'});
 const r=await e.request('import-event-document',{event_id:e.eventId,kind:'quotation'});assert.equal(r.status,409);assert.equal(e.uploads.length,0);
});

test('Team can verify a source PDF without receiving bytes, URLs or making storage/database writes',async()=>{
 const e=env({actorRole:'sales',document:true});const r=await e.request('import-event-document',{operation:'preview',event_id:e.eventId,kind:'quotation'});const p=await r.json();
 assert.equal(r.status,200);assert.equal(p.state,'verified');assert.equal(p.size_bytes,13);assert.match(p.sha256,/^[a-f0-9]{64}$/);assert.equal(p.stored,false);assert.equal(p.requires_admin,true);assert.equal(p.pdf_base64,undefined);assert.equal(p.url,undefined);assert.equal(e.uploads.length,0);assert.equal(e.writes.length,0);
});
test('Document preview keeps client/anonymous isolation and rejects a mismatched source before Google access',async()=>{
 const client=env({actorRole:'client',document:true});assert.equal((await client.request('import-event-document',{operation:'preview',event_id:client.eventId,kind:'quotation'})).status,403);
 const anon=env({actorRole:'sales',document:true});assert.equal((await anon.request('import-event-document',{operation:'preview',event_id:anon.eventId,kind:'quotation'},{auth:false})).status,401);
 const bad=env({actorRole:'sales',document:true});bad.tables.accepted_quote_terms[0].external_reference='sheet:other:FE_Cola:9999926-v1';assert.equal((await bad.request('import-event-document',{operation:'preview',event_id:bad.eventId,kind:'quotation'})).status,409);assert.equal(bad.network.length,0);
});

test('Technical document source cannot be used outside database test mode',async()=>{
 const e=env({actorRole:'admin',testMode:false,document:true});e.tables.accepted_quote_terms[0].external_reference='sheet:12djLXZ7he8Znhp8ngNn_VvBPiV9-gzWR1HGtGycV0RY:FE_App_Pruebas:9999926-v1';
 assert.equal((await e.request('import-event-document',{operation:'preview',event_id:e.eventId,kind:'quotation'})).status,409);assert.equal(e.network.length,0);
});


test('Read-only transport retries once; signed rejection and rate limits are never retried',async()=>{
 for(const opt of [{transientFailure:true},{transientStatus:503}]){
  const e=env(opt);const r=await e.request('quote-bridge',{operation:'preview',...choice(e)});assert.equal(r.status,200);assert.equal(e.network.length,2);assert.equal(e.inserts.length,0);assert.equal(e.writes.filter(x=>x.table==='quote_bridge_previews').length,1);
 }
 const outage=env({persistentFailure:true});assert.equal((await outage.request('quote-bridge',{operation:'preview',...choice(outage)})).status,502);assert.equal(outage.network.length,2);assert.equal(outage.writes.length,0);
 for(const opt of [{sourceRejected:true},{tamperResponse:true},{transientStatus:429}]){const e=env(opt);assert.notEqual((await e.request('quote-bridge',{operation:'preview',...choice(e)})).status,200);assert.equal(e.network.length,1);assert.equal(e.writes.length,0);}
});
function catalogPayload(){return {source_sheet:'FE_Cola',offset:0,next_offset:null,test_mode:true,items:[{source_sheet:'FE_Cola',source_key:'X26-P900003-v2',quote_number:'X26-P900003',version:2,is_test:true,client_label:'PRUEBA ficticia',event_date:'12/01/2027',venue:'Recinto ficticio',quote_state:'GENERADO',contract_state:'SIN_CONTRATO',total_payable_eur:605,quotation_pdf_ready:true,contract_pdf_ready:false}]};}
test('Source catalog is staff-only and read-only even before commercial acceptance',async()=>{
 for(const actorRole of ['admin','sales']){const e=env({actorRole,stage:'new',scriptPayload:catalogPayload()}),r=await e.request('quote-bridge',{operation:'source_catalog'});assert.equal(r.status,200);const p=await r.json();assert.equal(p.items[0].version,2);assert.equal(e.writes.length,0);assert.equal(e.calls.length,0);assert.equal(e.uploads.length,0);}
 const client=env({actorRole:'client'});assert.equal((await client.request('quote-bridge',{operation:'source_catalog'})).status,403);assert.equal(client.network.length,0);
 const anon=env();assert.equal((await anon.request('quote-bridge',{operation:'source_catalog'},{auth:false})).status,401);assert.equal(anon.network.length,0);
});
test('Catalog rejects wrong pages, source, duplicate keys, real test rows and unverified responses',async()=>{
 const variants=[p=>p.offset=20,p=>p.next_offset=1,p=>p.source_sheet='OTHER',p=>p.items.push({...p.items[0]}),p=>p.items[0].is_test=false,p=>p.items[0].source_key='OTHER'];
 for(const mutate of variants){const p=catalogPayload();mutate(p);const e=env({scriptPayload:p});assert.notEqual((await e.request('quote-bridge',{operation:'source_catalog'})).status,200);assert.equal(e.writes.length,0);}
 const tamper=env({scriptPayload:catalogPayload(),tamperResponse:true});assert.equal((await tamper.request('quote-bridge',{operation:'source_catalog'})).status,502);
 const e=env();for(const patch of [{offset:-1},{offset:1.5},{source_sheet:'OTHER'}])assert.equal((await e.request('quote-bridge',{operation:'source_catalog',...patch})).status,422);assert.equal(e.network.length,0);
 const prod=env({testMode:false});assert.equal((await prod.request('quote-bridge',{operation:'source_catalog',source_sheet:'FE_App_Pruebas'})).status,409);assert.equal(prod.network.length,0);
});
test('Catalog strips source extras instead of forwarding arbitrary raw data',async()=>{
 const p=catalogPayload();p.items[0].pdf_base64='PRIVATE';p.items[0].document_url='https://example.invalid/private';const e=env({scriptPayload:p}),r=await e.request('quote-bridge',{operation:'source_catalog'});assert.equal(r.status,200);const text=await r.text();assert.ok(!text.includes('PRIVATE'));assert.ok(!text.includes('document_url'));assert.equal(e.writes.length,0);
});
function detailPayload(){return {schema_version:1,source_sheet:'FE_Cola',source_key:'X26-P900003-v1',quote_number:'X26-P900003',version:1,is_test:true,is_forecast:true,client_type:'particular',billing_mode:'individual_full_invoice',source_sha256:'a'.repeat(64),client_label:'PRUEBA ficticia',event_date:'12/01/2027',venue:'Fictitious',services:[{title:'Dúo',description:'Texto exacto aprobado'}],total_payable_eur:605,deposit_payable_eur:0,pending_payable_eur:605,tax_details:{base_eur:500,invoiced_base_eur:500,vat_eur:105,withholding_eur:0,rounding_eur:0,payment_method:'efectivo100'},forecast:{amounts:{ajuste:-25,real:500},expense_breakdown:{hotel:0},parameters:{IVA:.21},lines:[{code:'2.1',label:'Dúo',cantidad:1,coste:200}]}};}
const detailChoice=()=>({operation:'source_detail',source_sheet:'FE_Cola',source_key:'X26-P900003-v1',quote_number:'X26-P900003',version:1});
test('Source detail enforces staff role, strips costs for sales despite user escalation and makes no writes',async()=>{
 for(const role of ['admin','sales']){const p=detailPayload();p.raw_snapshot='PRIVATE';p.forecast.secret='PRIVATE';p.forecast.lines[0].tarifa='PRIVATE';const e=env({actorRole:role,stage:'new',scriptPayload:p}),r=await e.request('quote-bridge',{...detailChoice(),include_costs:true});assert.equal(r.status,200);const d=await r.json();assert.equal(d.total_payable_eur,605);assert.equal(d.tax_details.vat_eur,105);assert.equal(d.is_forecast,true);assert.ok(!JSON.stringify(d).includes('PRIVATE'));assert.equal(!!d.forecast,role==='admin');if(role==='admin'){assert.equal(d.forecast.amounts.ajuste,-25);assert.equal(d.forecast.expense_breakdown.hotel,0);assert.equal(d.forecast.expense_breakdown.dietas,undefined);}const outbound=JSON.parse(JSON.parse(e.network[0].init.body).payload);assert.equal(outbound.include_costs,role==='admin');assert.equal(e.writes.length,0);}
 const client=env({actorRole:'client'});assert.equal((await client.request('quote-bridge',detailChoice())).status,403);assert.equal(client.network.length,0);const anon=env();assert.equal((await anon.request('quote-bridge',detailChoice(),{auth:false})).status,401);assert.equal(anon.network.length,0);
});
test('Source detail rejects mismatched identity, hash, non-test data, missing services and false actual-money flag',async()=>{
 for(const mutate of [p=>p.version=2,p=>p.source_sha256='invalid',p=>p.is_forecast=false,p=>p.is_test=false,p=>p.services=[],p=>p.forecast.lines[0].coste='200',p=>p.tax_details=null]){const p=detailPayload();mutate(p);const e=env({actorRole:'admin',scriptPayload:p});assert.notEqual((await e.request('quote-bridge',detailChoice())).status,200);assert.equal(e.writes.length,0);}
 const e=env();assert.equal((await e.request('quote-bridge',{...detailChoice(),source_key:'OTHER'})).status,422);assert.equal(e.network.length,0);
});
