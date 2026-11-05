const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
test('Quotation display preserves full individual invoice, zero reserve and saved taxes',()=>{
 const ctx=vm.createContext({window:{},Intl});vm.runInContext(fs.readFileSync('workflow.js','utf8'),ctx);
 const html=ctx.window.FEWorkflow.quoteHtml({quote_number:'<PRUEBA>',version:2,billing_mode:'individual_full_invoice',total_payable_eur:1210,deposit_payable_eur:0,tax_details:{base_eur:1000,invoiced_base_eur:1000,vat_eur:210,withholding_eur:0,rounding_eur:0}});
 assert.match(html,/Particular.*factura completa.*100 % en efectivo/);assert.match(html,/1\.210,00/);assert.match(html,/Reserva: 0,00/);assert.match(html,/IVA: 210,00/);assert.doesNotMatch(html,/<PRUEBA>/);
});
test('Public pages parse and no local demo contact store remains',()=>{
 for(const file of ['index.html','admin.html','staff.html','portal.html']){
  const text=fs.readFileSync(file,'utf8');for(const s of text.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(s[1]);
 }
 const text=fs.readFileSync('index.html','utf8');assert.doesNotMatch(text,/s\.requests|fe-app-github-demo|localStorage/);assert.match(text,/public-enquiry/);
});

test('WhatsApp source inventory renders exact revisions, escapes data and never equates generated with signed',()=>{
 const ctx=vm.createContext({window:{},Intl});vm.runInContext(fs.readFileSync('workflow.js','utf8'),ctx);
 const item={source_sheet:'FE_Cola',source_key:'X26-P900003-v2',quote_number:'X26-P900003',version:2,is_test:true,client_label:'<script>unsafe</script>',event_date:'12/01/2027',venue:'Fictitious',quote_state:'GENERADO',contract_state:'GENERADO',total_payable_eur:605,quotation_pdf_ready:true,contract_pdf_ready:true};
 const page={items:[item],next_offset:20},q={quote_number:item.quote_number,version:2,external_reference:'sheet:12djLXZ7he8Znhp8ngNn_VvBPiV9-gzWR1HGtGycV0RY:FE_Cola:'+item.source_key};
 let html=ctx.window.FEWorkflow.catalogHtml(page,[q]);assert.match(html,/ya incorporada/);assert.match(html,/v2/);assert.match(html,/605,00/);assert.ok(!html.includes('<script>'));assert.match(html,/data-source-next/);assert.ok(!html.includes('Firmado'));
 html=ctx.window.FEWorkflow.catalogHtml(page,[{...q,version:1}],'en');assert.match(html,/not yet linked/);assert.match(html,/Use reference for review/);assert.match(html,/PDF generated/);
 html=ctx.window.FEWorkflow.catalogHtml({items:[{...item,quote_state:'BORRADOR',contract_state:'MULTIPLES'}],next_offset:null});assert.ok(!html.includes('data-source-pick'));assert.match(html,/Revisar duplicados/);
});
test('Source catalog loads read-only inventory and discards responses after account changes',async()=>{
 for(const switchAccount of [false,true]){
  let actor='staff-a',resolve;const handlers=new Map(),nodes=new Map();
  const node=key=>{if(!nodes.has(key))nodes.set(key,{innerHTML:'',textContent:'',dataset:{},disabled:false,elements:{source_sheet:{value:'FE_Cola'}},querySelector:q=>node(key+q),querySelectorAll:()=>[],addEventListener:(type,fn)=>handlers.set(key+':'+type,fn)});return nodes.get(key)};
  const host=node('host');host.querySelector=q=>node(q);host.querySelectorAll=()=>[];
  const catalogOut=node('[data-source-results]');catalogOut.querySelectorAll=()=>[];catalogOut.querySelector=()=>null;
  const ctx=vm.createContext({window:{},document:{getElementById:()=>host},Intl,crypto:require('node:crypto').webcrypto});
  const db={auth:{getUser:async()=>({data:{user:{id:actor}}})},from(){const q={select:()=>q,order:()=>q,then:f=>Promise.resolve({data:[]}).then(f)};return q},functions:{invoke:()=>new Promise(r=>resolve=r)}};
  vm.runInContext(fs.readFileSync('workflow.js','utf8'),ctx);await ctx.window.FEWorkflow.mount(db,'sales');
  const task=handlers.get('[data-source-catalog-form]:submit')({preventDefault(){}});if(switchAccount)actor='staff-b';resolve({data:{source_sheet:'FE_Cola',offset:0,next_offset:null,items:[]},error:null});await task;
  assert.equal(node('[data-source-catalog-form]button').disabled,false);if(switchAccount)assert.equal(catalogOut.innerHTML,'');else assert.match(catalogOut.innerHTML,/Inventario de origen/);
 }
});
