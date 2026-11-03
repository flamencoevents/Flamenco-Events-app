const {test}=require('node:test'),assert=require('node:assert/strict');
const {env,payload}=require('./edge-harness.cjs');
test('Valid accepted fictitious quotation records exact amounts',async()=>{const e=env();assert.equal((await e.run(payload())).status,201);assert.equal(e.inserts[0].total_payable_eur,100);assert.equal(e.inserts.length,1)});
test('Test mode rejects unmarked data or non-test enquiries',async()=>{for(const options of [{sourceTag:'website'},{}]){const e=env(options),p=payload();if(!options.sourceTag)p.is_test=false;assert.equal((await e.run(p)).status,409);assert.equal(e.inserts.length,0)}});
test('Missing runtime state fails closed',async()=>{const e=env({runtimeError:{message:'missing'}});assert.equal((await e.run(payload())).status,503);assert.equal(e.inserts.length,0)});
test('Tampered and expired signatures rejected before writes',async()=>{const e=env();for(const o of [{tamper:true},{timestamp:1}])assert.equal((await e.run(payload(),o)).status,401);assert.equal(e.inserts.length,0)});
test('Signed null and arrays return controlled errors',async()=>{const e=env();for(const p of [null,[]])assert.equal((await e.run(p)).status,400);assert.equal(e.inserts.length,0)});
test('Commercial acceptance required even with valid signature',async()=>{const e=env({stage:'approved'});assert.equal((await e.run(payload())).status,409);assert.equal(e.inserts.length,0)});
test('Identical retry is idempotent, conflicting amount rejected',async()=>{const p=payload(),e=env({existing:p});assert.equal((await e.run(p)).status,200);assert.equal((await e.run({...p,total_payable_eur:101})).status,409);assert.equal(e.inserts.length,0)});
test('Browser submissions rejected',async()=>{const e=env();assert.equal((await e.run(payload(),{headers:{origin:'https://example.invalid'}})).status,403);assert.equal(e.inserts.length,0)});

test('Sheet test reference preserves origin and requires explicit fictitious flag',async()=>{
 const p={...payload(),quote_number:'X26-P000004',source_reference:'sheet:12djLXZ7he8Znhp8ngNn_VvBPiV9-gzWR1HGtGycV0RY:FE_Cola:X26-P000004-v1'};
 const e=env();assert.equal((await e.run(p)).status,201);
 assert.equal(e.inserts[0].external_reference,p.source_reference);
 const bad=env({testMode:false});assert.equal((await bad.run({...p,is_test:false})).status,422);assert.equal(bad.inserts.length,0);
});
test('Source mismatches are rejected on initial import and identical-value retry',async()=>{
 const p={...payload(),source_reference:'sheet:12djLXZ7he8Znhp8ngNn_VvBPiV9-gzWR1HGtGycV0RY:FE_Cola:9999926-v1'};
 const e=env();assert.equal((await e.run({...p,source_reference:'sheet:wrong'})).status,422);assert.equal(e.inserts.length,0);
 const conflict=env({existing:{...p,external_reference:'appscript:9999926'}});
 assert.equal((await conflict.run(p)).status,409);
});
