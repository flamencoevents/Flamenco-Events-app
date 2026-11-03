import fs from 'node:fs';
import vm from 'node:vm';
const pages=['index.html','portal.html','staff.html','admin.html'];
let errors=0;
for(const name of pages){
  const html=fs.readFileSync(name,'utf8');
  const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(x=>x[1]).filter(x=>x.trim());
  if(!scripts.length){ console.error(name+': missing inline script');errors++;continue; }
  for(const source of scripts) {
    try { new vm.Script(source,{filename:name}); }
    catch(err) { console.error(name+': '+err.message);errors++; }
  }
  const suspicious=/sb_secret_[A-Za-z0-9_-]{12,}|(?:service_role|SUPABASE_SERVICE_ROLE_KEY)\\s*[:=]\\s*[\"'][^\"']+/i;
  if(suspicious.test(html)){ console.error(name+': privileged-key marker in public page');errors++; }
  if(!html.includes('viewport')){ console.error(name+': mobile viewport missing');errors++; }
  console.log(name+': checked');
}
if(errors)process.exit(1);
