/* Historic accounts: external Drive link only. No sheet cells or financial rows are rendered. */
(function(root){
 'use strict';
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function clear(){
  const host=document.getElementById('accounts-history');
  if(host){host._historyTicket=(host._historyTicket||0)+1;host.innerHTML='';}
 }
 async function mount(db,role){
  const host=document.getElementById('accounts-history');
  if(!host)return;
  clear();
  if(!['admin','sales'].includes(role))return;
  const ticket=host._historyTicket;
  try{
   const auth=await db.auth.getUser();
   const actor=auth.data?.user?.id;
   if(!actor||host._historyTicket!==ticket)return;
   const result=await db.from('accounts_source_sheet_catalog')
    .select('source_url').eq('source_key','accounts-2025-2026')
    .order('sheet_index',{ascending:true}).limit(1);
   const check=await db.auth.getUser();
   if(host._historyTicket!==ticket||check.data?.user?.id!==actor)return;
   if(result.error)throw result.error;
   const source=result.data?.[0]?.source_url;
   const href=root.FEAccounts?.safeUrl(source);
   if(!href){host.innerHTML='<p>Enlace al libro de cuentas no disponible.</p>';return;}
   host.innerHTML='<h2>Libro de cuentas 2025/2026</h2><p><a href="'+esc(href)+'" target="_blank" rel="noopener noreferrer">Abrir el libro original en Google Drive</a></p>';
  }catch(error){
   if(host._historyTicket===ticket)host.innerHTML='<p role="alert">No se pudo obtener el enlace al libro de cuentas.</p>';
  }
 }
 root.FEHistory={mount,clear};
})(window);
