const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {env,payload}=require('./edge-harness.cjs');
const pdf=Buffer.from('%PDF-1.4\nTEST'),sha=crypto.createHash('sha256').update(pdf).digest('hex');
function fixture(options={}){
 const source={...payload(),source_sheet:'FE_Cola',source_reference:'sheet:12djLXZ7he8Znhp8ngNn_VvBPiV9-gzWR1HGtGycV0RY:FE_Cola:9999926-v1',
  tax_details:{base_eur:100,invoiced_base_eur:30,vat_eur:0,withholding_eur:0,rounding_eur:0,payment_method:'habitual'}};
 const e=env({actorRole:'admin',document:true,scriptPayload:source,...options,
  scriptResponses:r=>r.operation==='preview'?source:{source_reference:source.source_reference,pdf_base64:pdf.toString('base64'),private_url:'PRIVATE_DRIVE_URL'}});
 Object.assign(e.tables.accepted_quote_terms[0],source,{enquiry_id:e.enquiryId});
 e.tables.event_contracts=[{id:'test-contract',event_id:e.eventId,quotation_number:'9999926',document_id:'test-document',state:'draft'}];
 e.tables.event_documents.push({id:'test-document',event_id:e.eventId,kind:'contract',version:1,source_reference:source.source_reference,sha256:sha,storage_path:e.eventId+'/contract-v1-'+crypto.createHash('sha256').update(pdf.toString('base64')).digest('hex')+'.pdf'});
 return Object.assign(e,{source});
}
const ask=(e,patch={},opts)=>e.request('import-event-document',{operation:'accounts_preview',event_id:e.eventId,kind:'contract',...patch},opts);
const unchanged=e=>{assert.equal(e.writes.length,0);assert.equal(e.uploads.length,0);assert.equal(e.calls.length,0);};

test('Administrative accounts preflight links signed source, exact revision, metadata and accepted amounts without writes',async()=>{
 const e=fixture(),r=await ask(e,{total_payable_eur:1,production_writable:true}),p=await r.json();
 assert.equal(r.status,200);assert.equal(p.state,'accounts_source_checked');assert.equal(p.pdf_sha256,sha);
 assert.equal(p.version,1);assert.equal(p.is_forecast,true);assert.equal(p.production_writable,false);assert.equal(p.remote_committed,false);
 assert.equal(p.checks.accepted_financial_values,true);assert.equal(p.checks.stored_pdf_bytes,true);for(const k of ['event_schedule','workbook','signature','commercial_closure','payments'])assert.equal(p.checks[k],false);
 const text=JSON.stringify(p);for(const secret of ['PRIVATE_DRIVE_URL',e.tables.event_documents[0].storage_path,'pdf_base64','source_reference','total_payable_eur'])assert.ok(!text.includes(secret));
 assert.deepEqual(e.downloads,[{bucket:'event-documents',path:e.tables.event_documents[0].storage_path}]);assert.ok(!p.pending.includes('stored_pdf_bytes'));
 assert.deepEqual(e.network.map(x=>JSON.parse(JSON.parse(x.init.body).payload).operation),['contract_document','preview']);unchanged(e);
 assert.equal(e.tables.event_contracts[0].state,'draft');
});
test('Only valid administrator sessions may request accounts preflight, regardless of body role claims',async()=>{
 for(const [options,opts,status] of [[{actorRole:'sales'},undefined,403],[{actorRole:'client'},undefined,403],[{invalidToken:true},undefined,401],[{}, {auth:false},401]]){
  const e=fixture(options);assert.equal((await ask(e,{role:'admin',authorize:true},opts)).status,status);assert.equal(e.network.length,0);assert.equal(e.downloads.length,0);unchanged(e);
 }
});
test('Database mode, event and commercial sequence are mandatory before remote PDF reads',async()=>{
 for(const change of [e=>e.tables.app_runtime[0].test_mode=false,e=>e.tables.events[0].is_test=false,e=>e.tables.enquiries[0].is_test=false,
  e=>e.tables.enquiries[0].call_completed_at=null,e=>e.tables.enquiries[0].approved_at=null,e=>e.tables.enquiries[0].quote_sent_at=null,e=>e.tables.enquiries[0].stage='approved']){
  const e=fixture();change(e);assert.equal((await ask(e)).status,409);assert.equal(e.network.length,0);unchanged(e);
 }
});
test('Wrong source, enquiry, document event or revision and missing contract evidence fail closed before Google',async()=>{
 for(const change of [e=>e.tables.accepted_quote_terms[0].enquiry_id='other',e=>e.tables.accepted_quote_terms[0].external_reference+=':extra',
  e=>e.tables.event_contracts[0].quotation_number='9999826',e=>e.tables.event_contracts[0].document_id=null,
  e=>e.tables.event_documents[0].event_id='other',e=>e.tables.event_documents[0].version=2,e=>e.tables.event_documents[0].kind='quotation',
  e=>e.tables.event_documents[0].source_reference='other',e=>e.tables.event_documents[0].sha256=null]){
  const e=fixture();change(e);assert.equal((await ask(e)).status,409);assert.equal(e.network.length,0);unchanged(e);
 }
});
test('Changed PDF bytes or financial source are rejected without creating another document or economic movement',async()=>{
 for(const change of [e=>e.tables.event_documents[0].sha256='0'.repeat(64),e=>e.source.total_payable_eur=101,
  e=>e.source.deposit_payable_eur=31,e=>e.source.billing_mode='business_full_invoice',e=>e.source.tax_details={...e.source.tax_details,vat_eur:1},
  e=>e.source.is_test=false]){
  const e=fixture();change(e);assert.equal((await ask(e)).status,409);unchanged(e);assert.equal(e.tables.event_documents.length,1);
 }
});
test('Signed source must still pass HMAC, nonce and source identity verification',async()=>{
 for(const options of [{tamperResponse:true},{wrongNonce:true},{evilRedirect:true}]){const e=fixture(options);assert.equal((await ask(e)).status,502);unchanged(e);}
 const e=fixture();e.source.version=2;assert.equal((await ask(e)).status,422);unchanged(e);
});
test('Unapproved cash clauses, missing fiscal detail and non-contract operations cannot produce preflight evidence',async()=>{
 for(const change of [e=>e.tables.accepted_quote_terms[0].billing_mode='individual_full_invoice',e=>e.tables.accepted_quote_terms[0].tax_details={payment_method:'efectivo100'},
  e=>e.tables.accepted_quote_terms[0].tax_details=null]){
  const e=fixture();change(e);assert.equal((await ask(e)).status,409);unchanged(e);
 }
 const e=fixture();assert.equal((await ask(e,{kind:'quotation'})).status,422);assert.equal(e.network.length,0);unchanged(e);
});
test('Read-only retries return the same evidence and never promote a generated contract to closure or payment',async()=>{
 const e=fixture();const first=await (await ask(e)).json(),second=await (await ask(e)).json();assert.deepEqual(first,second);
 unchanged(e);assert.equal(e.tables.event_contracts[0].state,'draft');assert.equal(e.tables.event_documents.length,1);
 assert.equal(e.downloads.length,2);
});
test('Stored PDF with the same size but different bytes cannot be accepted from metadata alone',async()=>{
 const e=fixture({storagePdf:'%PDF-1.4\nFAIL'}),r=await ask(e),result=await r.json();
 assert.equal(r.status,409);assert.match(result.error,/bytes privados/);assert.equal(result.checks,undefined);assert.equal(e.downloads.length,1);unchanged(e);
});
test('Stored PDF paths cannot select another event, revision, object type, URL or traversal',async()=>{
 const suffix='a'.repeat(64)+'.pdf';
 for(const path of ['other-event/contract-v1-'+suffix,'../contract-v1-'+suffix,'https://example.invalid/private.pdf',null,
  '','/contract-v1-'+suffix,'quotation-v1-'+suffix]){
  const e=fixture();e.tables.event_documents[0].storage_path=path;assert.equal((await ask(e)).status,409);assert.equal(e.downloads.length,0);assert.equal(e.network.length,0);unchanged(e);
 }
 for(const tail of ['contract-v2-'+suffix,'quotation-v1-'+suffix,'contract-v1-../'+suffix,'contract-v1-'+suffix+'?token=private','contract-v1-'+'-'.repeat(64)+'.pdf']){
  const e=fixture();e.tables.event_documents[0].storage_path=e.eventId+'/'+tail;assert.equal((await ask(e)).status,409);assert.equal(e.downloads.length,0);unchanged(e);
 }
});
test('Storage errors are sanitized, and a subsequent read-only retry can succeed without uploads',async()=>{
 for(const flag of ['storageError','storageThrow']){
  const options={[flag]:true},e=fixture(options),r=await ask(e),raw=await r.text();
  assert.equal(r.status,502);assert.ok(!raw.includes('PRIVATE_STORAGE_ERROR'));assert.equal(e.downloads.length,1);unchanged(e);
 }
 const e=fixture({storageError:true});const first=await ask(e);assert.equal(first.status,502);unchanged(e);
 // Fresh request on a healthy mocked service; no compensating write is needed.
 const healthy=fixture();assert.equal((await ask(healthy)).status,200);unchanged(healthy);
});
test('Stored bytes must preserve length and PDF header, and oversized data is rejected before parsing',async()=>{
 for(const pdf of ['','%PDF-1.4\nTRUNCATED','%PNG-1.4\nTEST']){
  const e=fixture({storagePdf:pdf});assert.equal((await ask(e)).status,409);unchanged(e);
 }
 let reads=0;
 const large=fixture({storageBlob:{size:10485761,arrayBuffer:async()=>{reads++;throw Error('must not read');}}});
 assert.equal((await ask(large)).status,409);assert.equal(reads,0);unchanged(large);
 const inconsistent=fixture({storageBlob:{size:pdf.length,arrayBuffer:async()=>new Uint8Array(2).buffer}});
 assert.equal((await ask(inconsistent)).status,409);unchanged(inconsistent);
});

test('Failure reading the private blob is sanitized and never returns accounting evidence',async()=>{
 const e=fixture({storageBlob:{size:pdf.length,arrayBuffer:async()=>{throw Error('PRIVATE_STORAGE_ERROR secret path');}}});
 const r=await ask(e),raw=await r.text();assert.equal(r.status,502);
 assert.ok(!raw.includes('PRIVATE_STORAGE_ERROR'));assert.ok(!raw.includes('secret path'));
 assert.ok(!raw.includes('accounts_source_checked'));unchanged(e);
});
