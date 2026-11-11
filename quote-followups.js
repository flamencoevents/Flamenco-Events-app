/* Vista común FE: estado comercial de presupuestos. Solo lectura; cambios desde Apps Script. */
(function(){
'use strict';
const clean=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const day=v=>v?new Date(v).toLocaleDateString('es-ES',{timeZone:'Europe/Madrid'}):'—';
const moneyless=(v)=>String(v||'').slice(0,100);
function stats(rows){
 const today=new Date(),opened=rows.filter(x=>x.commercial_status==='ENVIADO');
 return {open:opened.length,closed:rows.filter(x=>x.commercial_status==='CERRADO').length,
   expired:opened.filter(x=>x.expires_at&&new Date(x.expires_at)<=today&&x.reminder_status!=='EVENTO_PASADO').length,
   toCall:opened.filter(x=>x.reminder_status==='ENVIADO_A_AZAHARA').length};
}
function markup(rows,role){
 const totals=stats(rows);
 const heading='<h2>Presupuestos · Flamenco Events</h2><p>Estado comercial independiente de la generación del PDF. «CERRADO» significa contrato solicitado, no reserva confirmada ni contrato firmado.</p>';
 if(!rows.length)return heading+'<p>No hay presupuestos sincronizados todavía. Los documentos existentes permanecen en sus registros de origen; no se deduce su estado por la ausencia de una fila.</p>';
 const metrics='<p><strong>'+totals.open+'</strong> enviados pendientes · <strong>'+totals.expired+'</strong> vencidos sin contrato · <strong>'+totals.toCall+'</strong> con aviso a Azahara · <strong>'+totals.closed+'</strong> cerrados</p>';
 const ordered=rows.slice().sort((a,b)=>String(b.sent_at).localeCompare(String(a.sent_at)));
 return heading+metrics+'<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:.9rem"><thead><tr><th align="left">Presupuesto</th><th align="left">Cliente / evento</th><th align="left">Estado</th><th align="left">Enviado</th><th align="left">Vence</th><th align="left">Seguimiento</th><th>PDF</th></tr></thead><tbody>'+
 ordered.map(x=>'<tr style="border-top:1px solid #725d4f"><td>'+clean(x.quote_number)+' v'+clean(x.revision)+'</td><td>'+clean(moneyless(x.client_label))+'<small style="display:block">'+clean(x.event_date||'')+' · '+clean(moneyless(x.venue))+'</small></td><td><strong>'+clean(x.commercial_status)+'</strong>'+(x.is_test?' <small>(PRUEBA)</small>':'')+'</td><td>'+day(x.sent_at)+'</td><td>'+day(x.expires_at)+'</td><td>'+clean(x.reminder_status==='ENVIADO_A_AZAHARA'?'Llamar al cliente':x.reminder_status==='PENDIENTE'?'Pendiente de plazo':x.reminder_status)+'</td><td>'+(x.pdf_url&&/^https:\/\/drive\.google\.com\/file\/d\/[\w-]+\/view(?:\?[^#]*)?$/.test(x.pdf_url)?'<a href="'+clean(x.pdf_url)+'" target="_blank" rel="noopener noreferrer">Ver PDF</a>':'—')+'</td></tr>').join('')+'</tbody></table></div>';
}
async function mount(db,role,id){
 const node=document.getElementById(id);if(!node||!db||!['admin','sales'].includes(role))return;
 node.textContent='Cargando seguimiento de presupuestos…';
 const {data,error}=await db.from('fe_quote_followups').select('source_key,quote_number,revision,commercial_status,sent_at,expires_at,contract_requested_at,client_label,event_date,venue,pdf_url,reminder_status,is_test').eq('brand','FLAMENCO_EVENTS').order('sent_at',{ascending:false}).limit(500);
 if(error){node.textContent='No se ha podido comprobar el seguimiento comercial: '+error.message;return;}
 node.innerHTML=markup(data||[],role);
}
window.FEQuoteFollowups={mount,stats,markup};
})();
