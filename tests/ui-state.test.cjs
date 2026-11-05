const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const ctx=vm.createContext({window:{}});vm.runInContext(fs.readFileSync('ui-state.js','utf8'),ctx);const ui=ctx.window.FEState;
test('Contract template is derived from billing, with full individual invoice blocked',()=>{
 assert.equal(ui.template('individual_reservation'),'individual_reservation');assert.equal(ui.template('business_full_invoice'),'business_tax_detail');assert.equal(ui.template('no_vat_quote'),'no_vat');assert.equal(ui.template('individual_full_invoice'),null);
});
test('Readiness gives the next action without pretending publication is a signature',()=>{
 assert.match(ui.nextAction('individual_full_invoice',{state:'sent'},true),/bloqueada/);
 assert.match(ui.nextAction('business_full_invoice',null,false),/Preparar/);
 assert.match(ui.nextAction('business_full_invoice',{state:'draft'},false),/PDF/);
 assert.match(ui.nextAction('business_full_invoice',{state:'ready'},true),/publicarlo/);
 assert.match(ui.nextAction('business_full_invoice',{state:'sent'},true),/Firma pendiente/);
 assert.match(ui.nextAction('business_full_invoice',{state:'signed'},true),/bloqueada/);
});
test('New status and document labels are available in Spanish and English',()=>{
 assert.equal(ui.label('sent'),'Publicado en el portal');assert.equal(ui.label('sent','en'),'Published in the portal');assert.equal(ui.label('contract','en'),'Contract');assert.match(ui.nextAction('individual_full_invoice',null,false,'en'),/blocked/);
});
