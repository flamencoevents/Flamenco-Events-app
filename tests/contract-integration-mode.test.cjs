const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const code=fs.readFileSync('tools/ContractIntegration.js','utf8');
test('Contract integration fails closed unless test mode is explicitly true',()=>{
 for(const mode of [null,undefined,'','false','TRUE','invalid']){
  let effects=0;const ctx=vm.createContext({props_:()=>({getProperty:k=>k==='FE_APP_TEST_MODE'?mode:k==='FE_CONTRACT_INTEGRATION_ENABLED'?'TEST_ONLY':null,setProperty:()=>effects++}),LockService:{getScriptLock:()=>{effects++;throw Error('unexpected lock');}},ScriptApp:{getProjectTriggers:()=>{effects++;return [];}}});
  vm.runInContext(code,ctx);
  assert.throws(()=>vm.runInContext('feContratosIntegrarPendientes()',ctx),/modo real/);
  assert.throws(()=>vm.runInContext('feContratosActivarIntegracionPrueba()',ctx),/modo prueba/);
  assert.equal(effects,0);
 }
});

test('Duplicate journal identities block Drive, accounts and delivery and release the lock',()=>{
 let reads=0,sends=0,accounts=0,released=0;const writes=[];
 const journal={getDataRange:()=>({getValues:()=>[['Clave'],['same','INTEGRADO'],['same','PENDIENTE']]}),getLastRow:()=>3,getRange:()=>({setValues:v=>writes.push(v)})};
 const ctx=vm.createContext({console:{log:()=>{}},props_:()=>({getProperty:k=>k==='FE_APP_TEST_MODE'?'true':k==='FE_CONTRACT_INTEGRATION_ENABLED'?'TEST_ONLY':null}),
 LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock:()=>released++})},
 libro_:()=>({getSheetByName:()=>({getDataRange:()=>({getValues:()=>[['header'],['','GENERADO','{"presupuesto":{}}','','','','url']]})})}),
 SpreadsheetApp:{flush:()=>{}},DriveApp:{getFileById:()=>{reads++;throw Error('unexpected');}}});
 vm.runInContext(code,ctx);
 Object.assign(ctx,{feCiSheet_:()=>journal,feCiPlan_:()=>({source_key:'same',quote_number:'test',revision:1}),feContratoPresupuesto_:()=>({}),feCiCuentas_:()=>accounts++,feCiEnviar_:()=>sends++});
 const result=vm.runInContext('feContratosIntegrarPendientes()',ctx);
 assert.equal(result.errores,1);assert.equal(reads,0);assert.equal(accounts,0);assert.equal(sends,0);assert.equal(released,1);
 assert.equal(writes.length,0);
});

test('Delivery only accepts explicit successful receiver states and sanitizes invalid JSON shapes',()=>{
 for(const [raw,status,ok] of [['null',200,false],['[]',200,false],['"recorded"',200,false],['{',200,false],['{}',200,false],['{"state":"recorded"}',302,false],['{"state":"recorded"}',500,false],['{"state":"recorded"}',201,true],['{"state":"already_recorded"}',200,true]]){
  const ctx=vm.createContext({props_:()=>({getProperty:()=> 'synthetic-only-secret-not-used-remotely'}),feAppMac_:()=> 'mock',UrlFetchApp:{fetch:()=>({getContentText:()=>raw,getResponseCode:()=>status})}});
  vm.runInContext(code,ctx);
  if(ok)assert.ok(vm.runInContext('feCiEnviar_({is_test:true})',ctx).state);
  else assert.throws(()=>vm.runInContext('feCiEnviar_({is_test:true})',ctx),/Respuesta de integración no válida|Gestión pendiente: HTTP/);
 }
});

test('A failed recheck retains prior checksum and account reference and stores error as plain text',()=>{
 let released=0;const writes=[],records=[['Clave'],['same','INTEGRADO','old-checksum','old-account']];
 const journal={getDataRange:()=>({getValues:()=>records}),getLastRow:()=>2,getRange:()=>({setValues:v=>writes.push(v)})};
 const ctx=vm.createContext({console:{log:()=>{}},props_:()=>({getProperty:k=>k==='FE_APP_TEST_MODE'?'true':k==='FE_CONTRACT_INTEGRATION_ENABLED'?'TEST_ONLY':null}),
 LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock:()=>released++})},
 libro_:()=>({getSheetByName:()=>({getDataRange:()=>({getValues:()=>[['header'],['','GENERADO','{"presupuesto":{}}','','','','url']]})})}),
 SpreadsheetApp:{flush:()=>{}},DriveApp:{getFileById:()=>{throw Error('=FAKE_FORMULA');}}});
 vm.runInContext(code,ctx);Object.assign(ctx,{feCiSheet_:()=>journal,feCiPlan_:()=>({source_key:'same',quote_number:'test',revision:1,contract_url:'https://drive.google.com/file/d/synthetic/view'}),feContratoPresupuesto_:()=>({})});
 assert.equal(vm.runInContext('feContratosIntegrarPendientes()',ctx).errores,1);
 assert.equal(writes.length,1);assert.equal(writes[0][0][1],'PENDIENTE');
 assert.equal(writes[0][0][2],'old-checksum');assert.equal(writes[0][0][3],'old-account');
 assert.equal(writes[0][0][5],'Error: =FAKE_FORMULA');assert.equal(released,1);
});

test('Partial delivery failure recovers one journal identity and subsequent retry does not redeliver',()=>{
 const records=[['Clave']],accountKeys=new Set();let sends=0,releases=0;
 const journal={getDataRange:()=>({getValues:()=>records.map(r=>r.slice())}),getLastRow:()=>records.length,
 getRange:row=>({setValues:values=>{records[row-1]=Array.from(values[0]);}})};
 const ctx=vm.createContext({console:{log:()=>{}},props_:()=>({getProperty:k=>k==='FE_APP_TEST_MODE'?'true':k==='FE_CONTRACT_INTEGRATION_ENABLED'?'TEST_ONLY':null}),
 LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock:()=>releases++})},
 libro_:()=>({getSheetByName:()=>({getDataRange:()=>({getValues:()=>[['header'],['','GENERADO','{"presupuesto":{}}','','','','url']]})})}),
 SpreadsheetApp:{flush:()=>{}},DriveApp:{getFileById:()=>({getBlob:()=>({getBytes:()=>[37,80,68,70,45]})})}});
 vm.runInContext(code,ctx);Object.assign(ctx,{
 feCiSheet_:()=>journal,feCiPlan_:()=>({source_key:'same',quote_number:'test',revision:1,contract_url:'https://drive.google.com/file/d/synthetic/view'}),
 feContratoPresupuesto_:()=>({}),feCiSha_:()=> 'synthetic-checksum',
 feCiCuentas_:p=>{accountKeys.add(p.source_key);return 'synthetic-account';},
 feCiEnviar_:()=>{if(++sends===1)throw Error('temporary delivery failure');return {state:'already_recorded'};}});
 assert.equal(vm.runInContext('feContratosIntegrarPendientes()',ctx).errores,1);
 assert.equal(records.length,2);assert.equal(records[1][1],'PENDIENTE');
 assert.equal(vm.runInContext('feContratosIntegrarPendientes()',ctx).integrados,1);
 assert.equal(records.length,2);assert.equal(records[1][1],'INTEGRADO');assert.equal(records[1][2],'synthetic-checksum');
 assert.equal(vm.runInContext('feContratosIntegrarPendientes()',ctx).existentes,1);
 assert.equal(sends,2);assert.equal(accountKeys.size,1);assert.equal(records.length,2);assert.equal(releases,3);
});

test('Repeated source rows reuse the journal created earlier in the same batch',()=>{
 const records=[['Clave']],accountKeys=new Set();let sends=0,releases=0;
 const journal={getDataRange:()=>({getValues:()=>records.map(r=>r.slice())}),getLastRow:()=>records.length,
 getRange:row=>({setValues:values=>{records[row-1]=Array.from(values[0]);}})};
 const ctx=vm.createContext({console:{log:()=>{}},props_:()=>({getProperty:k=>k==='FE_APP_TEST_MODE'?'true':k==='FE_CONTRACT_INTEGRATION_ENABLED'?'TEST_ONLY':null}),
 LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock:()=>releases++})},
 libro_:()=>({getSheetByName:()=>({getDataRange:()=>({getValues:()=>[['header'],['','GENERADO','{"presupuesto":{}}','','','','url'],['','GENERADO','{"presupuesto":{}}','','','','url']]})})}),
 SpreadsheetApp:{flush:()=>{}},DriveApp:{getFileById:()=>({getBlob:()=>({getBytes:()=>[37,80,68,70,45]})})}});
 vm.runInContext(code,ctx);Object.assign(ctx,{
 feCiSheet_:()=>journal,feCiPlan_:()=>({source_key:'same',quote_number:'test',revision:1,contract_url:'https://drive.google.com/file/d/synthetic/view'}),
 feContratoPresupuesto_:()=>({}),feCiSha_:()=> 'synthetic-checksum',
 feCiCuentas_:p=>{accountKeys.add(p.source_key);return 'synthetic-account';},
 feCiEnviar_:()=>{sends++;return {state:'recorded'};}});
 const result=vm.runInContext('feContratosIntegrarPendientes()',ctx);
 assert.equal(result.integrados,1);assert.equal(result.existentes,1);assert.equal(result.errores,0);assert.equal(records.length,2);assert.equal(sends,1);assert.equal(releases,1);
});

test('Financial plan rejects unsafe integer cents before any external effect',()=>{
 const ctx=vm.createContext({feContratoModalidad_:()=>{}});
 vm.runInContext(code,ctx);
 const plan=amounts=>{
  ctx.input={presupuesto:{modelo:'FE3',modoPrueba:true,id:'X26-P999999',key:'X26-P999999-v1',revision:1,request:{fecha:'2027-08-14',cliente:'Ficticio',lugar:'Prueba',servicios:[{artistas:'Prueba',duracion:'1 h'}]},calculo:amounts}};
  return vm.runInContext("feCiPlan_(input,'https://drive.google.com/file/d/synthetic/view')",ctx);
 };
 assert.equal(plan({total:0.29,reserva:0,pendiente:0.29}).total_eur,0.29);
 for(const field of ['total','reserva','pendiente']){
  const amounts={total:100,reserva:30,pendiente:70};amounts[field]=Number.MAX_SAFE_INTEGER;
  assert.throws(()=>plan(amounts),/Importes guardados no válidos/);
 }
});

test('Financial plan never rounds away fractions smaller than one cent',()=>{
 const ctx=vm.createContext({feContratoModalidad_:()=>{}});vm.runInContext(code,ctx);
 const plan=value=>{
  ctx.input={presupuesto:{modelo:'FE3',modoPrueba:true,id:'X26-P999999',key:'X26-P999999-v1',revision:1,request:{fecha:'2027-08-14',cliente:'Ficticio',lugar:'Prueba',servicios:[{artistas:'Prueba',duracion:'1 h'}]},calculo:{total:value,reserva:0,pendiente:value}}};
  return vm.runInContext("feCiPlan_(input,'https://drive.google.com/file/d/synthetic/view')",ctx);
 };
 for(const value of [0.000001,1.000001,0.001,1.005,1230.000001])assert.throws(()=>plan(value),/Importes guardados no válidos/);
 for(const value of [0,0.01,0.29,1230.21])assert.equal(plan(value).total_eur,value);
});
