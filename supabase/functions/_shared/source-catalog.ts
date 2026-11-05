import {Problem,taxes} from './bridge.ts';
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

export function detailSelection(b:any,testMode:boolean,role:string){
 const source_sheet=b.source_sheet||'FE_Cola';
 if(!['FE_Cola','FE_App_Pruebas'].includes(source_sheet)||!testMode&&source_sheet==='FE_App_Pruebas'||typeof b.quote_number!=='string'||!/^(?:\d{5,7}|X\d{2}-P\d{6})$/.test(b.quote_number)||!Number.isInteger(b.version)||b.version<1||b.version>99||b.source_key!==b.quote_number+'-v'+b.version)throw new Problem(422,'Selecciona número, clave, revisión y origen exactos');
 return {source_sheet,source_key:b.source_key,quote_number:b.quote_number,version:b.version,test_mode:testMode,include_costs:role==='admin'};
}
export function sourceDetail(p:any,choice:any){
 if(!p||p.schema_version!==1||p.source_sheet!==choice.source_sheet||p.source_key!==choice.source_key||p.quote_number!==choice.quote_number||p.version!==choice.version||p.is_forecast!==true||typeof p.is_test!=='boolean'||choice.test_mode&&!p.is_test||p.quote_number.startsWith('X')&&!p.is_test||typeof p.source_sha256!=='string'||!/^[a-f0-9]{64}$/.test(p.source_sha256))throw new Problem(502,'Detalle de otra referencia o modo');
 const text=(x:any,max:number)=>{if(typeof x!=='string'||x.length>max)throw new Problem(502,'Texto de origen no válido');return x;};
 const num=(x:any)=>{if(typeof x!=='number'||!Number.isFinite(x)||Math.abs(x)>9999999999.99)throw new Problem(502,'Importe de origen no válido');return x;};
 if(num(p.total_payable_eur)<0||num(p.pending_payable_eur)<0||p.pending_payable_eur>p.total_payable_eur||num(p.deposit_payable_eur)<0||p.deposit_payable_eur>p.total_payable_eur||!Array.isArray(p.services)||p.services.length<1||p.services.length>2)throw new Problem(502,'Detalle incompleto');
 const result:any={schema_version:1,source_sheet:p.source_sheet,source_key:p.source_key,quote_number:p.quote_number,version:p.version,is_test:p.is_test,source_sha256:p.source_sha256,is_forecast:true,client_label:text(p.client_label,150),event_date:text(p.event_date,80),venue:text(p.venue,180),services:p.services.map((s:any)=>({title:text(s.title,500),description:text(s.description,5000)})),total_payable_eur:p.total_payable_eur,deposit_payable_eur:p.deposit_payable_eur,pending_payable_eur:p.pending_payable_eur,tax_details:taxes(p.tax_details)};
 if(!result.tax_details)throw new Problem(502,'Falta detalle fiscal guardado');
 const expected=p.client_type==='empresa'?'business_full_invoice':p.client_type==='particular_base'?'no_vat_quote':result.tax_details.payment_method==='efectivo100'?'individual_full_invoice':'individual_reservation';
 if(!['empresa','particular','particular_base'].includes(p.client_type)||p.client_type==='particular_base'&&result.tax_details.payment_method==='efectivo100'||p.billing_mode!==expected)throw new Problem(502,'Modalidad de origen no válida');
 result.client_type=p.client_type;result.billing_mode=p.billing_mode;
 if(choice.include_costs){
  const copy=(obj:any,keys:string[])=>{if(!obj||typeof obj!=='object'||Array.isArray(obj))throw new Problem(502,'Desglose de costes no válido');const out:any={};for(const key of keys)if(Object.prototype.hasOwnProperty.call(obj,key))out[key]=num(obj[key]);return out;};
  const f=p.forecast;if(!f||f.lines!==null&&(!Array.isArray(f.lines)||f.lines.length>20))throw new Problem(502,'Falta previsión de origen');
  result.forecast={amounts:copy(f.amounts,['subtotal','transporte','antesWedding','wedding','antesAjuste','ajuste','objetivo','compensacion','real','redondeoTotal','redondeoComercial']),expense_breakdown:copy(f.expense_breakdown,['coche','billetes','extraSeat','equipaje','alquiler','combustibleAlquiler','traslados','otroTransporte','transporte','hotel','dietas','peajesParking','otros','deluxe','gastos','totalAdicional']),parameters:copy(f.parameters,['IVA','IRPF_EMPRESA','RESERVA','WEDDING','CONSUMO_L100']),lines:f.lines===null?null:f.lines.map((x:any)=>({...copy(x,['cantidad','coste','venta','admin','anuales','subtotal']),code:text(x.code,30),label:text(x.label,300)}))};
 }
 return result;
}
