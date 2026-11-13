/* Menú de gestión: se muestra solo tras verificar perfil con Supabase. */
(function(){
'use strict';
const cfg=window.FE_PORTAL_CONFIG;
if(!cfg?.url||!cfg?.anonKey||!window.supabase)return;
const nav=document.getElementById('fe-departments');
if(!nav)return;
const items=[['admin.html','Administración'],['marketing.html','Marketing'],['rrhh.html','RR. HH.'],['staff.html','Comercial']];
const page=location.pathname.split('/').pop().toLowerCase();
const db=window.supabase.createClient(cfg.url,cfg.anonKey);
let run=0;
async function sync(){
 const epoch=++run;nav.hidden=true;nav.replaceChildren();
 try{
  const {data,error}=await db.auth.getUser();if(error||!data?.user)return;
  const p=await db.from('profiles').select('role').eq('id',data.user.id).maybeSingle();
  if(epoch!==run||p.error||!['admin','sales'].includes(p.data?.role))return;
  const allowed=p.data.role==='admin'?items:items.filter(([file])=>file==='staff.html');
  const label=document.createElement('span');label.className='fe-dept-label';label.textContent='Departamentos';nav.append(label);
  for(const [file,name] of allowed){
   const a=document.createElement('a');a.href='./'+file;a.textContent=name;
   if(page===file)a.setAttribute('aria-current','page');
   nav.append(a);
  }
  nav.hidden=false;
 }catch(_){nav.hidden=true}
}
db.auth.onAuthStateChange(()=>setTimeout(sync,0));
sync();
})();
