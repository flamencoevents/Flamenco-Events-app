(function(root){
 'use strict';
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fields=['MES','Nº','nº presup','FECHA','HORARIO','LUGAR','WEDDING/CLIENTE','PRESUPUESTO','COBRADO RESERVA','IVA','FECHA RESERVA','Cobro pendiente','ARTISTAS','GASTOS ARTISTAS y DESPLAZAMIENTO','GASTOS GRABACION DE VIDEO','COMISION WED.','COBRO TOTAL'];
 const money=x=>x===null||x===undefined||x===''?'—':Number.isFinite(Number(x))?new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(Number(x)):String(x);
 const date=x=>/^\d{4}-\d{2}-\d{2}$/.test(x||'')?x.split('-').reverse().join('/'):'—';
 function url(x){try{const u=new URL(x);return u.protocol==='https:'&&!u.username&&!u.password&&(
  u.hostname==='docs.google.com'&&/^\/spreadsheets\/d\/[\w-]+\//.test(u.pathname)||
  u.hostname==='drive.google.com'&&/^\/file\/d\/[\w-]+\//.test(u.pathname)||
  u.hostname==='www.canva.com'&&/^\/(design|d)\//.test(u.pathname)||u.hostname==='canva.link'&&/^\/[\w-]+$/.test(u.pathname))?u.href:null;}catch{return null;}}
 const link=(href,label)=>url(href)?'<a href="'+esc(url(href))+'" target="_blank" rel="noopener noreferrer">'+esc(label)+'</a>':'';
 function table(rows){
  const field=(label,value)=>'<div class="fe-event-field"><dt>'+esc(label)+'</dt><dd>'+esc(value===null||value===undefined||value===''?'—':value)+'</dd></div>';
  return '<div class="fe-event-cards" role="list" aria-label="Eventos y documentos del libro">'+rows.map(r=>
    '<article class="fe-event-entry" role="listitem">'+
    '<div class="fe-event-data">'+
      field('Fecha',date(r.event_date))+
      field('Horario',r.schedule)+
      field('Lugar',r.venue)+
      field('Wedding / cliente',r.client_label)+
    '</div>'+
    '<div class="fe-event-docs">'+
      '<div class="fe-event-label">Presupuesto del libro</div>'+
      '<strong>'+esc(r.budget_eur===null?r.budget_text||'—':money(r.budget_eur))+'</strong>'+
      '<small>Ref. '+esc(r.quote_number||'sin referencia')+'</small>'+
      '<div class="fe-event-actions">'+
       (link(r.quotation_url,'Abrir presupuesto')||'<span class="fe-event-pending">Presupuesto sin enlazar</span>')+
       (link(r.contract_url,'Abrir contrato')||'<span class="fe-event-pending">Contrato sin enlazar</span>')+
       '<button type="button" data-accounts-detail="'+esc(r.source_row)+'">Cuentas del evento</button>'+
       link(r.source_link,'Documento del libro')+
       (r.document_note?'<small class="fe-event-note">'+esc(r.document_note)+'</small>':'')+
      '</div>'+
    '</div>'+
    '</article>').join('')+'</div>'+(rows.length?'':'<p>No hay eventos que coincidan.</p>');
 }

 function detail(r,year){
  if(Array.isArray(r.account_values?.__source_fields)){return '<h3>Ficha del libro · '+esc(r.client_label||r.venue||'Evento')+'</h3><p>'+date(r.event_date)+' · Fila '+esc(r.source_row)+' · '+esc(r.account_values.__source_sheet)+'</p><p>Valores originales del histórico, sin recalcular ni cambiar su significado.</p><dl class="accounts-details">'+r.account_values.__source_fields.map(f=>'<div><dt>'+esc(f.column)+' · '+esc(f.label)+'</dt><dd>'+esc(f.value===''?'—':f.value)+(f.formula?'<details><summary>Fórmula original</summary><code>'+esc(f.formula)+'</code></details>':'')+(f.note?'<small>'+esc(f.note)+'</small>':'')+'</dd></div>').join('')+'</dl><p>'+link(year.source_url,'Abrir cuentas totales de '+year.year)+'</p><button type="button" data-accounts-close>Cerrar ficha</button>'; }
  const monetary=new Set(['PRESUPUESTO','COBRADO RESERVA','Cobro pendiente','GASTOS ARTISTAS y DESPLAZAMIENTO','GASTOS GRABACION DE VIDEO','COMISION WED.','COBRO TOTAL']);
  const val=k=>k==='FECHA'?date(r.event_date):k==='HORARIO'?r.schedule||'—':monetary.has(k)?money(r.account_values?.[k]):r.account_values?.[k]??'—';
  return '<h3>Ficha económica · '+esc(r.client_label||r.venue||'Evento')+'</h3><p>'+date(r.event_date)+' · Presupuesto '+esc(r.quote_number||'sin referencia')+'</p><p>Lectura del libro, fila '+esc(r.source_row)+'. No modifica cobros, contratos ni reservas.</p><dl class="accounts-details">'+fields.map(k=>'<div><dt>'+esc(k)+'</dt><dd>'+esc(val(k))+'</dd></div>').join('')+'</dl><p>'+link(year.source_url,'Abrir cuentas totales de '+year.year)+'</p><button type="button" data-accounts-close>Cerrar ficha</button>';
 }
 function clear(id='accounts-events'){root.FEHistory?.clear();const host=document.getElementById(id);if(host){host._accountsTicket=(host._accountsTicket||0)+1;host.innerHTML='';}}
 async function mount(db,role,id='accounts-events'){
  const host=document.getElementById(id);if(!host)return;
  clear(id);const ticket=host._accountsTicket;
  if(!['admin','sales'].includes(role))return;
  host.innerHTML='<h2>Eventos · Cuentas Flamenco Events</h2><p role="status">Cargando listado privado…</p>';
  let actor;
  const current=async()=>{const auth=await db.auth.getUser();return host._accountsTicket===ticket&&auth.data?.user?.id===actor;};
  try{
   const auth=await db.auth.getUser();actor=auth.data?.user?.id;if(!actor||host._accountsTicket!==ticket)return;
   const y=await db.from('accounts_year_catalog').select('year,source_url,source_title,source_modified_at,imported_at').order('year',{ascending:false});
   if(!await current())return;if(y.error)throw y.error;
   const years=y.data||[];
   if(!years.length){host.innerHTML='<h2>Eventos · Cuentas Flamenco Events</h2><p>El listado del libro todavía no se ha incorporado.</p>';return;}
   host.innerHTML='<h2>Registros del libro de cuentas</h2><p>Consulta interna. Cada ficha reproduce un registro histórico, no necesariamente un evento confirmado. No crea reservas ni modifica las cuentas.</p><div class="accounts-toolbar"><label>Año<select data-accounts-year>'+years.map(y=>'<option value="'+esc(y.year)+'">'+esc(y.year)+'</option>').join('')+'</select></label><label>Buscar evento<input data-accounts-search type="search" placeholder="Cliente, lugar o presupuesto"></label><button type="button" data-accounts-refresh>Actualizar listado</button></div><p data-accounts-source></p><p role="status" data-accounts-status></p><div data-accounts-table></div><section data-accounts-ficha tabindex="-1" hidden></section>';
   const select=host.querySelector('[data-accounts-year]'),search=host.querySelector('[data-accounts-search]'),out=host.querySelector('[data-accounts-table]'),ficha=host.querySelector('[data-accounts-ficha]'),status=host.querySelector('[data-accounts-status]');
   let rows=[],loadId=0;
   const draw=()=>{if(host._accountsTicket!==ticket)return;const term=search.value.trim().toLocaleLowerCase('es');const filtered=rows.filter(r=>[r.client_label,r.venue,r.quote_number,r.event_date].some(x=>String(x||'').toLocaleLowerCase('es').includes(term)));out.innerHTML=table(filtered);status.textContent=filtered.length+' de '+rows.length+' registros del libro (no todos verificados como eventos cerrados)';};
   async function load(){const request=++loadId,year=years.find(y=>String(y.year)===select.value);rows=[];out.innerHTML='';ficha.innerHTML='';ficha.hidden=true;status.textContent='Cargando…';
    const x=await db.from('accounts_event_catalog').select('source_row,event_date,schedule,venue,client_label,quote_number,budget_eur,budget_text,account_values,source_link,quotation_url,contract_url,document_note').eq('year',year.year).order('event_date').order('source_row');
    if(!await current()||request!==loadId)return;if(x.error){status.textContent='No se pudo leer el listado. Inténtalo de nuevo.';return;}
    rows=x.data||[];host.querySelector('[data-accounts-source]').innerHTML=link(year.source_url,'Cuentas totales de '+year.year)+' <span class="accounts-source-time">Última lectura: '+esc(new Date(year.imported_at).toLocaleString('es-ES'))+'</span><small>La actualización automática desde Drive está pendiente.</small>';draw();
   }
   select.addEventListener('change',load);search.addEventListener('input',draw);host.querySelector('[data-accounts-refresh]').addEventListener('click',load);
   out.addEventListener('click',e=>{const b=e.target.closest('[data-accounts-detail]');if(!b||host._accountsTicket!==ticket)return;const row=rows.find(r=>String(r.source_row)===b.dataset.accountsDetail);if(!row)return;ficha.innerHTML=detail(row,years.find(y=>String(y.year)===select.value));ficha.hidden=false;ficha.querySelector('[data-accounts-close]').addEventListener('click',()=>{ficha.hidden=true;ficha.innerHTML='';b.focus();});ficha.focus();});
   await load();if(await current())await root.FEHistory?.mount(db,role);
  }catch(error){if(host._accountsTicket===ticket)host.innerHTML='<h2>Eventos · Cuentas Flamenco Events</h2><p role="alert">No se pudo leer el listado privado. Vuelve a iniciar sesión o inténtalo de nuevo.</p>';}
 }
 root.FEAccounts={mount,clear,table,detail,safeUrl:url};
})(window);
