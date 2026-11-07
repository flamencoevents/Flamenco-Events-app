const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const code=fs.readFileSync('tools/ContractIntegration.js','utf8');
test('Contract integration fails closed unless test mode is explicitly true',()=>{
 for(const mode of [null,undefined,'','false','TRUE','invalid']){
  let effects=0;const ctx=vm.createContext({props_:()=>({getProperty:k=>k==='FE_APP_TEST_MODE'?mode:'TEST_ONLY',setProperty:()=>effects++}),LockService:{getScriptLock:()=>{effects++;throw Error('unexpected lock');}},ScriptApp:{getProjectTriggers:()=>{effects++;return [];}}});
  vm.runInContext(code,ctx);
  assert.throws(()=>vm.runInContext('feContratosIntegrarPendientes()',ctx),/modo real/);
  assert.throws(()=>vm.runInContext('feContratosActivarIntegracionPrueba()',ctx),/modo prueba/);
  assert.equal(effects,0);
 }
});

test('Duplicate journal identities block Drive, accounts and delivery and release the lock',()=>{
 let reads=0,sends=0,accounts=0,released=0;const writes=[];
 const journal={getDataRange:()=>({getValues:()=>[['Clave'],['same','INTEGRADO'],['same','PENDIENTE']]}),getLastRow:()=>3,getRange:()=>({setValues:v=>writes.push(v)})};
 const ctx=vm.createContext({console:{log:()=>{}},props_:()=>({getProperty:k=>k==='FE_APP_TEST_MODE'?'true':'TEST_ONLY'}),
 LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock:()=>released++})},
 libro_:()=>({getSheetByName:()=>({getDataRange:()=>({getValues:()=>[['header'],['','GENERADO','{"presupuesto":{}}','','','','url']]})})}),
 SpreadsheetApp:{flush:()=>{}},DriveApp:{getFileById:()=>{reads++;throw Error('unexpected');}}});
 vm.runInContext(code,ctx);
 Object.assign(ctx,{feCiSheet_:()=>journal,feCiPlan_:()=>({source_key:'same',quote_number:'test',revision:1}),feContratoPresupuesto_:()=>({}),feCiCuentas_:()=>accounts++,feCiEnviar_:()=>sends++});
 const result=vm.runInContext('feContratosIntegrarPendientes()',ctx);
 assert.equal(result.errores,1);assert.equal(reads,0);assert.equal(accounts,0);assert.equal(sends,0);assert.equal(released,1);
 assert.equal(writes.length,0);
});
