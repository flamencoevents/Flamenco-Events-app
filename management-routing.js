(function(root){
 'use strict';
 const hostname='gestion.flamencoevents.net';
 function homeTarget(location){
  if(location.protocol!=='https:'||location.hostname!==hostname||!['/','/index.html'].includes(location.pathname))return null;
  if(new URLSearchParams(location.search||'').get('view')==='public')return null;
  return './admin.html';
 }
 function roleTarget(role){return role==='sales'?'./staff.html':role==='client'?'./portal.html':null;}
 root.FEManagement={hostname,homeTarget,roleTarget};
})(window);
