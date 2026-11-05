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
function fakeForm(){const button={disabled:false};return {message:{value:'Fictitious message'},elements:{topic:{value:'other'},details:{value:'Fictitious proposal'}},resets:0,attributes:{},querySelectorAll(){return [button]},setAttribute(k,v){this.attributes[k]=v},removeAttribute(k){delete this.attributes[k]},reset(){this.resets++},button};}
test('Concurrent messages and proposals submit once and restore their forms',async()=>{
 for(const action of ['sendMessage','submitRequest']){
  const {ctx}=setup(),form=fakeForm();let resolve,calls=0;const pending=new Promise(r=>resolve=r);ctx.form=form;ctx.pending=pending;ctx.insert=()=>{calls++;return pending};
  vm.runInContext("me={id:'a'};db={from(){return {insert}}};loadMessages=async()=>{};refresh=async()=>{}",ctx);
  const first=vm.runInContext(`${action}({preventDefault(){},target:form},'event-a')`,ctx);await vm.runInContext(`${action}({preventDefault(){},target:form},'event-a')`,ctx);
  assert.equal(calls,1);assert.equal(form.button.disabled,true);assert.equal(form.attributes['aria-busy'],'true');resolve({error:null});await first;assert.equal(form.resets,1);assert.equal(form.button.disabled,false);assert.equal(form.attributes['aria-busy'],undefined);
 }
});
test('Rejected or uncertain writes retain text, release the lock and never auto retry',async()=>{
 for(const failure of ['rejected','network']){
  const {ctx}=setup(),form=fakeForm(),alerts=[];let calls=0;ctx.form=form;ctx.alert=x=>alerts.push(x);ctx.insert=async()=>{calls++;if(failure==='network')throw Error('offline');return {error:{message:'Denied'}}};
  vm.runInContext("me={id:'a'};db={from(){return {insert}}}",ctx);await vm.runInContext("sendMessage({preventDefault(){},target:form},'event-a')",ctx);
  assert.equal(calls,1);assert.equal(form.resets,0);assert.equal(form.button.disabled,false);assert.equal(alerts.length,1);
  await vm.runInContext("sendMessage({preventDefault(){},target:form},'event-a')",ctx);assert.equal(calls,2);
 }
});
test('Write responses after account switch cannot reset forms or refresh conversations',async()=>{
 const {ctx}=setup(),form=fakeForm();let resolve;ctx.form=form;ctx.pending=new Promise(r=>resolve=r);ctx.alert=()=>assert.fail('Old-session alert');vm.runInContext("me={id:'a'};db={from(){return {insert(){return pending}}}};loadMessages=()=>{throw Error('Old-session read')}",ctx);
 const task=vm.runInContext("sendMessage({preventDefault(){},target:form},'event-a')",ctx);vm.runInContext("me={id:'b'}",ctx);resolve({error:null});await task;assert.equal(form.resets,0);assert.equal(form.button.disabled,false);
});
test('Private document response is discarded after account change or invalidated refresh',async()=>{
 for(const invalidation of ["me={id:'b'}",'refreshEpoch++']){
  const {ctx}=setup();let resolve;ctx.pending=new Promise(r=>resolve=r);ctx.window.open=()=>assert.fail('Old-session document opened');vm.runInContext("me={id:'a'};db={storage:{from(){return {createSignedUrl(){return pending}}}}}",ctx);
  const task=vm.runInContext("openDocument('fictitious/test.pdf')",ctx);vm.runInContext(invalidation,ctx);resolve({data:{signedUrl:'https://example.invalid/fictitious'},error:null});await task;
 }
});
test('Active session opens its authorized document and handles transport rejection',async()=>{
 const {ctx}=setup(),opened=[],alerts=[];ctx.window.open=(...args)=>opened.push(args);ctx.alert=x=>alerts.push(x);vm.runInContext("me={id:'a'};db={storage:{from(){return {async createSignedUrl(){return {data:{signedUrl:'https://example.invalid/fictitious'},error:null}}}}}}",ctx);
 await vm.runInContext("openDocument('fictitious/test.pdf')",ctx);assert.equal(opened.length,1);assert.equal(opened[0][2],'noopener');vm.runInContext("db.storage.from=()=>({createSignedUrl(){throw Error('offline')}})",ctx);await vm.runInContext("openDocument('fictitious/test.pdf')",ctx);assert.equal(alerts.length,1);assert.equal(opened.length,1);
});
