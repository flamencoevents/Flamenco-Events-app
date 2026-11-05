const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function routing(){const ctx=vm.createContext({window:{},URLSearchParams});vm.runInContext(fs.readFileSync('management-routing.js','utf8'),ctx);return ctx.window.FEManagement;}
test('Management root targets admin only on exact HTTPS custom domain',()=>{
 const r=routing(),base={protocol:'https:',hostname:'gesion.flamencoevents.net',pathname:'/',search:''};assert.equal(r.homeTarget(base),'./admin.html');assert.equal(r.homeTarget({...base,pathname:'/index.html'}),'./admin.html');
 for(const patch of [{hostname:'flamencoevents.github.io'},{hostname:'www.flamencoevents.net'},{hostname:'gesion.flamencoevents.net.attacker.invalid'},{protocol:'http:'},{pathname:'/portal.html'},{search:'?view=public'}])assert.equal(r.homeTarget({...base,...patch}),null);
});
test('Management routes sales and clients without treating unknown roles as staff',()=>{
 const r=routing();assert.equal(r.roleTarget('sales'),'./staff.html');assert.equal(r.roleTarget('client'),'./portal.html');for(const role of ['admin',undefined,null,'owner','ADMIN'])assert.equal(r.roleTarget(role),null);
});
function adminContext(role){
 const nodes=new Map(),destinations=[],tables=[];const node=id=>{if(!nodes.has(id))nodes.set(id,{innerHTML:'',textContent:'',classList:{add(){},remove(){}}});return nodes.get(id)};
 const db={auth:{getUser:async()=>({data:{user:{id:'fictitious-user'}}})},from(table){tables.push(table);const q={select(){return q},eq(){return q},order(){return q},maybeSingle:async()=>({data:{role},error:null}),then(resolve){return Promise.resolve({data:[],error:null}).then(resolve)}};return q},rpc:async()=>({data:[],error:null})};
 const ctx=vm.createContext({db,document:{getElementById:node},location:{replace:x=>destinations.push(x)},window:{FEManagement:routing(),FEState:{label:x=>x,template:()=>null},FEWorkflow:{mount:async()=>{}}},console,syncContractTemplate(){}});
 const text=fs.readFileSync('admin.html','utf8'),source=text.slice(text.indexOf('let contractEvents='),text.indexOf("\nel('test-enquiry')"));vm.runInContext("const el=x=>document.getElementById(x),safe=x=>String(x??'');"+source,ctx);return {ctx,tables,destinations,node,db};
}
for(const role of ['sales','client','unknown','admin'])test('Admin entry validates '+role+' before loading management records',async()=>{
 const c=adminContext(role);await vm.runInContext('load()',c.ctx);
 if(role==='admin'){assert.ok(c.tables.includes('events'));assert.deepEqual(c.destinations,[]);}else {assert.deepEqual(c.tables,['profiles']);assert.deepEqual(c.destinations,role==='sales'?['./staff.html']:role==='client'?['./portal.html']:[]);if(role==='unknown')assert.match(c.node('status').textContent,/denegado/);}
});
test('Late profile response cannot redirect an invalidated management session',async()=>{
 const c=adminContext('sales');let resolve,started;const ready=new Promise(r=>started=r);c.db.from=()=>({select(){return this},eq(){return this},maybeSingle(){started();return new Promise(r=>resolve=r)}});const task=vm.runInContext('load()',c.ctx);await ready;vm.runInContext('loadEpoch++',c.ctx);resolve({data:{role:'sales'}});await task;assert.deepEqual(c.destinations,[]);
});
test('Management navigation points to existing sections and public form stays reachable',()=>{
 const s=fs.readFileSync('admin.html','utf8'),ids=new Set([...s.matchAll(/id="([^"]+)"/g)].map(m=>m[1]));for(const m of s.matchAll(/href="#([^"]+)"/g))assert.ok(ids.has(m[1]),m[1]);assert.match(s,/index.html\?view=public/);assert.match(s,/integración económica|Integración económica/);assert.match(s,/management-routing.js/);new vm.Script(fs.readFileSync('management-routing.js','utf8'));
});
