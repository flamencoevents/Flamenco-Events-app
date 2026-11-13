'use strict';
// Optional CRM forms for the staging branch; database RLS enforces all permissions.
const crmFields={
 venues:[['Nombre del establecimiento o agencia','name'],['Provincia','province'],['Categoría: finca / hacienda / hotel / restaurante / wedding_planner / agencia / otro','category'],['Web oficial','website'],['Enlace de la fuente','source_url']],
 hospitality:[['Nombre del establecimiento','name'],['Provincia','province'],['Categoría: hotel_5_estrellas / hotel_boutique / resort / restaurante_gastronomico / beach_club / club_privado / otro','establishment_type'],['Web oficial','website'],['Enlace de la fuente','source_url']],
 brands:[['Nombre de marca','brand_name'],['Sector: moda_flamenca / joyeria / complementos / alta_costura / otro','sector'],['Web oficial','website'],['Enlace de la fuente','source_url']]
};
function crmField(label,name,value,required){
 const wrap=document.createElement('label');wrap.textContent=label;
 const node=document.createElement('input');node.name=name;node.value=value||'';
 node.required=Boolean(required);node.style.cssText='display:block;margin:7px 0 12px;width:100%';wrap.append(node);return wrap;
}
function crmMessage(message){$('status').textContent=message}
function crmRenderEditor(){
 const box=$('editor');if(!box)return;box.replaceChildren();
 if(!isStaff)return;
 if(kind.startsWith('pipeline')){
  const tip=document.createElement('p');tip.textContent='Comercial: revisa las oportunidades y actualiza su etapa o próxima acción.';box.append(tip);return;
 }
 if(!isAdmin)return;
 const title=document.createElement('h2');title.textContent='Marketing · Alta de prospecto';box.append(title);
 const form=document.createElement('form');form.id='crm-new-prospect';
 const fields=crmFields[kind]||[];
 for(const [label,name] of fields)form.append(crmField(label,name,'',['name','brand_name','province','category','establishment_type','sector'].includes(name)));
 const submit=document.createElement('button');submit.textContent='Añadir a investigación';form.append(submit);
 const note=document.createElement('p');note.className='muted';note.textContent='Verifica la fuente y la información profesional antes de cualificar. El alta no envía mensajes.';
 box.append(form,note);
 form.onsubmit=async event=>{
  event.preventDefault();submit.disabled=true;
  try{
   const values=Object.fromEntries(new FormData(form).entries());values.created_by=accountId;
   for(const name of Object.keys(values))if(typeof values[name]==='string')values[name]=values[name].trim();
   const result=await db.from(screens[kind].table).insert(values);
   if(result.error)throw result.error;
   crmMessage('Registro creado en Marketing, pendiente de verificación.');form.reset();await refresh();
  }catch(err){crmMessage(err.message||'No se pudo guardar.')}finally{submit.disabled=false}
 };
}
async function crmQualify(row){
 if(!isAdmin)return;
 const field=kind==='brands'?'status':'marketing_status';
 const allowed=kind==='brands'?['investigacion','verificar','cualificada','descartada']:['investigacion','verificar','cualificado','descartado'];
 const current=row[field];
 const target=prompt('Nuevo estado Marketing: '+allowed.join(', '),current);
 if(target===null)return;
 if(!allowed.includes(target)){crmMessage('Estado no admitido');return}
 const result=await db.from(screens[kind].table).update({[field]:target}).eq('id',row.id).select('id').single();
 crmMessage(result.error?result.error.message:'Estado de Marketing actualizado.');
 if(!result.error)await refresh();
}
async function crmHandoff(row){
 if(!isAdmin || !['venues','hospitality','brands'].includes(kind))return;
 const qualified=kind==='brands'?row.status==='cualificada':row.marketing_status==='cualificado';
 if(!qualified)return;
 if(!confirm('Crear oportunidad para Comercial sin enviar comunicaciones externas.'))return;
 let table,payload;
 if(kind==='venues'){table='fe_commercial_opportunities';payload={prospect_id:row.id,stage:'pendiente_contacto',priority:'media'}}
 else if(kind==='hospitality'){table='fe_hospitality_opportunities';payload={prospect_id:row.id,stage:'pendiente_contacto',priority:'media'}}
 else {
  const options=['desfile_con_musica_en_directo','presentacion_coleccion','editorial_fotografico','evento_vip','activacion_marca','otro'];
  const type=prompt('Tipo de colaboración:\n'+options.join('\n'));
  if(type===null)return;
  if(!options.includes(type)){crmMessage('Selecciona una modalidad admitida.');return}
  table='fe_brand_collaborations';payload={brand_id:row.id,stage:'pendiente_contacto',collaboration_type:type};
 }
 const result=await db.from(table).insert(payload);
 crmMessage(result.error?result.error.message:'Oportunidad traspasada a Comercial.');
 if(!result.error)await refresh();
}
function crmEditOpportunity(row){
 if(!isStaff)return;
 const box=$('editor');box.replaceChildren();
 const heading=document.createElement('h2');heading.textContent='Comercial · Seguimiento de oportunidad';
 const form=document.createElement('form');
 const l=document.createElement('label');l.textContent='Etapa comercial';
 const selector=document.createElement('select');selector.name='stage';selector.style.cssText='display:block;width:100%;padding:12px;background:#332924;color:white;margin:10px 0';
 const states=kind==='pipeline_hospitality'?['pendiente_contacto','contactado','reunion','propuesta','negociacion','acuerdo','recurrente','perdido']:kind==='pipeline_brands'?['pendiente_contacto','contactado','reunion','propuesta','negociacion','acuerdo','realizado','perdido']:['pendiente_contacto','contactado','reunion','propuesta','negociacion','colaborador','ganado','perdido'];
 for(const stage of states){
  const item=document.createElement('option');item.value=stage;item.textContent=stage;selector.append(item);
 }selector.value=row.stage;l.append(selector);form.append(l);
 form.append(crmField('Próxima acción','next_action',row.next_action||'',false));
 form.append(crmField('Próxima fecha (AAAA-MM-DD)','next_action_at',row.next_action_at?.slice(0,10)||'',false));
 const save=document.createElement('button');save.textContent='Guardar seguimiento';form.append(save);
 box.append(heading,form);
 form.onsubmit=async event=>{
  event.preventDefault();save.disabled=true;
  const values=Object.fromEntries(new FormData(form).entries());
  if(values.next_action_at && !/^\d{4}-\d{2}-\d{2}$/.test(values.next_action_at)){crmMessage('Usa fecha AAAA-MM-DD');save.disabled=false;return}
  values.next_action_at=values.next_action_at||null;
  try{
   const result=await db.from(screens[kind].table).update(values).eq('id',row.id).select('id').single();
   if(result.error)throw result.error;
   crmMessage('Seguimiento guardado.');await refresh();
  }catch(err){crmMessage(err.message||'No se pudo guardar.')}finally{save.disabled=false}
 };
}
const crmBaseRefresh=refresh;
refresh=async function(){
 await crmBaseRefresh();
 const body=$('body');if(!body||!isStaff)return;
 if($('count').textContent==='Datos no disponibles'){ $('editor').replaceChildren();return}
 crmRenderEditor();
 const records=await db.from(screens[kind].table).select('*').order('created_at',{ascending:false}).limit(200);
 if(records.error)return;
 if(!kind.startsWith('pipeline')&&isAdmin){
  const head=$('head').querySelector('tr');if(head){const th=document.createElement('th');th.textContent='Marketing';head.append(th)}
  records.data.forEach((row,i)=>{
   const tr=body.children[i],cell=document.createElement('td');
   const change=document.createElement('button');change.textContent='Cambiar estado';change.onclick=()=>crmQualify(row);cell.append(change);if((kind==='venues'&&row.marketing_status==='cualificado')||(kind==='hospitality'&&row.marketing_status==='cualificado')||(kind==='brands'&&row.status==='cualificada')){const btn=document.createElement('button');btn.textContent='Traspasar';btn.style.marginLeft='6px';btn.onclick=()=>crmHandoff(row);cell.append(btn)}
   if(tr)tr.append(cell);
  });
 }
 if(kind.startsWith('pipeline')){
  const head=$('head').querySelector('tr');if(head){const th=document.createElement('th');th.textContent='Acción';head.append(th)}
  records.data.forEach((row,i)=>{const cell=document.createElement('td');const btn=document.createElement('button');btn.textContent='Actualizar';btn.onclick=()=>crmEditOpportunity(row);cell.append(btn);const tr=body.children[i];if(tr)tr.append(cell)});
 }
};
