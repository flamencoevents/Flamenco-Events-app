const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function api(extra={}){const c=vm.createContext({window:{},...extra});vm.runInContext(fs.readFileSync('accounts-history.js','utf8'),c);return c.window.FEHistory;}
test('History shows only the validated original link and requests no sheet cells',async()=>{
 const host={innerHTML:''},reads=[];
 const db={auth:{getUser:async()=>({data:{user:{id:'staff'}}})},from(table){reads.push(table);const q={select:fields=>{reads.push(fields);return q;},eq:()=>q,order:()=>q,limit:async n=>{assert.equal(n,1);return{data:[{source_url:'https://docs.google.com/spreadsheets/d/test/edit',private_cells:'PRIVATE_CELLS'}]};}};return q;}};
 const a=api({document:{getElementById:()=>host},window:{FEAccounts:{safeUrl:x=>x}}});await a.mount(db,'sales');
 assert.deepEqual(reads,['accounts_source_sheet_catalog','source_url']);assert.match(host.innerHTML,/Abrir el libro original/);assert.match(host.innerHTML,/noopener noreferrer/);assert.ok(!host.innerHTML.includes('PRIVATE_CELLS'));assert.equal(a.sheetHtml,undefined);
});
test('Non-staff cannot request historical sheets',async()=>{
 let reads=0;const host={innerHTML:'private'};const a=api({document:{getElementById:()=>host}});
 await a.mount({from(){reads++;}},'client');assert.equal(reads,0);assert.equal(host.innerHTML,'');
});
test('A session change discards a pending history response',async()=>{
 const host={innerHTML:''};let actor='first',resolve;
 const db={auth:{getUser:async()=>({data:{user:{id:actor}}})},from(){const q={select:()=>q,eq:()=>q,order:()=>q,limit:()=>new Promise(r=>resolve=r)};return q;}};
 const a=api({document:{getElementById:()=>host}}),p=a.mount(db,'sales');while(!resolve)await new Promise(r=>setImmediate(r));actor='second';resolve({data:[{sheet_id:1}]});await p;assert.equal(host.innerHTML,'');
});
test('Historical event detail keeps R and S labels instead of reinterpreting a total',()=>{
 const c=vm.createContext({window:{},URL,Intl});vm.runInContext(fs.readFileSync('accounts-events.js','utf8'),c);
 const html=c.window.FEAccounts.detail({source_row:4,event_date:'2025-03-12',account_values:{__source_fields:[{column:'S',label:'TOTAL CASA',value:'99,00 €'}],__source_sheet:'Hoja ficticia'}},{year:2025,source_url:'https://docs.google.com/spreadsheets/d/FICTICIO/edit'});
 assert.match(html,/S · TOTAL CASA/);assert.ok(!html.includes('COBRO TOTAL'));
});
