const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function api(extra={}){const c=vm.createContext({window:{},URL,Intl,...extra});vm.runInContext(fs.readFileSync('accounts-events.js','utf8'),c);return c.window.FEAccounts;}
const row=()=>({source_row:10,event_date:'2027-03-12',schedule:'18:00',venue:'<script>unsafe</script>',client_label:'PRUEBA',quote_number:'00926',budget_eur:0,account_values:{PRESUPUESTO:'0','COBRADO RESERVA':'0'},quotation_url:'https://drive.google.com/file/d/test/view',contract_url:'https://www.canva.com/d/test',document_note:'<unsafe>'});
test('Accounts table has exactly five columns and separate safe document links',()=>{
 const html=api().table([row()]);assert.equal((html.match(/<th scope/g)||[]).length,5);assert.equal((html.match(/<td(?: |>|\b)/g)||[]).length,5);assert.match(html,/>Presupuesto<\/a>/);assert.match(html,/>Contrato<\/a>/);assert.match(html,/Cuentas del evento/);assert.match(html,/0,00/);assert.match(html,/00926/);assert.ok(!html.includes('<script>'));assert.ok(!html.includes('<unsafe>'));assert.match(html,/noopener noreferrer/);
});
test('Document URLs cannot point to arbitrary sites or scripts',()=>{
 const a=api();for(const u of ['javascript:alert(1)','https://drive.google.com.attacker.invalid/file/d/x/view','https://www.canva.com@attacker.invalid/design/x/view','http://drive.google.com/file/d/x/view','https://attacker.invalid/','https://docs.google.com/other'])assert.equal(a.safeUrl(u),null);
 assert.ok(a.safeUrl('https://docs.google.com/spreadsheets/d/test/edit'));assert.ok(a.safeUrl('https://www.canva.com/d/test'));
});
test('Missing links stay pending and complete accounts do not invent missing amounts',()=>{
 const r=row();r.quotation_url=null;r.contract_url=null;r.budget_eur=null;r.budget_text=null;
 const a=api();assert.match(a.table([r]),/Presupuesto sin enlazar/);assert.match(a.table([r]),/Contrato sin enlazar/);
 const html=a.detail(r,{year:2027,source_url:'https://docs.google.com/spreadsheets/d/test/edit'});assert.match(html,/COBRADO RESERVA/);assert.match(html,/COBRO TOTAL/);assert.match(html,/Abrir cuentas totales de 2027/);assert.match(html,/<dd>—<\/dd>/);assert.match(html,/<dd>0,00/);
});
function mock(){const nodes=new Map(),handlers=new Map(),queries=[];let user='staff-a',pending;
 const node=k=>{if(!nodes.has(k))nodes.set(k,{innerHTML:'',textContent:'',value:k==='[data-accounts-year]'?'2027':'',hidden:false,dataset:{},focus(){},querySelector:node,addEventListener:(event,fn)=>handlers.set(k+':'+event,fn)});return nodes.get(k)};
 const host=node('host'),db={auth:{getUser:async()=>({data:{user:{id:user}}})},from(t){queries.push(t);const q={select:()=>q,order:()=>q,eq:()=>q,then:resolve=>{if(t==='accounts_year_catalog')return Promise.resolve({data:[{year:2027,source_url:'https://docs.google.com/spreadsheets/d/test/edit',imported_at:'2026-11-06T00:00:00Z'}]}).then(resolve);return new Promise(r=>pending=r).then(resolve)}};return q;}};
 const a=api({document:{getElementById:()=>host}});return {a,db,host,queries,handlers,node,setUser:v=>user=v,resolve:x=>pending({data:x}),get pending(){return pending}};
}
test('Clients cannot mount the staff accounts catalog',async()=>{const c=mock();await c.a.mount(c.db,'client');assert.deepEqual(c.queries,[]);assert.equal(c.host.innerHTML,'');});
test('Account change and signout clear invalidate pending catalog responses',async()=>{
 for(const signout of [true,false]){const c=mock();const p=c.a.mount(c.db,'sales');while(!c.pending)await new Promise(r=>setImmediate(r));if(signout)c.a.clear();else c.setUser('other');c.resolve([row()]);await p;assert.equal(c.node('[data-accounts-table]').innerHTML,'');}
});
test('Search filters source rows without conflating identical quotation numbers',async()=>{
 const c=mock();const p=c.a.mount(c.db,'admin');while(!c.pending)await new Promise(r=>setImmediate(r));c.resolve([row(),{...row(),source_row:20,client_label:'OTRO',venue:'Otro lugar'}]);await p;
 c.node('[data-accounts-search]').value='otro';c.handlers.get('[data-accounts-search]:input')();const html=c.node('[data-accounts-table]').innerHTML;assert.match(html,/OTRO/);assert.ok(!html.includes('PRUEBA'));
});
