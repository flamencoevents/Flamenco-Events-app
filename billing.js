(function(root){
 'use strict';
 let context=null;
 const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const euro=new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'});
 function cents(value){
  const text=String(value);
  if((typeof value!=='string'&&!Number.isSafeInteger(value))||text.length>32||!/^[0-9]{1,10}(?:\.[0-9]{1,2}0*)?$/.test(text))throw Error('Revisa los importes. Se requieren euros con precisión de céntimos.');
  const [whole,decimal='']=text.split('.');
  return Number(whole)*100+Number(decimal.padEnd(2,'0').slice(0,2));
 }
 function review(invoice,events,terms){
  if(invoice?.is_test!==true||invoice.currency!=='EUR'||![0,'0'].includes(invoice.type))throw Error('Selecciona una factura estándar ficticia en euros.');
  const id=['number','string'].includes(typeof invoice.id)?String(invoice.id):'',reference=invoice.ref;
  if(!/^[1-9][0-9]{0,18}$/.test(id)||(typeof invoice.id==='number'&&!Number.isSafeInteger(invoice.id))||
     typeof reference!=='string'||!/^[A-Za-z0-9][A-Za-z0-9._/-]{0,79}$/.test(reference))throw Error('Revisa el identificador y la referencia de la factura.');
  const related=terms.filter(t=>t.quote_number&&Number.isInteger(t.version)&&t.version>0&&invoice.ref_ext===t.quote_number+'-v'+t.version);
  const matches=events.filter(e=>e.is_test===true&&related.some(t=>t.id===e.quote_terms_id));
  if(related.length!==1||matches.length!==1)throw Error('La referencia externa debe identificar una revisión y un evento ficticio únicos.');
  return {id,reference,eventId:matches[0].id,key:invoice.ref_ext,net:cents(invoice.total_ht),vat:cents(invoice.total_tva),total:cents(invoice.total_ttc)};
 }
 function insert(records, invoice){
  if(records.has(invoice.id)){
   if(JSON.stringify(records.get(invoice.id))!==JSON.stringify(invoice))throw Error('Ya hay una factura con ese identificador y datos distintos.');
   return false;
  }
  records.set(invoice.id,invoice);
  return true;
 }
 function summary(records,eventId){
  const rows=[...records].filter(row=>eventId===undefined||row.eventId===eventId);
  if(!rows.length)return '<p>Sin facturas revisadas en esta sesión.</p>';
  return '<ul>'+rows.map(row=>'<li><strong>'+esc(row.reference)+'</strong> · '+esc(row.key)+
   ' · Base '+euro.format(row.net/100)+' · IVA '+euro.format(row.vat/100)+' · Total '+euro.format(row.total/100)+' · Cobro sin verificar</li>').join('')+'</ul>';
 }
 function panel(eventId){
  const linked=typeof eventId==='string';
  const body=linked?summary(context?.records.values()??[],eventId):'<p>Vinculación con Dolibarr pendiente de revisión por Administración.</p>';
  return '<details><summary>Factura</summary><div'+(linked?' data-invoice-event="'+esc(eventId)+'"':'')+'>'+body+'</div></details>';
 }
 function clear(){
  const host=document.getElementById('facturacion');
  context=null;
  if(host){host.replaceChildren();host.hidden=true;}
  document.querySelectorAll('[data-invoice-event]').forEach(node=>{node.innerHTML=summary([]);});
 }
 function mount(events,terms,actor){
  const host=document.getElementById('facturacion');
  if(!host||!actor)return;
  if(context?.actor!==actor)context={actor,records:new Map()};
  const session=context;
  host.hidden=false;
  host.innerHTML='<h2>Facturación</h2><p>Dolibarr · Modo prueba. Carga un JSON de una factura estándar en euros de Dolibarr de pruebas. Debe incluir is_test: true, currency: EUR, ref_ext con la revisión del presupuesto e importes decimales como texto. La revisión se borra al salir o recargar.</p>'+
   '<form><label>Factura Dolibarr de prueba <input name="invoice" type="file" accept=".json,application/json" required></label><button type="submit">Importar para revisión</button></form>'+
   '<p role="status"></p><div data-invoice-list>'+summary(session.records.values())+'</div>';
  const form=host.querySelector('form'),status=host.querySelector('[role=status]');
  form.addEventListener('submit',async event=>{
   event.preventDefault();
   const file=form.elements.invoice.files[0];
   if(!file||file.size>250000){status.textContent='Selecciona un JSON de hasta 250 KB.';return;}
   try{
    const raw=await file.text();
    if(context!==session)return;
    let invoice;
    try{invoice=JSON.parse(raw);}catch{throw Error('El archivo no contiene un JSON válido.');}
    const changed=insert(session.records,review(invoice,events,terms));
    host.querySelector('[data-invoice-list]').innerHTML=summary(session.records.values());
    document.querySelectorAll('[data-invoice-event]').forEach(node=>{
     node.innerHTML=summary(session.records.values(),node.dataset.invoiceEvent);
    });
    status.textContent=changed?'Factura incorporada para revisión.':'Esta factura ya está en revisión.';
    form.reset();
   }catch(error){if(context===session)status.textContent=error.message;}
  });
 }
 root.FEBilling={mount,clear,panel,review,insert,summary};
})(window);
