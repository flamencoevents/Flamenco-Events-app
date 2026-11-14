const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('portal.html','utf8').match(/<script>\s*([\s\S]*?)<\/script>/)[1].replace(/start\(\);\s*$/,'');
for(const role of ['admin','sales','client'])test('Portal routes '+role+' correctly',async()=>{
 const nodes=new Map();const node=id=>{if(!nodes.has(id))nodes.set(id,{innerHTML:'',textContent:'',hidden:false,addEventListener(){}});return nodes.get(id)};
 const destinations=[];
 const context=vm.createContext({document:{getElementById:node},location:{replace:x=>destinations.push(x)},setTimeout,console,Intl,Date,window:{},alert(){}});
 vm.runInContext(source,context);
 context.mockDb={auth:{getUser:async()=>({data:{user:{id:'test-user',email:'test@example.invalid'}}})},from:table=>{const q={select:()=>q,eq:()=>q,order:()=>q,limit:()=>q,maybeSingle:async()=>({data:{role}}),then:resolve=>Promise.resolve({data:[]}).then(resolve)};return q}};
 vm.runInContext('db=mockDb',context);await vm.runInContext('refresh()',context);
 assert.deepEqual(destinations,role==='sales'?['./staff.html']:[]);
 if(role==='admin'){
  assert.match(node('app').innerHTML,/Departamentos de gestión/);
  assert.match(node('app').innerHTML,/\.\/admin\.html/);
 }
 if(role==='client')assert.match(node('app').innerHTML,/Aún no tienes eventos asignados/);
});
test('All embedded scripts parse and public assets have no private keys',()=>{
 for(const f of ['index.html','portal.html','staff.html','admin.html','servicios.html','portal-config.js']){
 const body=fs.readFileSync(f,'utf8');assert.doesNotMatch(body,/sb_secret_[A-Za-z0-9_-]+|-----BEGIN (?:RSA )?PRIVATE KEY-----/);
 if(f.endsWith('.js'))new vm.Script(body);else for(const m of body.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
 }
});
