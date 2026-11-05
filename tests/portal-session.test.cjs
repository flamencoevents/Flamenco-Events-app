const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function setup(){
 const nodes=new Map(),root={lang:'es',setAttribute(k,v){this[k]=v}};
 const node=id=>{if(!nodes.has(id))nodes.set(id,{innerHTML:'',hidden:false,textContent:'',addEventListener(){}});return nodes.get(id)};
 const ctx=vm.createContext({window:{},document:{documentElement:root,getElementById:node},Intl,Date,console,alert(){}});
 for(const f of ['ui-state.js','workflow.js'])vm.runInContext(fs.readFileSync(f,'utf8'),ctx);
 const source=fs.readFileSync('portal.html','utf8').match(/<script>\s*([\s\S]*?)<\/script>/)[1].replace(/start\(\);\s*$/,'');vm.runInContext(source,ctx);return {ctx,node,root};
}
test('Client event renders translated controls and escapes supplied data in both languages',()=>{
 const {ctx,node,root}=setup();vm.runInContext(`db={};me={id:'a',email:'test@example.invalid'};events=[{id:'event-a',title:'<script>unsafe</script>',status:'contract_pending',quote_terms_id:'q'}];quoteTerms=[{id:'q',quote_number:'TEST',version:1,billing_mode:'business_full_invoice',total_payable_eur:1060,deposit_payable_eur:0,tax_details:{base_eur:1000,invoiced_base_eur:1000,vat_eur:210,withholding_eur:150,rounding_eur:0}}];render();`,ctx);
 assert.match(node('app').innerHTML,/Presupuesto aceptado/);assert.doesNotMatch(node('app').innerHTML,/<script>unsafe/);
 vm.runInContext('toggleLang()',ctx);const html=node('app').innerHTML;assert.equal(root.lang,'en');for(const word of ['Accepted quotation','Notifications','Send proposal','Contract pending','Withholding tax:','VAT:'])assert.ok(html.includes(word),word);
 for(const word of ['Presupuesto aceptado','Enviar propuesta','Contrato pendiente','Base guardada','Reserva:'])assert.ok(!html.includes(word),word);
 vm.runInContext('toggleLang()',ctx);assert.equal(root.lang,'es');assert.match(node('app').innerHTML,/Enviar propuesta/);
});
test('Conversation response from old account or invalidated refresh cannot render',async()=>{
 for(const invalidation of ["me={id:'b'}",'refreshEpoch++']){
  const {ctx,node}=setup();let resolve;const pending=new Promise(r=>resolve=r);ctx.pending=pending;
  vm.runInContext("me={id:'a'};db={from(){return {select(){return this},eq(){return this},order(){return pending}}}}",ctx);
  node('thread-event-a').innerHTML='unchanged';const task=vm.runInContext("loadMessages('event-a')",ctx);vm.runInContext(invalidation,ctx);resolve({data:[{author_id:'a',message:'OLD PRIVATE MESSAGE',created_at:'2026-11-05'}]});await task;
  assert.equal(node('thread-event-a').innerHTML,'unchanged');
 }
});
