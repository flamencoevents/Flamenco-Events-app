/* Calendario privado de eventos 2026 y 2027 · Flamenco Events.
 * Fuente: accounts_event_catalog (importación de Cuentas FE), de solo lectura.
 */
(function(root){
 'use strict';
 const pad=n=>String(n).padStart(2,'0');
 const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const months=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
 const days=['L','M','X','J','V','S','D'];
 const validDate=d=>typeof d==='string'&&/^202[67]-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/.test(d)&&new Date(d+'T12:00:00Z').toISOString().slice(0,10)===d;
 const isEvent=row=>[2026,2027].includes(Number(row.year))&&validDate(row.event_date);
 const formatted=iso=>iso.split('-').reverse().join('/');
 function renderMonth(rows,year,month,selected){
  const first=(new Date(Date.UTC(year,month,1)).getUTCDay()+6)%7;
  const last=new Date(Date.UTC(year,month+1,0)).getUTCDate();
  const byDay=new Map();
  for(const r of rows){const start=r.event_date,end=r.account_values?.calendar_end_date||start;for(let d=1;d<=last;d++){const day=year+'-'+pad(month+1)+'-'+pad(d);if(day<start||day>end)continue;if(!byDay.has(d))byDay.set(d,[]);byDay.get(d).push(r);}}
  let html='<div class="fe-cal-grid" role="grid" aria-label="Calendario de '+months[month]+' de '+year+'">'+
   days.map(x=>'<div class="fe-cal-weekday" role="columnheader">'+x+'</div>').join('');
  for(let i=0;i<first;i++)html+='<div class="fe-cal-empty" aria-hidden="true"></div>';
  for(let d=1;d<=last;d++){
   const iso=year+'-'+pad(month+1)+'-'+pad(d),items=byDay.get(d)||[],active=iso===selected;
   const label=d+' de '+months[month].toLowerCase()+' de '+year+(items.length?'; '+items.length+' evento'+(items.length===1?'':'s'):'; sin eventos');
   html+='<button type="button" class="fe-cal-day'+(items.length?' fe-cal-event':'')+(active?' fe-cal-selected':'')+'" data-fe-date="'+iso+'" aria-label="'+safe(label)+'" aria-pressed="'+active+'">'+d+(items.length?'<span class="fe-cal-count">'+items.length+'</span>':'')+'</button>';
  }
  return html+'</div>';
 }
 function renderDetails(rows,date){
  const selected=rows.filter(x=>x.event_date<=date&&(x.account_values?.calendar_end_date||x.event_date)>=date);
  if(!selected.length)return '<div class="fe-cal-details"><h3>'+formatted(date)+'</h3><p>Sin eventos registrados en esta fecha.</p></div>';
  return '<div class="fe-cal-details"><h3>'+formatted(date)+' · '+selected.length+' evento'+(selected.length>1?'s':'')+'</h3>'+
   selected.map(r=>'<article class="fe-cal-detail"><strong>'+safe(r.client_label?.trim()||'Cliente no indicado')+'</strong><p><span>Lugar:</span> '+safe(r.venue?.trim()||'No indicado')+'</p>'+(r.schedule?'<p><span>Horario:</span> '+safe(r.schedule)+'</p>':'')+'</article>').join('')+'</div>';
 }
 function create(db){
  let rows=[],year=2026,month=0,selected='',initialized=false,loading=false,host=null,button=null,ticket=0;
  const now=new Date();year=now.getFullYear()===2027?2027:2026;month=year===now.getFullYear()?now.getMonth():0;
  function draw(){
   if(!host)return;
   host.querySelector('[data-fe-cal-title]').textContent=months[month]+' '+year;
   host.querySelector('[data-fe-cal-prev]').disabled=year===2026&&month===0;
   host.querySelector('[data-fe-cal-next]').disabled=year===2027&&month===11;
   host.querySelector('[data-fe-cal-year]').value=String(year);
   host.querySelector('[data-fe-cal-month]').innerHTML=renderMonth(rows,year,month,selected);
   host.querySelector('[data-fe-cal-detail]').innerHTML=selected?renderDetails(rows,selected):'<p>Selecciona un día azul para consultar el cliente y el lugar de cada evento.</p>';
   const firstDay=year+'-'+pad(month+1)+'-01',lastDay=year+'-'+pad(month+1)+'-'+pad(new Date(Date.UTC(year,month+1,0)).getUTCDate());const total=rows.filter(r=>r.event_date<=lastDay&&(r.account_values?.calendar_end_date||r.event_date)>=firstDay).length;
   host.querySelector('[data-fe-cal-summary]').textContent=total+' evento'+(total===1?'':'s')+' registrados este mes · Fuente: Cuentas Flamenco Events (lectura importada de 2026 y 2027).';
  }
  function navigate(delta){let n=year*12+month+delta;if(n<2026*12||n>2027*12+11)return;year=Math.floor(n/12);month=n%12;selected='';draw();}
  function close(){if(!host)return;host.hidden=true;button?.focus();}
  async function open(){
   if(!host)return;host.hidden=false;
   if(!initialized&&!loading){
    loading=true;host.querySelector('[data-fe-cal-summary]').textContent='Cargando eventos privados…';
    const current=++ticket;
    try{
     const auth=await db.auth.getUser();
     if(!auth.data?.user)throw Error('Debes iniciar sesión');
     const [a,b]=await Promise.all([db.from('accounts_event_catalog').select('year,source_row,event_date,client_label,venue,schedule,account_values').eq('year',2026).order('event_date').limit(1000),db.from('accounts_event_catalog').select('year,source_row,event_date,client_label,venue,schedule').eq('year',2027).order('event_date').limit(1000)]);
     if(a.error||b.error)throw (a.error||b.error);
     if(ticket!==current)return;
     rows=[...(a.data||[]),...(b.data||[])].filter(isEvent);
     initialized=true;
     // No completar campos vacíos con datos de otras columnas sin comprobar el libro.
     draw();
    }catch(e){host.querySelector('[data-fe-cal-summary]').textContent='No se han podido consultar los eventos. Comprueba tu sesión y vuelve a abrir el calendario.';}
    finally{loading=false;}
   }else if(initialized)draw();
   host.querySelector('[data-fe-cal-close]').focus();
  }
  function mount(id){
   host=document.getElementById(id);button=document.querySelector('[data-fe-calendar-button]');
   if(!host||!button)return;
   const monthOptions=[2026,2027].map(x=>'<option value="'+x+'">'+x+'</option>').join('');
   host.innerHTML='<div class="fe-cal-backdrop" data-fe-cal-close-backdrop></div><section class="fe-cal-dialog" role="dialog" aria-modal="true" aria-labelledby="fe-cal-heading">'+
    '<div class="fe-cal-head"><div><h2 id="fe-cal-heading">Calendario de eventos</h2><p>Flamenco Events · 2026 y 2027</p></div><button class="fe-cal-close" type="button" data-fe-cal-close aria-label="Cerrar calendario">Cerrar ×</button></div>'+
    '<div class="fe-cal-tools"><button type="button" data-fe-cal-prev aria-label="Mes anterior">‹</button><strong data-fe-cal-title></strong><button type="button" data-fe-cal-next aria-label="Mes siguiente">›</button><label>Año <select data-fe-cal-year>'+monthOptions+'</select></label></div>'+
    '<div data-fe-cal-month></div><p class="fe-cal-legend"><span class="fe-cal-dot"></span> Azul: día con evento</p><div data-fe-cal-detail class="fe-cal-details"></div><p data-fe-cal-summary class="fe-cal-summary"></p></section>';
   host.hidden=true;
   button.addEventListener('click',open);
   host.addEventListener('click',e=>{
    if(e.target.closest('[data-fe-cal-close]')||e.target.matches('[data-fe-cal-close-backdrop]')){close();return;}
    if(e.target.closest('[data-fe-cal-prev]')){navigate(-1);return;}
    if(e.target.closest('[data-fe-cal-next]')){navigate(1);return;}
    const day=e.target.closest('[data-fe-date]');if(day){selected=day.dataset.feDate;draw();}
   });
   host.querySelector('[data-fe-cal-year]').addEventListener('change',e=>{year=Number(e.target.value);selected='';draw();});
   document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!host.hidden)close();});
  }
  function clear(){++ticket;initialized=false;rows=[];if(host)host.hidden=true;}
  return {mount,clear};
 }
 root.FECalendar={create,renderMonth,renderDetails,isEvent};
})(window);
