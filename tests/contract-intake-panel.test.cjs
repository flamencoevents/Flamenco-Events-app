const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

function panel(responses){
  const nodes=new Map(),handlers=new Map();
  const node=key=>{
    if(!nodes.has(key))nodes.set(key,{
      innerHTML:'',textContent:'',value:key==='[data-ci-year]'?'2027':'',
      querySelector:node,
      replaceChildren(){this.innerHTML='';},
      addEventListener(event,handler){handlers.set(key+':'+event,handler);}
    });
    return nodes.get(key);
  };
  let actor='admin-fixture';
  const db={auth:{getUser:async()=>({data:{user:actor?{id:actor}:null}})},from(){
    const query={select:()=>query,eq:()=>query,order:()=>responses.shift()()};
    return query;
  }};
  const ctx=vm.createContext({window:{},document:{getElementById:node},Intl});
  vm.runInContext(fs.readFileSync('contract-intake.js','utf8'),ctx);
  return {api:ctx.window.FEContractIntake,db,node,handlers,setActor:id=>{actor=id;}};
}

const row=payload=>({event_date:'2027-03-12',quote_number:'X27-P900001',revision:1,payload});

test('Missing forecasts remain pending while a recorded zero is rendered as zero',async()=>{
  const p=panel([async()=>({data:[row({total_eur:null,deposit_eur:0})]})]);
  await p.api.mount(p.db,'admin','admin-fixture');
  const html=p.node('[data-ci-list]').innerHTML;
  assert.match(html,/Previsión: Pendiente · Reserva prevista: 0,00/);
  assert.match(html,/Saldo previsto: Pendiente/);
  assert.doesNotMatch(html,/NaN|undefined|null €|<p> · <\/p>/);
});

test('Rejected refresh clears stale records and a subsequent refresh can recover',async()=>{
  const first=async()=>({data:[row({total_eur:100,deposit_eur:0,balance_eur:100})]});
  const p=panel([first,async()=>{throw Error('private transport detail');},first]);
  await p.api.mount(p.db,'admin','admin-fixture');
  const list=p.node('[data-ci-list]'),status=p.node('[data-ci-status]');
  const refresh=p.handlers.get('[data-ci-refresh]:click');
  assert.match(list.innerHTML,/X27-P900001/);
  await refresh();
  assert.equal(list.innerHTML,'');
  assert.match(status.textContent,/No se pudo consultar/);
  p.handlers.get('[data-ci-year]:change')();
  assert.equal(list.innerHTML,'');
  assert.match(status.textContent,/No se pudo consultar/);
  await refresh();
  assert.match(list.innerHTML,/X27-P900001/);
});

test('Accounts links must match the event year approved by the receiver',async()=>{
  const receiver=fs.readFileSync('supabase/functions/ingest-generated-contract/index.ts','utf8');
  const books=Object.fromEntries([...receiver.matchAll(/'(202[67])':'([\w-]+)'/g)]
    .map(([,year,id])=>[year,id]));
  assert.equal(Object.keys(books).length,2);
  for(const year of ['2026','2027']){
    const otherYear=year==='2026'?'2027':'2026';
    for(const bookYear of [year,otherYear]){
      const fixture={...row({
        contract_url:'https://drive.google.com/file/d/fixture-only/view',
        accounts_url:'https://docs.google.com/spreadsheets/d/'+books[bookYear]+'/edit#gid=1&range=A11:N11'
      }),event_date:year+'-03-12'};
      const p=panel([async()=>({data:[fixture]})]);
      p.node('[data-ci-year]').value=year;
      await p.api.mount(p.db,'admin','admin-fixture');
      const html=p.node('[data-ci-list]').innerHTML;
      assert.ok(html.includes('Abrir contrato privado'));
      assert.equal(html.includes('Abrir previsión de prueba en cuentas'),bookYear===year,
        'event year '+year+', workbook year '+bookYear);
      assert.equal(html.includes('Previsión en cuentas sin enlazar'),bookYear!==year);
    }
  }
});

test('A delayed response cannot render private rows after an account change',async()=>{
  for(const nextActor of [null,'other-fixture']){
    let resolve;
    const p=panel([()=>new Promise(done=>{resolve=done;})]);
    const loading=p.api.mount(p.db,'admin','admin-fixture');
    p.setActor(nextActor);
    resolve({data:[row({total_eur:100})]});
    await loading;
    assert.equal(p.node('[data-ci-list]').innerHTML,'');
  }
});

test('Admin logout invalidates and clears the private panels before remote signout completes',async()=>{
  const page=fs.readFileSync('admin.html','utf8');
  const start=page.indexOf("el('logout').addEventListener(");
  const end=page.indexOf(';if(db)db.auth.onAuthStateChange',start);
  assert.ok(start>=0&&end>start);
  let handler,finish;
  const calls=[];
  const ctx=vm.createContext({
    loadEpoch:1,
    el:()=>({addEventListener:(_,fn)=>{handler=fn;}}),
    window:{FEAccounts:{clear:()=>calls.push('accounts')},FEContractIntake:{clear:()=>calls.push('contracts')}},
    db:{auth:{signOut:()=>new Promise(resolve=>{finish=resolve;})}},
    load:()=>calls.push('load'),
  });
  vm.runInContext(page.slice(start,end),ctx);
  const loggingOut=handler();
  assert.equal(ctx.loadEpoch,2);
  assert.deepEqual(calls,['accounts','contracts']);
  finish();
  await loggingOut;
  assert.deepEqual(calls,['accounts','contracts','load']);
});
