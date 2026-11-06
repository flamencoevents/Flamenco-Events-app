const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function api(extra={}){const c=vm.createContext({window:{},...extra});vm.runInContext(fs.readFileSync('accounts-history.js','utf8'),c);return c.window.FEHistory;}
test('Historical sheets escape cell content, notes and formulas without executing them',()=>{
 const html=api().sheetHtml([{row:4,cells:[{column:'A',data:{formattedValue:'<script>bad</script>',userEnteredValue:{formulaValue:'=<bad>'},note:'<note>'}},{column:'R',data:{formattedValue:'0,00 €'}}]}]);
 assert.ok(!html.includes('<script>'));assert.ok(!html.includes('<bad>'));assert.ok(!html.includes('<note>'));assert.match(html,/Fórmula original/);assert.match(html,/0,00 €/);assert.match(html,/>R<\/th>/);
});
test('Non-staff cannot request historical sheets',async()=>{
 let reads=0;const host={innerHTML:'private'};const a=api({document:{getElementById:()=>host}});
 await a.mount({from(){reads++;}},'client');assert.equal(reads,0);assert.equal(host.innerHTML,'');
});
test('A session change discards a pending history response',async()=>{
 const host={innerHTML:''};let actor='first',resolve;
 const db={auth:{getUser:async()=>({data:{user:{id:actor}}})},from(){const q={select:()=>q,eq:()=>q,order:()=>q,then:fn=>new Promise(r=>resolve=r).then(fn)};return q;}};
 const a=api({document:{getElementById:()=>host}}),p=a.mount(db,'sales');while(!resolve)await new Promise(r=>setImmediate(r));actor='second';resolve({data:[{sheet_id:1}]});await p;assert.equal(host.innerHTML,'');
});
test('Historical event detail keeps R and S labels instead of reinterpreting a total',()=>{
 const c=vm.createContext({window:{},URL,Intl});vm.runInContext(fs.readFileSync('accounts-events.js','utf8'),c);
 const html=c.window.FEAccounts.detail({source_row:4,event_date:'2025-03-12',account_values:{__source_fields:[{column:'S',label:'TOTAL CASA',value:'99,00 €'}],__source_sheet:'Hoja ficticia'}},{year:2025,source_url:'https://docs.google.com/spreadsheets/d/FICTICIO/edit'});
 assert.match(html,/S · TOTAL CASA/);assert.ok(!html.includes('COBRO TOTAL'));
});
