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
