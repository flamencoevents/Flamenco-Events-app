import {route,body,database,staff,runtime,accepted,scriptRead,selection,uuid,Problem,hash} from '../_shared/bridge.ts';
Deno.serve(route(async request=>{
 const db=database();await staff(request,db,true);const b=await body(request);
 if(!uuid(b.event_id)||!['quotation','contract'].includes(b.kind))throw new Problem(422,'Selecciona evento y tipo de documento');
 const ev=await db.from('events').select('id,enquiry_id,quote_terms_id,is_test').eq('id',b.event_id).single();
 if(ev.error||!ev.data?.quote_terms_id)throw new Problem(409,'El evento no tiene un presupuesto vinculado');
 const testMode=await runtime(db);await accepted(db,ev.data.enquiry_id,testMode);
 const terms=await db.from('accepted_quote_terms').select('quote_number,version,external_reference').eq('id',ev.data.quote_terms_id).single();
 if(terms.error)throw new Problem(409,'No se encuentra la versión comercial');
 const reference=terms.data.external_reference||'',prefix='sheet:12djLXZ7he8Znhp8ngNn_VvBPiV9-gzWR1HGtGycV0RY:';
 if(!reference.startsWith(prefix))throw new Problem(409,'El presupuesto no conserva un origen de Sheets verificable');
 const [source_sheet,source_key]=reference.slice(prefix.length).split(':');
 const choice=selection({enquiry_id:ev.data.enquiry_id,quote_number:terms.data.quote_number,version:terms.data.version,source_sheet,source_key});
 const file=await scriptRead(b.kind==='quotation'?'quotation_document':'contract_document',choice);
 if(file.source_reference!==reference||typeof file.pdf_base64!=='string'||file.pdf_base64.length>14000000)throw new Problem(422,'Documento de otra versión o demasiado grande');
 let bytes;try{bytes=Uint8Array.from(atob(file.pdf_base64),x=>x.charCodeAt(0));}catch{throw new Problem(422,'Archivo no válido');}
 if(bytes.length>10485760||new TextDecoder().decode(bytes.slice(0,5))!=='%PDF-')throw new Problem(422,'El documento no es un PDF válido de hasta 10 MB');
 const digest=await hash(file.pdf_base64),path=ev.data.id+'/'+b.kind+'-v'+choice.version+'-'+digest+'.pdf';
 const old=await db.from('event_documents').select('id,storage_path').eq('event_id',ev.data.id).eq('kind',b.kind).eq('version',choice.version).maybeSingle();
 if(old.error)throw new Problem(500,'No se pudo comprobar el documento existente');
 if(old.data){if(old.data.storage_path!==path)throw new Problem(409,'Ya existe otro PDF para ese tipo y versión. Revisión administrativa necesaria');return{state:'already_recorded',document_id:old.data.id};}
 const uploaded=await db.storage.from('event-documents').upload(path,bytes,{contentType:'application/pdf',upsert:false});
 if(uploaded.error&&!['409','Duplicate'].includes(String(uploaded.error.statusCode||uploaded.error.error)))throw new Problem(500,'No se pudo almacenar el PDF privado');
 const saved=await db.from('event_documents').insert({event_id:ev.data.id,kind:b.kind,version:choice.version,storage_path:path}).select('id').single();
 if(saved.error)throw new Problem(500,'PDF almacenado; metadatos pendientes de revisión');
 return{state:'recorded',document_id:saved.data.id,message:b.kind==='contract'?'PDF privado incorporado. Publicación del contrato pendiente de revisión.':'PDF privado incorporado'};
}));
