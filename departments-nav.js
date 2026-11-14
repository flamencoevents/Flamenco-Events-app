/* Flamenco Events | navegación única de gestión, no sustituye a la seguridad RLS. */
(function(){
'use strict';
const nav=document.getElementById('fe-departments'),cfg=window.FE_PORTAL_CONFIG;
if(!nav||!cfg?.url||!cfg?.anonKey||!window.supabase)return;
const db=window.supabase.createClient(cfg.url,cfg.anonKey);
const pathname=location.pathname.split('/').pop().toLowerCase();
const adminPages=['admin.html','marketing.html','staff.html','rrhh.html'];
const salesPages=['staff.html','marketing.html','rrhh.html'];
const subpages={
 'marketing.html':[
  ['marketing.html#prospeccion','Prospección'],
  ['marketing.html#sectores','Sectores'],
  ['marketing.html#campanas','Campañas'],
  ['marketing.html#plan-marketing','Plan y tareas'],
  ['marketing-venues.html','Espacios prioritarios'],
  ['marketing-planners.html','Wedding planners']
 ],
 'staff.html':[['staff.html','Panel Comercial']],
 'rrhh.html':[['rrhh.html','Artistas y RR. HH.']]
};
const names={'admin.html':'Administración','marketing.html':'Marketing','staff.html':'Comercial','rrhh.html':'RR. HH.'};
const mktPages=['marketing.html','marketing-venues.html','marketing-planners.html','marketing-task.html'];
const section=mktPages.includes(pathname)?'marketing.html':adminPages.includes(pathname)?pathname:'staff.html';
let syncEpoch=0;
function link(href,label,active){
 const a=document.createElement('a');a.href='./'+href;a.textContent=label;
 if(active)a.setAttribute('aria-current','page');return a;
}
function build(role){
 nav.replaceChildren();nav.hidden=false;nav.classList.add('fe-nav-ready');nav.setAttribute('aria-label','Navegación principal y secciones');
 const line=document.createElement('div');line.className='fe-nav-top';
 const brand=document.createElement('span');brand.className='fe-dept-label';brand.textContent='Gestión · Flamenco Events';line.append(brand);
 const menu=document.createElement('button');menu.type='button';menu.className='fe-nav-toggle';menu.textContent='Menú';menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-controls','fe-nav-content');line.append(menu);nav.append(line);
 const content=document.createElement('div');content.id='fe-nav-content';content.className='fe-nav-content';
 const main=document.createElement('div');main.className='fe-nav-main';main.setAttribute('aria-label','Departamentos');
 const pages=role==='admin'?adminPages:salesPages;
 for(const file of pages)main.append(link(file,names[file],section===file));content.append(main);
 const options=section==='staff.html'?subpages['staff.html']:section==='marketing.html'?subpages['marketing.html']:section==='rrhh.html'?subpages['rrhh.html']:[];
 const filtered=options;
 if(filtered.length>1){const sub=document.createElement('div');sub.className='fe-nav-sub';sub.setAttribute('aria-label','Secciones de '+names[section]);
 for(const [href,label] of filtered){
  const u=new URL(href,location.href);
  const active=u.pathname.split('/').pop()===pathname&&(u.hash?u.hash===location.hash:!location.hash);
  sub.append(link(href,label,active));
 }content.append(sub);}
 nav.append(content);
 menu.addEventListener('click',()=>{const expanded=menu.getAttribute('aria-expanded')==='true';menu.setAttribute('aria-expanded',String(!expanded));content.classList.toggle('fe-nav-open',!expanded)});
 content.addEventListener('click',event=>{if(event.target.closest('a')){menu.setAttribute('aria-expanded','false');content.classList.remove('fe-nav-open')}});
}
async function sync(){
 const epoch=++syncEpoch;nav.hidden=true;nav.replaceChildren();
 try{const a=await db.auth.getUser();if(epoch!==syncEpoch||a.error||!a.data?.user)return;
 const p=await db.from('profiles').select('role').eq('id',a.data.user.id).maybeSingle();
 if(epoch!==syncEpoch||p.error||!['admin','sales'].includes(p.data?.role))return;
 build(p.data.role);
 }catch(_){nav.hidden=true}
}
db.auth.onAuthStateChange(()=>setTimeout(sync,0));
sync();
})();
