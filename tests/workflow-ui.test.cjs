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
