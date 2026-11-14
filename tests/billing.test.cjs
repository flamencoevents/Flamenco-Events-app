const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const window={};
vm.runInNewContext(fs.readFileSync('billing.js','utf8'),{window,Intl});
const {review,insert,summary,panel}=window.FEBilling;
const events=[{id:'test-event',is_test:true,quote_terms_id:'terms'}];
const terms=[{id:'terms',quote_number:'X26-P900099',version:2}];
const invoice={is_test:true,currency:'EUR',type:'0',id:'42',ref:'TEST-42',
 ref_ext:'X26-P900099-v2',total_ht:'1000.0100',total_tva:'210.00',total_ttc:'1210.01',paye:1,note_private:'PRIVATE'};
test('Imports a fictitious invoice for the exact event without inferring payment',()=>{
 const row=review(invoice,events,terms),records=new Map();
 assert.equal(row.net,100001);
 assert.equal(row.total,121001);
 assert.equal(insert(records,row),true);
 assert.equal(insert(records,row),false);
 assert.throws(()=>insert(records,{...row,total:1}),/datos distintos/);
 const html=summary(records.values(),'test-event');
 assert.match(html,/TEST-42.*Cobro sin verificar/);
 assert.doesNotMatch(html,/PRIVATE/);
 assert.doesNotMatch(summary(records.values(),'other'),/TEST-42/);
 assert.match(panel('test-event'),/<summary>Factura<\/summary>/);
});
test('Rejects wrong revision, real events, unsupported invoices and ambiguous matches',()=>{
 for(const patch of [{ref_ext:'X26-P900099-v1'},{is_test:false},{type:2},{total_ttc:'1.001'},
                     {total_ttc:1210.01},{ref:'<script>'}]){
  assert.throws(()=>review({...invoice,...patch},events,terms));
 }
 assert.throws(()=>review(invoice,[{...events[0],is_test:false}],terms),/únicos/);
 assert.throws(()=>review(invoice,[...events,{...events[0],id:'other'}],terms),/únicos/);
});
test('Management panels load billing and place their navigation above event content',()=>{
 for(const path of ['admin.html','staff.html']){
  const html=fs.readFileSync(path,'utf8');
  assert.ok(html.indexOf('id="fe-departments"')<html.indexOf('<main>'));
  assert.match(html,/src="\.\/billing\.js/);
  for(const match of html.matchAll(/<script>\s*([\s\S]*?)<\/script>/g))new vm.Script(match[1]);
 }
 assert.match(fs.readFileSync('admin.html','utf8'),/id="facturacion"/);
});

test('Import updates the event panel and clearing discards a pending file read',async()=>{
 let submit;
 const form={addEventListener:(_,fn)=>{submit=fn;},elements:{invoice:{files:[]}},reset(){}};
 const status={},list={},eventPanel={dataset:{invoiceEvent:'test-event'}};
 const host={querySelector:selector=>({'form':form,'[role=status]':status,'[data-invoice-list]':list}[selector]),replaceChildren(){}};
 const window={};
 const document={getElementById:()=>host,querySelectorAll:()=>[eventPanel]};
 vm.runInNewContext(fs.readFileSync('billing.js','utf8'),{window,Intl,document});
 window.FEBilling.mount(events,terms,'admin-test');
 form.elements.invoice.files=[{size:200,text:async()=>JSON.stringify(invoice)}];
 await submit({preventDefault(){}});
 assert.match(list.innerHTML,/TEST-42/);
 assert.match(eventPanel.innerHTML,/TEST-42/);
 let finish;
 form.elements.invoice.files=[{size:200,text:()=>new Promise(resolve=>{finish=resolve;})}];
 const pending=submit({preventDefault(){}});
 window.FEBilling.clear();
 finish(JSON.stringify(invoice));
 await pending;
 assert.equal(host.hidden,true);
 assert.doesNotMatch(eventPanel.innerHTML,/TEST-42/);
});

test('Administration puts the menu first and groups calendar and sign-out above the tabs',()=>{
 const html=fs.readFileSync('admin.html','utf8');
 assert.match(html,/<body><nav id="fe-departments"/);
 assert.match(html,/<div class="fe-admin-actions"><button[^>]*data-fe-calendar-button[^>]*>[^<]*<\/button><button type="button" id="logout">Salir<\/button><\/div><nav aria-label="Áreas de gestión"/);
});
