(function(root){
 'use strict';
 let epoch=0;
 const el=id=>document.getElementById(id);
 async function load(db){
  const ticket=++epoch;el('balances-workspace').hidden=true;
  if(!db){el('status').textContent='Conexión pendiente de configurar.';return;}
  try{
   const auth=await db.auth.getUser();if(ticket!==epoch)return;
   if(!auth.data?.user){el('status').textContent='Inicia sesión desde administración para acceder.';return;}
   const p=await db.from('profiles').select('role').eq('id',auth.data.user.id).maybeSingle();
   if(ticket!==epoch)return;
   const current=await db.auth.getUser();if(ticket!==epoch||current.data?.user?.id!==auth.data.user.id)return;
   if(p.error||p.data?.role!=='admin'){el('status').textContent='Acceso exclusivo de administración.';return;}
   el('status').textContent='Solo administración · MODO PRUEBA';el('balances-workspace').hidden=false;
  }catch{if(ticket===epoch)el('status').textContent='No se pudo verificar el acceso. Inténtalo de nuevo.';}
 }
 root.FEBalances={load};
 const cfg=root.FE_PORTAL_CONFIG,db=cfg?.url&&cfg?.anonKey?root.supabase.createClient(cfg.url,cfg.anonKey):null;
 el('balance-year').addEventListener('change',e=>{el('selected-year').textContent=e.target.value;});
 if(db)db.auth.onAuthStateChange(()=>{epoch++;el('balances-workspace').hidden=true;setTimeout(()=>load(db),0);});
 load(db);
})(window);
