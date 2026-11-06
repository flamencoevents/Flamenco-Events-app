import {route,body,database,staff,runtime,accepted,scriptRead,selection,quotation,uuid,Problem,hash} from '../_shared/bridge.ts';
Deno.serve(route(async request=>{
 const db=database(),b=await body(request),preview=b.operation==='preview',accounts=b.operation==='accounts_preview';await staff(request,db,!preview);
 if(b.operation!==undefined&&!['preview','import','accounts_preview'].includes(b.operation))throw new Problem(422,'Operación documental no válida');
 if(!uuid(b.event_id)||!['quotation','contract'].includes(b.kind))throw new Problem(422,'Selecciona evento y tipo de documento');
 if(accounts&&b.kind!=='contract')throw new Problem(422,'La conciliación requiere el documento contractual');
 const ev=await db.from('events').select('id,enquiry_id,quote_terms_id,is_test').eq('id',b.event_id).single();
 if(ev.error||!ev.data?.quote_terms_id)throw new Problem(409,'El evento no tiene un presupuesto vinculado');
 const testMode=await runtime(db);
 if(accounts&&(testMode!==true||ev.data.is_test!==true))throw new Problem(409,'Conciliación disponible solo para eventos ficticios en MODO PRUEBA');
 await accepted(db,ev.data.enquiry_id,testMode);
 const terms=await db.from('accepted_quote_terms').select('enquiry_id,quote_number,version,external_reference,total_payable_eur,deposit_payable_eur,billing_mode,tax_details').eq('id',ev.data.quote_terms_id).single();
 if(terms.error)throw new Problem(409,'No se encuentra la versión comercial');
 const reference=terms.data.external_reference||'',prefix='sheet:12djLXZ7he8Znhp8ngNn_VvBPiV9-gzWR1HGtGycV0RY:';
 if(!reference.startsWith(prefix))throw new Problem(409,'El presupuesto no conserva un origen de Sheets verificable');
 const [source_sheet,source_key]=reference.slice(prefix.length).split(':');
 if(!testMode&&source_sheet==='FE_App_Pruebas')throw new Problem(409,'Origen reservado a pruebas');
 const choice=selection({enquiry_id:ev.data.enquiry_id,quote_number:terms.data.quote_number,version:terms.data.version,source_sheet,source_key});
 let accountsDocument:any=null,accountsContract:any=null;
 if(accounts){
  if(terms.data.enquiry_id!==ev.data.enquiry_id||reference!==prefix+choice.source_sheet+':'+choice.source_key)throw new Problem(409,'La ficha económica pertenece a otro origen o solicitud');
  if(terms.data.billing_mode==='individual_full_invoice'||terms.data.tax_details?.payment_method==='efectivo100')throw new Problem(409,'Modalidad contractual pendiente de aprobación');
  const contract=await db.from('event_contracts').select('id,event_id,quotation_number,document_id,state').eq('event_id',ev.data.id).single();
  if(contract.error||!contract.data?.document_id||contract.data.quotation_number!==choice.quote_number)throw new Problem(409,'Falta el vínculo contractual exacto del evento');
  const doc=await db.from('event_documents').select('id,event_id,kind,version,source_reference,sha256').eq('id',contract.data.document_id).single();
  if(doc.error||doc.data?.event_id!==ev.data.id||doc.data.kind!=='contract'||doc.data.version!==choice.version||doc.data.source_reference!==reference||!String(doc.data.sha256||'').match(/^[a-f0-9]{64}$/))throw new Problem(409,'El PDF privado no conserva versión, origen y huella comprobables');
  accountsDocument=doc.data;accountsContract=contract.data;
 }
 const file=await scriptRead(b.kind==='quotation'?'quotation_document':'contract_document',choice);
 if(file.source_reference!==reference||typeof file.pdf_base64!=='string'||file.pdf_base64.length>14000000)throw new Problem(422,'Documento de otra versión o demasiado grande');
 let bytes;try{bytes=Uint8Array.from(atob(file.pdf_base64),x=>x.charCodeAt(0));}catch{throw new Problem(422,'Archivo no válido');}
 if(bytes.length>10485760||new TextDecoder().decode(bytes.slice(0,5))!=='%PDF-')throw new Problem(422,'El documento no es un PDF válido de hasta 10 MB');
 const checksum=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');
 if(accounts){
  if(checksum!==accountsDocument.sha256)throw new Problem(409,'El PDF de origen ha cambiado respecto al documento incorporado');
  const current=quotation(await scriptRead('preview',choice),choice);
  if(current.is_test!==true)throw new Problem(409,'La copia de origen no está marcada como ficticia');
  for(const k of ['total_payable_eur','deposit_payable_eur','billing_mode'])if(current[k as keyof typeof current]!==terms.data[k])throw new Problem(409,'Las condiciones de origen han cambiado; requiere conciliación');
  const fiscalKeys=['base_eur','invoiced_base_eur','vat_eur','withholding_eur','rounding_eur','payment_method'];
  if(!current.tax_details||!terms.data.tax_details||fiscalKeys.some(k=>current.tax_details[k]!==terms.data.tax_details[k]))throw new Problem(409,'El detalle fiscal de origen no coincide con la versión aceptada');
  return{state:'accounts_source_checked',event_id:ev.data.id,terms_id:ev.data.quote_terms_id,contract_id:accountsContract.id,document_id:accountsDocument.id,
   quote_number:choice.quote_number,version:choice.version,pdf_sha256:checksum,size_bytes:bytes.length,
   is_forecast:true,stored:false,production_writable:false,remote_committed:false,
   checks:{source_response_hmac:true,source_pdf_checksum:true,stored_document_metadata:true,accepted_financial_values:true,stored_pdf_bytes:false,event_schedule:false,workbook:false,signature:false,commercial_closure:false,payments:false},
   pending:['stored_pdf_bytes','event_schedule','workbook_version_and_month','server_operation_journal','commercial_closure_rules']};
 }
 if(preview)return{state:'verified',event_id:ev.data.id,kind:b.kind,version:choice.version,size_bytes:bytes.length,sha256:checksum,stored:false,requires_admin:true};
 const digest=await hash(file.pdf_base64),path=ev.data.id+'/'+b.kind+'-v'+choice.version+'-'+digest+'.pdf';
 const old=await db.from('event_documents').select('id,storage_path').eq('event_id',ev.data.id).eq('kind',b.kind).eq('version',choice.version).maybeSingle();
 if(old.error)throw new Problem(500,'No se pudo comprobar el documento existente');
 if(old.data){if(old.data.storage_path!==path)throw new Problem(409,'Ya existe otro PDF para ese tipo y versión. Revisión administrativa necesaria');return{state:'already_recorded',document_id:old.data.id};}
 const uploaded=await db.storage.from('event-documents').upload(path,bytes,{contentType:'application/pdf',upsert:false});
 if(uploaded.error&&!['409','Duplicate'].includes(String(uploaded.error.statusCode||uploaded.error.error)))throw new Problem(500,'No se pudo almacenar el PDF privado');
 const saved=await db.from('event_documents').insert({event_id:ev.data.id,kind:b.kind,version:choice.version,storage_path:path,sha256:checksum,source_reference:reference}).select('id').single();
 if(saved.error)throw new Problem(500,'PDF almacenado; metadatos pendientes de revisión');
 return{state:'recorded',document_id:saved.data.id,message:b.kind==='contract'?'PDF privado incorporado. Publicación del contrato pendiente de revisión.':'PDF privado incorporado'};
}));

