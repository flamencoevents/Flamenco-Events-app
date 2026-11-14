'use strict';
(async function(){
const root=document.querySelector('[data-research-directory]');if(!root)return;
const sector=root.dataset.researchDirectory;
if(!['corporativos','marcas'].includes(sector))return;
const $=id=>document.getElementById(id);
const names={corporativos:'Agencias y eventos corporativos',marcas:'Moda, joyería y marcas'};
const name=names[sector],file='./data/directorio-'+sector+'-espana-publico.json';
let source=[],filtered=[],territories=[];
const collator=new Intl.Collator('es',{sensitivity:'base'});
function appendOption(el,value,label){const o=document.createElement('option');o.value=value;o.textContent=label||value;el.append(o)}
function setOptions(id,options,initial){const el=$(id);el.replaceChildren();appendOption(el,'',initial);for(const [value,label] of options)appendOption(el,value,label)}
function render(){
 const q=$('search').value.trim().toLocaleLowerCase('es'),community=$('community').value,province=$('province').value,status=$('state').value;
 const provinces=territories.filter(x=>!community||x.community===community).map(x=>x.province);
 if(province&&!provinces.includes(province))$('province').value='';
 const selected=$('province').value;
 setOptions('province',provinces.sort(collator.compare).map(x=>[x,x]),'Todas (incluye no verificadas)');$('province').value=provinces.includes(selected)?selected:'';
 const prov=$('province').value;
 filtered=source.filter(x=>(!q||x.name.toLocaleLowerCase('es').includes(q))&&(!community||x.community===community)&&(!prov||x.province===prov)&&(!status||x.verification_status===status)).sort((a,b)=>collator.compare(a.name,b.name));
 const tbody=$('rows');tbody.replaceChildren();
 for(const x of filtered.slice(0,150)){const tr=document.createElement('tr');for(const val of [x.name,x.province||'Por verificar',x.community||'Por verificar',x.segment.replaceAll('_',' '),'Ficha por verificar']){const td=document.createElement('td');td.textContent=val;tr.append(td)}
 const td=document.createElement('td'),a=document.createElement('a');a.href=x.source_url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=x.source;td.append(a);tr.append(td);tbody.append(tr)}
 $('count').textContent=filtered.length.toLocaleString('es-ES')+' candidatos encontrados';
 $('displayLimit').textContent=filtered.length>150?'Mostrando 150 registros; el CSV exporta toda la selección.':'Mostrando todas las coincidencias.';
}
function exportCSV(){const fields=['Nombre','Provincia','Comunidad','Sector','Fuente','URL fuente','Verificación','Situación comercial'];const quote=x=>'"'+String(x??'').replace(/"/g,'""')+'"';const lines=[fields,...filtered.map(x=>[x.name,x.province,x.community,x.segment,x.source,x.source_url,x.verification_status,x.commercial_status])];const blob=new Blob(['\uFEFF'+lines.map(x=>x.map(quote).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='Flamenco_Events_'+sector+'_investigacion.csv';document.body.append(link);link.click();link.remove();URL.revokeObjectURL(url)}
try{
 const [data,geo]=await Promise.all([fetch(file,{cache:'no-store'}),fetch('./data/directorio-bodas-espana-publico.json',{cache:'no-store'})]);
 if(!data.ok||!geo.ok)throw Error('No se pudo consultar la base de investigación');
 const payload=await data.json(),territorial=await geo.json();
 source=payload.records||[];territories=territorial.provinces||[];
 $('total').textContent=source.length.toLocaleString('es-ES');
 $('verified').textContent=source.filter(x=>!!x.province).length.toLocaleString('es-ES');
 $('title').textContent=name;
 setOptions('community',[...new Set(territories.map(x=>x.community))].sort(collator.compare).map(x=>[x,x]),'Todas');
 setOptions('province',territories.map(x=>[x.province,x.province]),'Todas (incluye no verificadas)');
 render();
}catch(err){$('count').textContent='Error de carga: '+err.message}
for(const id of ['search','community','province','state'])$(id).addEventListener(id==='search'?'input':'change',render);
$('csv').addEventListener('click',exportCSV);
})();
