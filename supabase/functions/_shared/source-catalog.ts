import {Problem} from './bridge.ts';
export function catalogSelection(b:any,testMode:boolean){
 const source_sheet=b.source_sheet||'FE_Cola',offset=b.offset??0;
 if(!['FE_Cola','FE_App_Pruebas'].includes(source_sheet)||!Number.isInteger(offset)||offset<0||offset>100000)throw new Problem(422,'Selecciona origen y página válidos');
 if(!testMode&&source_sheet==='FE_App_Pruebas')throw new Problem(409,'Origen reservado a pruebas');
 return {source_sheet,offset,test_mode:testMode};
}
export function catalogPage(p:any,choice:any){
 if(!p||p.source_sheet!==choice.source_sheet||p.offset!==choice.offset||p.test_mode!==choice.test_mode||!Array.isArray(p.items)||p.items.length>20||p.next_offset!==null&&(!Number.isInteger(p.next_offset)||p.next_offset!==choice.offset+20))throw new Problem(502,'Inventario de origen no válido');
 const items=p.items.map((x:any)=>{
  if(!x||x.source_sheet!==choice.source_sheet||typeof x.quote_number!=='string'||!/^(?:\d{5,7}|X\d{2}-P\d{6})$/.test(x.quote_number)||!Number.isInteger(x.version)||x.version<1||x.version>99||x.source_key!==x.quote_number+'-v'+x.version||typeof x.is_test!=='boolean'||choice.test_mode&&!x.is_test||x.quote_number.startsWith('X')&&!x.is_test)throw new Problem(502,'Referencia de origen no válida');
  for(const [key,max] of [['client_label',150],['event_date',80],['venue',180],['quote_state',80],['contract_state',80]] as const)if(typeof x[key]!=='string'||x[key].length>max)throw new Problem(502,'Metadatos de origen no válidos');
  if(typeof x.total_payable_eur!=='number'||!Number.isFinite(x.total_payable_eur)||x.total_payable_eur<0||typeof x.quotation_pdf_ready!=='boolean'||typeof x.contract_pdf_ready!=='boolean')throw new Problem(502,'Estado de origen no válido');
  return {source_sheet:x.source_sheet,source_key:x.source_key,quote_number:x.quote_number,version:x.version,is_test:x.is_test,client_label:x.client_label,event_date:x.event_date,venue:x.venue,quote_state:x.quote_state,contract_state:x.contract_state,total_payable_eur:x.total_payable_eur,quotation_pdf_ready:x.quotation_pdf_ready,contract_pdf_ready:x.contract_pdf_ready};
 });
 if(new Set(items.map((x:any)=>x.source_key)).size!==items.length)throw new Problem(409,'Hay referencias duplicadas en origen; revisa la cola antes de seleccionar');
 return {source_sheet:choice.source_sheet,offset:choice.offset,next_offset:p.next_offset,items,test_mode:choice.test_mode};
}
