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
