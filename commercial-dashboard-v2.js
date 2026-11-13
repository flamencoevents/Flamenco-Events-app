/* Panel comercial organizado. Funciones existentes siguen intactas en sección auxiliar.
 * No impersonar clientes ni afirmar envíos WhatsApp desde una web sin puente autorizado.
 */
(function(root){
'use strict';
const safe=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const el=id=>document.getElementById(id);
const monthNames=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const docUrl=x=>{try{const u=new URL(x);return u.protocol==='https:'&&['docs.google.com','drive.google.com','www.canva.com'].includes(u.hostname)?u.href:null}catch{return null}};
const docLink=(url,label)=>docUrl(url)?'<a href="'+safe(docUrl(url))+'" target="_blank" rel="noopener noreferrer">'+safe(label)+'</a>':'';
let database=null,actor=null,role=null,active='inicio',calMonth=new Date().getMonth(),calYear=new Date().getFullYear(),yearClosed=calYear,closed=[],quotes=[],clientEvents=[],requests=[],selectedClient=null,portalTasks=[],portalPayments=[],portalContracts=[],portalChanges=[],portalMessages=[],portalDocuments=[],attachments=[],artistRoster=[],artistAssignments=[],verifiedArtistFees=[],quoteTerms=[];
function init(db){database=db;const nav=el('fe-commercial-main-nav'),host=el('fe-commercial-dashboard');if(!db||!nav||!host)return;
nav.innerHTML='<button data-fe-section="inicio">Inicio · Calendario</button><button data-fe-section="fechas">Fechas cerradas</button><button data-fe-section="presupuesto">Nuevo presupuesto</button><button data-fe-section="contrato">Nuevo contrato</button><button data-fe-section="enviados">Presupuestos enviados</button><button data-fe-section="clientes">Nuestros clientes</button><button data-fe-section="otras">Otras funciones</button>';
nav.addEventListener('click',e=>{const b=e.target.closest('[data-fe-section]');if(b)show(b.dataset.feSection)});
host.addEventListener('click',e=>{const prev=e.target.closest('[data-fe-month]');if(prev){const delta=Number(prev.dataset.feMonth),d=new Date(calYear,calMonth+delta,1);calYear=d.getFullYear();calMonth=d.getMonth();render();return}const target=e.target.closest('[data-fe-client]');if(target){selectedClient=target.dataset.feClient;render();return}const go=e.target.closest('[data-fe-edit-portal]');if(go){selectedClient=go.dataset.feEditPortal;render();return}const copy=e.target.closest('[data-fe-copy]');if(copy){const request=requests.find(x=>x.id===copy.dataset.feCopy);if(request){const message=formatRequest(request);if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(message).then(()=>{el('fe-action-note').textContent='Texto copiado. El envío al grupo de WhatsApp es manual.'}).catch(()=>{el('fe-action-note').textContent='No se pudo copiar: selecciona el texto desde la ficha.'})}else el('fe-action-note').textContent=message}return}});
host.addEventListener('click',async e=>{
const button=e.target.closest('[data-fe-open-file]');if(!button)return;
const file=attachments.find(x=>x.id===button.dataset.feOpenFile);if(!file||!database)return;
button.disabled=true;
try{const signed=await database.storage.from('commercial-event-attachments').createSignedUrl(file.storage_path,60);
if(signed.error)throw signed.error;
const link=document.createElement('a');link.href=signed.data.signedUrl;link.target='_blank';link.rel='noopener noreferrer';document.body.append(link);link.click();link.remove()
}catch(error){const output=button.closest('details')?.querySelector('.fe-upload-feedback');if(output)output.textContent='Error al abrir: '+(error.message||'Error de conexión')}
finally{button.disabled=false}
});
host.addEventListener('change',e=>{if(e.target.id==='fe-year-closed'){yearClosed=Number(e.target.value);render()}});
host.addEventListener('submit',onSubmit);
show('inicio');
}
function visible(mark){for(const b of el('fe-commercial-main-nav').querySelectorAll('button'))b.setAttribute('aria-current',b.dataset.feSection===mark?'page':'false')}
function show(section){active=section;visible(section);el('fe-commercial-dashboard').hidden=false;el('fe-old-extras').hidden=section!=='otras';render()}
function validClosed(row){return row.event_date&&/^20\d{2}-\d{2}-\d{2}$/.test(row.event_date)}
function allClosedInYear(yr){return closed.filter(x=>Number(x.year)===yr&&validClosed(x)).sort((a,b)=>String(a.event_date).localeCompare(String(b.event_date)))}
function dateHuman(s){if(!s)return 'Sin fecha';const p=s.split('-');return p.length===3?p[2]+'/'+p[1]+'/'+p[0]:s}
function renderCalendar(){
 const first=new Date(calYear,calMonth,1),week=(first.getDay()+6)%7,last=new Date(calYear,calMonth+1,0).getDate();
 let html='<div class="fe-home-head"><div><h2>Calendario de eventos</h2><p class="fe-muted">Mes actual al acceder. Días azules: eventos anotados en el libro de cuentas; no se deduce por sí sola la formalización de cada reserva.</p></div><div class="fe-cal-controls"><button type="button" data-fe-month="-1">‹ Mes anterior</button><strong>'+monthNames[calMonth]+' '+calYear+'</strong><button type="button" data-fe-month="1">Mes siguiente ›</button></div></div>';
 html+='<div class="fe-month-calendar">'+['L','M','X','J','V','S','D'].map(d=>'<span class="fe-day-label">'+d+'</span>').join('');
 for(let i=0;i<week;i++)html+='<div></div>';
 const now=new Date();
 const byDay=new Map();
 for(const event of closed){if(!validClosed(event))continue;const from=event.event_date,to=event.account_values?.calendar_end_date||from;
  for(let day=1;day<=last;day++){const d=calYear+'-'+String(calMonth+1).padStart(2,'0')+'-'+String(day).padStart(2,'0');if(d<from||d>to)continue;if(!byDay.has(day))byDay.set(day,[]);byDay.get(day).push(event)}
 }
 for(let d=1;d<=last;d++){const list=byDay.get(d)||[],today=now.getFullYear()===calYear&&now.getMonth()===calMonth&&now.getDate()===d;html+='<div class="fe-day '+(list.length?'has-event ':'')+(today?'today':'')+'"><span class="fe-day-number">'+d+'</span>'+list.map(x=>'<small title="'+safe(x.venue||'')+'">'+safe(x.venue||'Sin lugar')+' · '+safe(x.client_label||'Cliente no indicado')+'</small>').join('')+'</div>'}
 html+='</div><p class="fe-muted">'+[...new Set([...byDay.values()].flat().map(x=>x.year+'-'+x.source_row))].length+' registros de eventos este mes · Fuente: Cuentas Flamenco Events 2026–2027.</p>';
 return html;
}
const uploadKinds={justificante_transferencia:'Justificante de transferencia',otros_documentos:'Otros documentos'};
function getAttachments(ref){return attachments.filter(a=>ref.eventId?a.event_id===ref.eventId:Number(a.catalog_year)===Number(ref.year)&&Number(a.catalog_source_row)===Number(ref.sourceRow))}
function attachmentsMarkup(ref){
const related=getAttachments(ref),data=ref.eventId?'data-fe-upload-event="'+safe(ref.eventId)+'"':'data-fe-upload-ledger="'+safe(ref.year)+'-'+safe(ref.sourceRow)+'"';
return '<details class="fe-card fe-attachment-panel"><summary><b>Adjuntar documentos</b> · '+related.length+' archivo(s)</summary><p class="fe-muted">Archivo privado para el equipo Comercial. No visible automáticamente para el cliente.</p>'+
'<form '+data+'><label>Tipo de documento<select name="kind" required><option value="justificante_transferencia">Justificante de transferencia</option><option value="otros_documentos">Otros documentos</option></select></label>'+
'<label>Adjuntar archivo del dispositivo<input name="file" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp" required></label>'+
'<p class="fe-muted">PDF, JPG, PNG o WebP. Máximo 10 MB.</p><button type="submit">Guardar documento</button><p role="status" class="fe-upload-feedback"></p></form>'+
'<div class="fe-uploaded-list">'+(related.length?related.map(a=>'<p><b>'+safe(uploadKinds[a.kind]||a.kind)+'</b> · '+safe(a.original_filename)+' · '+new Date(a.created_at).toLocaleDateString('es-ES')+' <button type="button" class="fe-alt" data-fe-open-file="'+safe(a.id)+'">Abrir archivo</button></p>').join(''):'<p class="fe-muted">No hay archivos adjuntos.</p>')+'</div></details>'
}
function artistAssignmentsMarkup(ref,quoteNumber){
const relevant=artistAssignments.filter(a=>ref.eventId?a.event_id===ref.eventId:Number(a.catalog_year)===Number(ref.year)&&Number(a.catalog_source_row)===Number(ref.sourceRow));
const attr=ref.eventId?'data-fe-assign-event="'+safe(ref.eventId)+'"':'data-fe-assign-ledger="'+safe(ref.year)+'-'+safe(ref.sourceRow)+'"';
const options=artistRoster.filter(a=>a.active).map(a=>'<option value="'+safe(a.id)+'">'+safe(a.display_name)+' · '+safe(a.specialty||'Sin especialidad')+'</option>').join('');
return '<details class="fe-card fe-artist-panel"><summary><b>Artistas del evento</b> · '+relevant.length+' asignado(s)</summary>'+
'<p class="fe-muted">El caché de gastos globales no establece sueldos individuales. El sueldo procede de las partidas económicas verificadas del presupuesto; hasta su conciliación, aparece como pendiente. Esta información es privada del equipo.</p>'+
'<div class="fe-list">'+(relevant.length?relevant.map(a=>{const artist=artistRoster.find(x=>x.id===a.artist_id);return '<p><b>'+safe(artist?.display_name||'Artista sin nombre')+'</b> · '+safe(a.role_in_event||artist?.specialty||'Función pendiente')+' · <span class="fe-badge">'+(verifiedArtistFees.find(cost=>cost.artist_id===a.artist_id&&cost.quote_number===a.quote_number)?Number(verifiedArtistFees.find(cost=>cost.artist_id===a.artist_id&&cost.quote_number===a.quote_number).fee_eur).toLocaleString('es-ES',{style:'currency',currency:'EUR'})+' · coste del presupuesto '+safe(a.quote_number):'Sueldo pendiente de partida individual verificada')+'</span></p>'}).join(''):'<p class="fe-muted">Todavía no hay artistas asignados.</p>')+'</div>'+
'<form '+attr+'><label>Seleccionar artista<select name="artist_id" required><option value="">Selecciona un artista…</option>'+options+'</select></label><label>Función en el evento<input name="role_in_event" maxlength="160" placeholder="Guitarra, cante, baile, percusión…"></label><p class="fe-muted">Referencia del presupuesto: '+safe(quoteNumber||'No identificada')+'. No se aplica un sueldo sin coste individual acreditado.</p><button type="submit">Asignar artista</button><p class="fe-artist-feedback" role="status"></p></form>'+
'<details><summary>¿No aparece el artista? Añadir al catálogo</summary><form data-fe-add-artist><label>Nombre del artista<input name="display_name" maxlength="160" required minlength="2"></label><label>Especialidad<input name="specialty" maxlength="120" placeholder="Guitarra flamenca, cante, baile…"></label><button type="submit">Añadir artista al catálogo</button><p class="fe-artist-feedback" role="status"></p></form></details></details>';
}
function renderClosed(){let options=[2026,2027].map(y=>'<option value="'+y+'"'+(yearClosed===y?' selected':'')+'>'+y+'</option>').join('');
let html='<h2>Fechas cerradas</h2><p class="fe-muted">Listado del libro de eventos con acceso a los documentos disponibles. La importación del libro no acredita por sí sola firma o cobro.</p><div class="fe-toolbar"><label>Año <select id="fe-year-closed">'+options+'</select></label><span class="fe-badge">'+allClosedInYear(yearClosed).length+' registros</span></div><div class="fe-list">';
const arr=allClosedInYear(yearClosed);for(const x of arr){const links=[docLink(x.quotation_url,'Presupuesto'),docLink(x.contract_url,'Contrato'),docLink(x.source_link,'Libro original')].filter(Boolean).join(' · ');html+='<article class="fe-card"><h3>'+safe(x.venue||'Lugar sin identificar')+'</h3><p><b>'+dateHuman(x.event_date)+'</b> · '+safe(x.client_label||'Cliente sin indicar')+'</p><p class="fe-muted">N.º '+safe(x.quote_number||'—')+' · '+safe(x.schedule||'Sin horario')+'</p>'+(links?'<p>'+links+'</p>':'<p class="fe-muted">Sin enlaces de documentos en el catálogo actual</p>')+attachmentsMarkup({year:x.year,sourceRow:x.source_row})+artistAssignmentsMarkup({year:x.year,sourceRow:x.source_row},x.quote_number)+'</article>'}return html+(arr.length?'':'<p>No hay eventos importados para este año.</p>')+'</div>'}
function formatRequest(r){return 'SOLICITUD DE '+r.kind.toUpperCase()+' · Flamenco Events\nCliente: '+r.client_name+'\nLugar: '+r.venue+'\nFecha: '+(r.event_date||'Pendiente')+'\nServicio y datos: '+(r.event_description||'Pendiente de concretar')+'\nNotas: '+(r.request_notes||'—')+'\nID interno: '+r.id}
function renderRequest(kind){return '<h2>Nuevo '+(kind==='presupuesto'?'presupuesto':'contrato')+'</h2><div class="fe-status"><b>Solicitud interna, sin envío automático.</b> Se conserva la lógica comercial actual: Azahara revisa los datos y autoriza presupuestos. Este formulario registra la petición; todavía no se ha conectado de forma segura la entrega al grupo de WhatsApp ni la generación del documento de Canva. No se enviará nada por error.</div><form class="fe-card" data-fe-request="'+kind+'"><label>Cliente<input name="client_name" required maxlength="160" placeholder="Nombre o empresa"></label><label>Lugar<input name="venue" required maxlength="200" placeholder="Establecimiento o localidad"></label><label>Fecha del evento<input type="date" name="event_date"></label><label>Servicio, artistas, pases y duración<textarea name="event_description" required maxlength="5000" placeholder="Formación exacta; si son varios servicios, importes separados o total único."></textarea></label><div class="fe-fields"><label>Tipo de cliente<select name="client_type"><option>Particular</option><option>Empresa</option></select></label><label>Comisión wedding<select name="commission"><option>No</option><option>Sí · 10%</option></select></label><label>Sonido e iluminación<select name="sound"><option>Por determinar</option><option>Sí</option><option>No</option></select></label><label>Tarima<select name="stage"><option>No</option><option>Sí</option><option>Por determinar</option></select></label><label>Transporte<select name="transport"><option>Coche</option><option>Avión</option><option>Por determinar</option></select></label><label>Importe acordado o referencia<input name="price" placeholder="Por calcular"></label><label>Número de presupuesto anterior (contratos)<input name="quote_number" placeholder="Si ya existe"></label></div><label>Desplazamientos, noches, dietas, extras, IVA / IRPF y condiciones<textarea name="request_notes" maxlength="3000" placeholder="Km, coches, gasolina, avión, hotel, dietas, peajes, comisión, detalles de factura..."></textarea></label><button type="submit">Registrar solicitud</button></form><h3>Solicitudes registradas</h3><p id="fe-action-note" role="status"></p><div class="fe-list">'+requests.filter(x=>x.kind===kind).map(r=>'<article class="fe-card"><h3>'+safe(r.client_name)+'</h3><p>'+safe(r.venue)+' · '+dateHuman(r.event_date)+'</p><span class="fe-badge">'+safe(r.status)+'</span><p class="fe-muted">Registrada: '+new Date(r.created_at).toLocaleDateString('es-ES')+'</p><button type="button" data-fe-copy="'+safe(r.id)+'">Copiar solicitud para WhatsApp</button></article>').join('')+'</div>'}
function renderSent(){
const arr=quotes.filter(x=>x.commercial_status==='ENVIADO'&&!x.is_test);
let html='<h2>Presupuestos enviados · No cerrados</h2><p class="fe-muted">Se muestran únicamente los presupuestos registrados como ENVIADO en el seguimiento comercial. La ausencia de una fila no equivale a que un presupuesto esté cerrado.</p><div class="fe-list">';
for(const x of arr){html+='<article class="fe-card"><h3>'+safe(x.client_label||'Cliente por identificar')+'</h3><p>'+safe(x.venue||'Lugar pendiente')+' · '+dateHuman(x.event_date)+'</p><p>Presupuesto '+safe(x.quote_number||'—')+' · Enviado: '+dateHuman(x.sent_at?.slice(0,10))+'</p><p>'+safe(x.reminder_status||'Sin aviso')+(x.expires_at?' · Vence '+dateHuman(x.expires_at.slice(0,10)):'')+'</p>'+docLink(x.pdf_url,'Consultar presupuesto')+'</article>'}
return html+(arr.length?'':'<p>No constan presupuestos abiertos sincronizados en el seguimiento comercial.</p>')+'</div>'}
function renderClients(){
const confirmed=clientEvents.filter(x=>x.status!=='cancelled'&&!x.is_test);
let html='<h2>Nuestros clientes</h2><p class="fe-muted">Eventos del portal privado ya aceptados (incluye los pendientes de contrato y confirmación). No se muestran como reserva formal hasta que el estado lo acredite.</p>';
html+='<div class="fe-list">';
for(const ev of confirmed){html+='<article class="fe-card"><h3>'+safe(ev.title||'Evento')+'</h3><p>'+safe(ev.venue||'Lugar no registrado')+' · '+dateHuman(ev.event_date)+'</p><p><span class="fe-badge">'+safe(ev.status)+'</span></p><button type="button" data-fe-client="'+safe(ev.id)+'">Ver y actualizar ficha del cliente</button></article>'}
html+=(confirmed.length?'':'<p>Aún no hay eventos de clientes reales vinculados al portal. La relación histórica importada aparece a continuación.</p>')+'</div>';const historical=closed.filter(x=>validClosed(x)).sort((a,b)=>String(b.event_date).localeCompare(String(a.event_date)));html+='<details class="fe-card"><summary><b>Eventos del libro de cuentas (2026–2027) · '+historical.length+'</b></summary><p class="fe-muted">No todos tienen cliente autenticado ni espacio privado asociado. Conservamos los documentos y no afirmamos que estén firmados.</p><div class="fe-list">'+historical.map(x=>'<article class="fe-card"><b>'+safe(x.venue||'Lugar sin identificar')+'</b><p>'+dateHuman(x.event_date)+' · '+safe(x.client_label||'Cliente sin indicar')+'</p><p>'+[docLink(x.quotation_url,'Presupuesto'),docLink(x.contract_url,'Contrato'),docLink(x.source_link,'Fuente')].filter(Boolean).join(' · ')+'</p><p class="fe-muted">Sin enlace a espacio cliente mientras no exista una vinculación validada.</p>'+attachmentsMarkup({year:x.year,sourceRow:x.source_row})+artistAssignmentsMarkup({year:x.year,sourceRow:x.source_row},x.quote_number)+'</article>').join('')+'</div></details>';
if(selectedClient){const ev=confirmed.find(x=>x.id===selectedClient);if(ev)html+='<section class="fe-card"><h2>Ficha privada · '+safe(ev.title||'Evento')+'</h2><p class="fe-muted">Vista de coordinación de los campos del espacio cliente. No se suplanta la sesión del cliente ni se permite acceder a sus mensajes personales como si fueras él.</p><form data-fe-event="'+safe(ev.id)+'"><div class="fe-fields"><label>Repertorio<textarea name="repertoire" maxlength="3000">'+safe(ev.repertoire||'')+'</textarea></label><label>Vestuario<textarea name="wardrobe" maxlength="3000">'+safe(ev.wardrobe||'')+'</textarea></label><label>Horarios y notas<textarea name="schedule_notes" maxlength="3000">'+safe(ev.schedule_notes||'')+'</textarea></label><label>Contacto in situ<input name="onsite_contact" maxlength="300" value="'+safe(ev.onsite_contact||'')+'"></label></div><p class="fe-details">'+docLink(ev.quotation_url,'Presupuesto')+docLink(ev.contract_url,'Contrato')+'</p><button type="submit">Guardar actualización de coordinación</button> <button type="button" class="fe-alt" data-fe-client="">Cerrar ficha</button><p id="fe-update-feedback" role="status"></p></form><p class="fe-muted">Las modificaciones guardadas en estos campos quedan disponibles para el cliente en su portal, según los permisos y funciones existentes.</p>'+
attachmentsMarkup({eventId:ev.id})+artistAssignmentsMarkup({eventId:ev.id},quoteTerms.find(t=>t.id===ev.quote_terms_id)?.quote_number||'Pendiente de consulta')+'<h3>Información adicional visible en el portal del cliente</h3>'+
'<p><b>Tareas:</b> '+(portalTasks.filter(x=>x.event_id===ev.id).map(x=>(x.completed?'✓ ':'○ ')+safe(x.title)).join(' · ')||'Sin tareas registradas')+'</p>'+
'<p><b>Pagos programados:</b> '+(portalPayments.filter(x=>x.event_id===ev.id).map(x=>safe(x.label)+' · '+Number(x.amount_eur||0).toLocaleString('es-ES')+' € · '+safe(x.status)).join(' | ')||'Sin pagos registrados')+'</p>'+
'<p><b>Contrato:</b> '+(portalContracts.filter(x=>x.event_id===ev.id).map(x=>safe(x.state)+(x.signed_at?' · firmado '+dateHuman(x.signed_at.slice(0,10)):'')).join(' · ')||'No consta contrato en el portal')+'</p>'+
'<p><b>Documentos internos vinculados:</b> '+portalDocuments.filter(x=>x.event_id===ev.id).map(x=>safe(x.kind)+' (v'+safe(x.version)+')').join(' · ')+'</p>'+
'<h3>Solicitudes de cambio del cliente</h3>'+(portalChanges.filter(x=>x.event_id===ev.id).map(x=>'<p class="fe-card">'+safe(x.topic)+' · '+safe(x.status)+'<br>'+safe(x.details)+'</p>').join('')||'<p>Sin solicitudes registradas.</p>')+
'<h3>Mensajes registrados</h3>'+(portalMessages.filter(x=>x.event_id===ev.id).map(x=>'<p class="fe-card"><small>'+safe(x.created_at?.slice(0,10)||'')+'</small><br>'+safe(x.message)+'</p>').join('')||'<p>Sin mensajes registrados.</p>')+
'</section>'}
return html}
function render(){const host=el('fe-commercial-dashboard');if(!host)return;if(active==='inicio')host.innerHTML=renderCalendar();if(active==='fechas')host.innerHTML=renderClosed();if(active==='presupuesto'||active==='contrato')host.innerHTML=renderRequest(active);if(active==='enviados')host.innerHTML=renderSent();if(active==='clientes')host.innerHTML=renderClients();if(active==='otras')host.innerHTML='<h2>Funciones adicionales</h2><p class="fe-muted">Acceso al sistema previo de solicitudes, mensajes, tareas, avisos, cambios solicitados y herramientas auxiliares. Este apartado mantiene los controles existentes.</p>';}
async function onSubmit(e){const form=e.target.closest('[data-fe-request],[data-fe-event],[data-fe-upload-event],[data-fe-upload-ledger],[data-fe-assign-event],[data-fe-assign-ledger],[data-fe-add-artist]');if(!form)return;e.preventDefault();const button=form.querySelector('button[type=submit]');button.disabled=true;
try{
if(form.hasAttribute('data-fe-add-artist')){
const row={display_name:form.elements.display_name.value.trim(),specialty:form.elements.specialty.value.trim()||'Por determinar',created_by:actor.id};
const response=await database.from('fe_artist_roster').insert(row).select('*').single();
if(response.error)throw response.error;
artistRoster.push(response.data);artistRoster.sort((a,b)=>a.display_name.localeCompare(b.display_name,'es'));
render();const notes=document.querySelectorAll('.fe-artist-feedback');const note=notes[notes.length-1];if(note)note.textContent='Artista añadido al catálogo; ya puede seleccionarse en los eventos.';
return
}
if(form.hasAttribute('data-fe-assign-event')||form.hasAttribute('data-fe-assign-ledger')){
const row={artist_id:form.elements.artist_id.value,role_in_event:form.elements.role_in_event.value.trim(),quote_number:'',payment_amount_eur:null,payment_status:'Pendiente de presupuesto',assigned_by:actor.id};
if(form.dataset.feAssignEvent){row.event_id=form.dataset.feAssignEvent;const ev=clientEvents.find(e=>e.id===row.event_id);row.quote_number=quoteTerms.find(t=>t.id===ev?.quote_terms_id)?.quote_number||''}
else{const parts=form.dataset.feAssignLedger.split('-');row.catalog_year=Number(parts[0]);row.catalog_source_row=Number(parts[1]);const ev=closed.find(e=>Number(e.year)===row.catalog_year&&Number(e.source_row)===row.catalog_source_row);row.quote_number=ev?.quote_number||''}
if(!row.artist_id)throw Error('Selecciona un artista de la lista.');
const response=await database.from('fe_artist_assignments').insert(row).select('*').single();
if(response.error)throw response.error;
artistAssignments.push(response.data);
render();const ref=row.event_id?'event-'+row.event_id:'ledger-'+row.catalog_year+'-'+row.catalog_source_row;
for(const panel of document.querySelectorAll('.fe-artist-panel')){const form=panel.querySelector('[data-fe-assign-event],[data-fe-assign-ledger]');if(!form)continue;const key=form.dataset.feAssignEvent?'event-'+form.dataset.feAssignEvent:'ledger-'+form.dataset.feAssignLedger;if(key===ref){panel.open=true;const feedback=panel.querySelector('.fe-artist-feedback');if(feedback)feedback.textContent='Artista asignado. Sueldo pendiente de vinculación económica.'}}
return
}
if(form.hasAttribute('data-fe-upload-event')||form.hasAttribute('data-fe-upload-ledger')){
const ref={};
if(form.dataset.feUploadEvent)ref.event_id=form.dataset.feUploadEvent;
else{const parts=form.dataset.feUploadLedger.split('-');ref.catalog_year=Number(parts[0]);ref.catalog_source_row=Number(parts[1])}
const file=form.elements.file.files?.[0],kind=form.elements.kind.value,feedback=form.querySelector('.fe-upload-feedback');
if(!file)throw Error('Selecciona un archivo.');
const mime=file.type,ext=(file.name.split('.').pop()||'').toLowerCase(),mapping={pdf:'application/pdf',jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp'};
if(mapping[ext]!==mime)throw Error('Formato no permitido. Utiliza PDF, JPG, PNG o WebP.');
if(file.size<1||file.size>10485760)throw Error('El archivo debe ocupar como máximo 10 MB.');
if(!Object.prototype.hasOwnProperty.call(uploadKinds,kind))throw Error('Selecciona el tipo de documento.');
const prefix=ref.event_id||('ledger-'+ref.catalog_year+'-'+ref.catalog_source_row);
const storagePath=prefix+'/'+crypto.randomUUID()+'.'+ext;
feedback.textContent='Subiendo documento…';
const uploaded=await database.storage.from('commercial-event-attachments').upload(storagePath,file,{contentType:mime,cacheControl:'3600',upsert:false});
if(uploaded.error)throw uploaded.error;
const row={...ref,kind,original_filename:file.name.slice(0,220),storage_path:storagePath,mime_type:mime,size_bytes:file.size,uploaded_by:actor.id};
const saved=await database.from('commercial_event_attachments').insert(row).select('*').single();
if(saved.error)throw Error('Archivo subido pero sin registrar en la ficha. Avisa a administración: '+saved.error.message);
attachments.unshift(saved.data);
render();
const key=ref.event_id?'event-'+ref.event_id:'ledger-'+ref.catalog_year+'-'+ref.catalog_source_row;
for(const panel of document.querySelectorAll('.fe-attachment-panel')){const uploadForm=panel.querySelector('form');if(!uploadForm)continue;const panelKey=uploadForm.dataset.feUploadEvent?'event-'+uploadForm.dataset.feUploadEvent:'ledger-'+uploadForm.dataset.feUploadLedger;
if(panelKey===key){panel.open=true;const msg=panel.querySelector('.fe-upload-feedback');if(msg)msg.textContent='Documento guardado de forma privada.'}}
return
}
if(form.dataset.feRequest){const d=new FormData(form);const record={kind:form.dataset.feRequest,client_name:String(d.get('client_name')||'').trim(),venue:String(d.get('venue')||'').trim(),event_date:d.get('event_date')||null,event_description:String(d.get('event_description')||'').trim(),request_notes:['Cliente: '+String(d.get('client_type')||''),'Comisión: '+String(d.get('commission')||''),'Sonido: '+String(d.get('sound')||''),'Tarima: '+String(d.get('stage')||''),'Transporte: '+String(d.get('transport')||''),'Importe referencia: '+String(d.get('price')||''),'Presupuesto anterior: '+String(d.get('quote_number')||''),'Otros datos: '+String(d.get('request_notes')||'')].join('\n').slice(0,3000),created_by:actor.id};const result=await database.from('commercial_document_requests').insert(record).select('*').single();if(result.error)throw result.error;requests.unshift(result.data);render();const n=el('fe-action-note');if(n)n.textContent='Solicitud registrada, pendiente de envío a WhatsApp. Ningún documento ha sido enviado ni generado.';return}
if(form.dataset.feEvent){const id=form.dataset.feEvent,ev=clientEvents.find(x=>x.id===id);if(!ev)return;const d=new FormData(form);const fields={};for(const k of ['repertoire','wardrobe','schedule_notes','onsite_contact'])fields[k]=String(d.get(k)||'').trim();const result=await database.from('events').update(fields).eq('id',id).select('id,repertoire,wardrobe,schedule_notes,onsite_contact').single();if(result.error)throw result.error;Object.assign(ev,result.data);render();const n=el('fe-update-feedback');if(n)n.textContent='Cambios guardados correctamente. Revisa los datos antes de comunicárselos al cliente.'}}
catch(error){const n=form.querySelector('.fe-artist-feedback')||form.querySelector('.fe-upload-feedback')||el('fe-update-feedback')||el('fe-action-note');if(n)n.textContent='Error al guardar: '+(error.message||'Error de conexión');else alert('No se pudo guardar: '+error.message)}
finally{button.disabled=false}
}
async function load(a,r){actor=a;role=r;if(!database||!a)return;const results=await Promise.all([
database.from('accounts_event_catalog').select('year,source_row,event_date,venue,client_label,schedule,quote_number,source_link,quotation_url,contract_url,account_values').in('year',[2026,2027]).limit(1000),
database.from('fe_quote_followups').select('source_key,quote_number,client_label,venue,event_date,commercial_status,sent_at,expires_at,reminder_status,pdf_url,is_test').limit(1000),
database.from('events').select('id,title,venue,event_date,status,is_test,quotation_url,contract_url,wardrobe,repertoire,schedule_notes,onsite_contact,quote_terms_id').limit(1000),
database.from('commercial_document_requests').select('*').order('created_at',{ascending:false}).limit(300),
database.from('event_tasks').select('event_id,title,completed').limit(1000),
database.from('event_payment_schedule').select('event_id,label,amount_eur,status,due_on').limit(1000),
database.from('event_contracts').select('event_id,state,signed_at').limit(1000),
database.from('event_change_requests').select('event_id,topic,status,details').limit(1000),
database.from('event_messages').select('event_id,created_at,message').limit(1000),
database.from('event_documents').select('event_id,kind,version').limit(1000),
database.from('commercial_event_attachments').select('id,event_id,catalog_year,catalog_source_row,kind,original_filename,storage_path,created_at').order('created_at',{ascending:false}).limit(1000),
database.from('fe_artist_roster').select('id,display_name,specialty,active').order('display_name').limit(1000),
database.from('fe_artist_assignments').select('id,artist_id,event_id,catalog_year,catalog_source_row,role_in_event,quote_number,payment_amount_eur,payment_source,payment_status').limit(1000),
database.from('fe_quote_artist_cost_lines').select('quote_number,artist_id,fee_eur,source_reference').limit(1000),
database.from('accepted_quote_terms').select('id,quote_number').limit(1000)
]);const names=['fechas','presupuestos','clientes','solicitudes','tareas cliente','pagos cliente','contratos cliente','cambios cliente','mensajes cliente','documentos cliente','adjuntos comerciales','catálogo de artistas','asignaciones de artistas','costes individuales verificados','referencias de presupuestos'];const errors=[];results.forEach((x,i)=>{if(x.error)errors.push(names[i]+': '+x.error.message)});
closed=results[0].data||[];quotes=results[1].data||[];clientEvents=results[2].data||[];requests=results[3].data||[];portalTasks=results[4].data||[];portalPayments=results[5].data||[];portalContracts=results[6].data||[];portalChanges=results[7].data||[];portalMessages=results[8].data||[];portalDocuments=results[9].data||[];attachments=results[10].data||[];artistRoster=results[11].data||[];artistAssignments=results[12].data||[];verifiedArtistFees=results[13].data||[];quoteTerms=results[14].data||[];
const info=el('fe-commercial-alert');if(info)info.textContent=errors.length?'No se pudieron consultar algunos datos: '+errors.join(' | '):'';
render();
}
function openLedger(year,sourceRow){
 yearClosed=Number(year);active='fechas';visible('fechas');el('fe-commercial-dashboard').hidden=false;el('fe-old-extras').hidden=true;render();
 const form=[...document.querySelectorAll('[data-fe-assign-ledger]')].find(x=>x.dataset.feAssignLedger===year+'-'+sourceRow);
 if(form){const panel=form.closest('details');if(panel)panel.open=true;panel.scrollIntoView({behavior:'smooth',block:'center'});}
}
root.FECommercialDashboard={init,load,openLedger};
})(window);
