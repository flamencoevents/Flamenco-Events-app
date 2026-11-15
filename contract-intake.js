(function(root){'use strict';let epoch=0;const escape=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function clear(){epoch++;const h=document.getElementById('generated-contract-intake');if(h)h.replaceChildren();}
async function mount(db,role){clear();const host=document.getElementById('generated-contract-intake');if(!host||role!=='admin')return;
 host.innerHTML='<h2>Contratos generados · integración de prueba</h2><p>Consulta de documentos y previsiones. Pendiente de revisión comercial; no acredita firma, cobro ni reserva.</p><label>Año del evento<select data-ci-year></select></label><button type="button" data-ci-refresh>Actualizar contratos</button><p role="status" data-ci-status></p><div data-ci-list></div>';
 let rows=[];const status=host.querySelector('[data-ci-status]'),list=host.querySelector('[data-ci-list]'),year=host.querySelector('[data-ci-year]');
 function link(url,label,type){const allowed=type==='pdf'?/^https:\/\/drive\.google\.com\/file\/d\/[\w-]+\/view(?:\?[^#]*)?$/:/^https:\/\/docs\.google\.com\/spreadsheets\/d\/(?:1dsgfqv6YG49-_QaAx-0dUyvLImBTdkkDEvgXBu1QZuY|1ZE66Ko8bnh3qp9Z2Mfp8VOG2pmH_a-EyUJZRvQVnHtE)\/edit#gid=\d+&range=A\d+:N\d+$/;return typeof url==='string'&&allowed.test(url)?'<a target="_blank" rel="noopener noreferrer" href="'+escape(url)+'">'+label+'</a>':'';}
 const eur=new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'});
 const forecast=value=>Number.isFinite(value)&&value>=0?escape(eur.format(value)):'Pendiente';
 function draw(){
  if(rows===null)return;
  const selected=rows.filter(r=>r.event_date.slice(0,4)===year.value);
  list.innerHTML=selected.map(r=>{
   const p=r.payload||{};
   const links=[link(p.contract_url,'Abrir contrato privado','pdf'),link(p.accounts_url,'Abrir previsión de prueba en cuentas','sheet')].filter(Boolean);
   const event=[r.event_date,p.venue,p.client_label].filter(Boolean).map(escape).join(' · ');
   return '<article style="padding:14px 0;border-top:1px solid #705748"><h3>'+escape(r.quote_number)+' · v'+escape(r.revision)+'</h3><p>'+event+'</p>'+
    (p.service?'<p>'+escape(p.service)+'</p>':'')+
    '<p>Previsión: '+forecast(p.total_eur)+' · Reserva prevista: '+forecast(p.deposit_eur)+' · Saldo previsto: '+forecast(p.balance_eur)+'</p>'+
    (links.length?'<p>'+links.join(' · ')+'</p>':'')+
    '<small>PRUEBA · Pendiente de revisión comercial. Sin movimientos en balances reales.</small></article>';
  }).join('');
  status.textContent=selected.length+' contrato(s) de prueba recibido(s).';
 }
 async function load(){
  const request=++epoch;
  status.textContent='Comprobando integración…';
  let response;
  try{
   response=await db.from('generated_contract_intake').select('source_key,quote_number,revision,event_date,payload,received_at').eq('is_test',true).order('event_date');
  }catch{
   response=null;
  }
  if(request!==epoch)return;
  if(!response||response.error){
   rows=null;
   status.textContent='No se pudo consultar la integración de contratos.';
   list.replaceChildren();
   return;
  }
  rows=response.data||[];
  const previous=year.value,years=[...new Set(rows.map(r=>r.event_date.slice(0,4)))].sort().reverse();
  year.innerHTML=years.map(y=>'<option>'+escape(y)+'</option>').join('');
  if(years.includes(previous))year.value=previous;
  draw();
 }
 year.addEventListener('change',draw);host.querySelector('[data-ci-refresh]').addEventListener('click',load);await load();
}root.FEContractIntake={mount,clear};})(typeof window==='undefined'?globalThis:window);

