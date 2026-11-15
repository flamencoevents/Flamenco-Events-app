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
  const db={from(){
    const query={select:()=>query,eq:()=>query,order:()=>responses.shift()()};
    return query;
  }};
  const ctx=vm.createContext({window:{},document:{getElementById:node},Intl});
  vm.runInContext(fs.readFileSync('contract-intake.js','utf8'),ctx);
  return {api:ctx.window.FEContractIntake,db,node,handlers};
}

const row=payload=>({event_date:'2027-03-12',quote_number:'X27-P900001',revision:1,payload});

test('Missing forecasts remain pending while a recorded zero is rendered as zero',async()=>{
  const p=panel([async()=>({data:[row({total_eur:null,deposit_eur:0})]})]);
  await p.api.mount(p.db,'admin');
  const html=p.node('[data-ci-list]').innerHTML;
  assert.match(html,/Previsión: Pendiente · Reserva prevista: 0,00/);
  assert.match(html,/Saldo previsto: Pendiente/);
  assert.doesNotMatch(html,/NaN|undefined|null €|<p> · <\/p>/);
});

test('Rejected refresh clears stale records and a subsequent refresh can recover',async()=>{
  const first=async()=>({data:[row({total_eur:100,deposit_eur:0,balance_eur:100})]});
  const p=panel([first,async()=>{throw Error('private transport detail');},first]);
  await p.api.mount(p.db,'admin');
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
