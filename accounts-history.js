/* Historical sheet snapshots. Authorization remains in database grants/RLS. */
(function(root){
 'use strict';
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function sheetHtml(rows){
  if(!rows.length)return '<p>Esta hoja no contiene datos.</p>';
  const columns=[...new Set(rows.flatMap(r=>r.cells.map(c=>c.column)))].sort((a,b)=>a.length-b.length||a.localeCompare(b));
  const value=c=>c?.formattedValue??c?.effectiveValue?.stringValue??c?.effectiveValue?.numberValue??c?.effectiveValue?.boolValue??'';
  return '<div class="history-scroll" tabindex="0" role="region" aria-label="Celdas del libro; desliza para ver todas las columnas"><table class="history-table"><caption>Valores guardados del libro · sin recálculo</caption><thead><tr><th scope="col">Fila</th>'+columns.map(c=>'<th scope="col">'+esc(c)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(row=>'<tr><th scope="row">'+esc(row.row)+'</th>'+columns.map(col=>{const cell=row.cells.find(c=>c.column===col)?.data;const formula=cell?.userEnteredValue?.formulaValue;return '<td>'+esc(value(cell))+(formula?'<details><summary>Fórmula original</summary><code>'+esc(formula)+'</code></details>':'')+(cell?.note?'<small>Nota: '+esc(cell.note)+'</small>':'')+(root.FEAccounts?.safeUrl(cell?.hyperlink)?'<a target="_blank" rel="noopener noreferrer" href="'+esc(root.FEAccounts.safeUrl(cell.hyperlink))+'">Documento del libro</a>':'')+'</td>';}).join('')+'</tr>').join('')+'</tbody></table></div>';
 }
 function clear(){const h=document.getElementById('accounts-history');if(h){h._historyTicket=(h._historyTicket||0)+1;h.innerHTML='';}}
 async function mount(db,role){
  const host=document.getElementById('accounts-history');if(!host)return;clear();if(!['admin','sales'].includes(role))return;
  const ticket=host._historyTicket;let actor;
  const current=async()=>{const a=await db.auth.getUser();return host._historyTicket===ticket&&a.data?.user?.id===actor;};
  try{
   actor=(await db.auth.getUser()).data?.user?.id;if(!actor||host._historyTicket!==ticket)return;
   const response=await db.from('accounts_source_sheet_catalog').select('source_key,sheet_id,sheet_title,source_url,source_modified_at,imported_at').eq('source_key','accounts-2025-2026').order('sheet_index');
   if(!await current())return;if(response.error)throw response.error;
   const sheets=response.data||[];if(!sheets.length)return;
   host.innerHTML='<h2>Libro histórico completo · 2025/2026</h2><p>Consulta de las '+sheets.length+' hojas originales: eventos, cierre, IVA y gastos/ingresos. Se conservan los valores, fórmulas, notas y enlaces guardados. No son balances calculados por la web.</p><p>La fila con fecha de 2024 de la hoja de 2025 se conserva aquí; no se ha cambiado su año.</p><label>Hoja del libro<select data-history-sheet>'+sheets.map(s=>'<option value="'+esc(s.sheet_id)+'">'+esc(s.sheet_title)+'</option>').join('')+'</select></label><p data-history-source></p><p role="status" data-history-status></p><div data-history-output></div>';
   const select=host.querySelector('[data-history-sheet]'),out=host.querySelector('[data-history-output]'),status=host.querySelector('[data-history-status]');let loadId=0;
   async function load(){const id=++loadId,selected=sheets.find(s=>String(s.sheet_id)===select.value);out.innerHTML='';status.textContent='Cargando hoja privada…';
    try{const r=await db.from('accounts_source_sheet_catalog').select('cells').eq('source_key',selected.source_key).eq('sheet_id',selected.sheet_id).single();
     if(!await current()||id!==loadId)return;if(r.error)throw r.error;
     out.innerHTML=sheetHtml(r.data.cells);status.textContent=r.data.cells.length+' filas con contenido · Copia de consulta, sin sincronización automática.';
     const u=root.FEAccounts?.safeUrl(selected.source_url);host.querySelector('[data-history-source]').innerHTML=(u?'<a target="_blank" rel="noopener noreferrer" href="'+esc(u)+'">Abrir esta hoja en Drive</a>':'')+'<small>Última incorporación: '+esc(new Date(selected.imported_at).toLocaleString('es-ES'))+'</small>';
    }catch(error){if(host._historyTicket===ticket&&id===loadId)status.textContent='No se pudo cargar la hoja. Vuelve a intentarlo.';}
   }
   select.addEventListener('change',load);await load();
  }catch(error){if(host._historyTicket===ticket)host.innerHTML='<p role="alert">No se pudo cargar el histórico privado.</p>';}
 }
 root.FEHistory={mount,clear,sheetHtml};
})(window);
