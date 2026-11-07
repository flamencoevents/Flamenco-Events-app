/* Contratos generados → previsión de prueba en cuentas y bandeja administrativa.
 * No registra llamadas, aceptación comercial, firma, reservas ni cobros.
 */
const FE_CI_BOOK='1dsgfqv6YG49-_QaAx-0dUyvLImBTdkkDEvgXBu1QZuY';
const FE_CI_BOOKS={2026:FE_CI_BOOK,2027:'1ZE66Ko8bnh3qp9Z2Mfp8VOG2pmH_a-EyUJZRvQVnHtE'};
const FE_CI_HEADERS=['Clave','Presupuesto','Revisión','Fecha evento','Cliente de prueba','Lugar','Servicio','Total previsto','Reserva prevista','Saldo previsto','Contrato PDF','Huella PDF SHA256','Estado','Actualizado'];
function feCiSha_(value){return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,value).map(b=>('0'+((b+256)%256).toString(16)).slice(-2)).join('');}
function feCiTexto_(value,max){const s=String(value||'').trim();if(!s||s.length>max||/[\x00-\x1f]/.test(s))throw Error('Dato de integración no válido');return /^[=+@-]/.test(s)?"'"+s:s;}
function feCiPlan_(d,url){
 const b=d&&d.presupuesto;
 if(!b||b.modelo!=='FE3'||b.modoPrueba!==true||!/^X\d{2}-P\d{6}$/.test(b.id)||!Number.isInteger(b.revision)||b.revision<1||b.revision>99||b.key!==b.id+'-v'+b.revision)throw Error('Solo contratos de prueba con referencia exacta');
 const date=b.request.fecha;if(!/^\d{4}-\d\d-\d\d$/.test(date)||isNaN(new Date(date+'T12:00:00Z').getTime())||new Date(date+'T12:00:00Z').toISOString().slice(0,10)!==date)throw Error('Fecha de evento no válida');
 if(!/^https:\/\/drive\.google\.com\/file\/d\/[\w-]+\/view(?:\?[^#]*)?$/.test(url))throw Error('Falta PDF contractual privado de Drive');
 feContratoModalidad_(b);
 const c=b.calculo;for(const k of ['total','reserva','pendiente'])if(typeof c[k]!=='number'||!Number.isFinite(c[k])||!Number.isSafeInteger(Math.round(c[k]*100))||c[k]<0||Number(c[k].toFixed(2))!==c[k])throw Error('Importes guardados no válidos');
 if(Math.round((c.reserva+c.pendiente)*100)!==Math.round(c.total*100))throw Error('Reserva y saldo no concilian');
 return {source_key:b.key,quote_number:b.id,revision:b.revision,is_test:true,event_date:date,client_label:feCiTexto_('PRUEBA · '+b.request.cliente,150),venue:feCiTexto_(b.request.lugar,180),service:feCiTexto_(b.request.servicios.map(x=>x.artistas+'; '+x.duracion).join(' / '),600),total_eur:c.total,deposit_eur:c.reserva,balance_eur:c.pendiente,contract_url:url};
}
function feCiSheet_(book,name,headers){let s=book.getSheetByName(name);if(!s){s=book.insertSheet(name);s.getRange(1,1,1,headers.length).setValues([headers]);s.setFrozenRows(1);}if(JSON.stringify(s.getRange(1,1,1,headers.length).getValues()[0])!==JSON.stringify(headers))throw Error('Cabeceras de integración inesperadas');return s;}
function feCiCuentas_(p){
 const year=Number(p.event_date.slice(0,4));const bookId=FE_CI_BOOKS[year];if(!bookId)throw Error('Libro del año '+year+' pendiente de conectar');const book=SpreadsheetApp.openById(bookId),sheet=feCiSheet_(book,'PRUEBA contratos '+year,FE_CI_HEADERS),rows=sheet.getDataRange().getValues();
 const matches=rows.map((r,i)=>({r,i})).filter(x=>x.i&&x.r[0]===p.source_key);if(matches.length>1)throw Error('Referencia duplicada en cuentas de prueba');
 const values=[p.source_key,p.quote_number,p.revision,p.event_date,p.client_label,p.venue,p.service,p.total_eur,p.deposit_eur,p.balance_eur,p.contract_url,p.pdf_sha256,'PRUEBA · PDF generado; pendiente revisión comercial'];
 const row=matches.length?matches[0].i+1:rows.length+1;
 const normalized=values=>values.map((v,i)=>i===3&&v instanceof Date?Utilities.formatDate(v,book.getSpreadsheetTimeZone(),'yyyy-MM-dd'):v);
 if(matches.length&&JSON.stringify(normalized(matches[0].r.slice(0,13)))!==JSON.stringify(values))throw Error('La previsión existente ha cambiado; requiere conciliación');
 if(!matches.length){sheet.getRange(row,1,1,14).setValues([[...values,new Date()]]);SpreadsheetApp.flush();}
 if(JSON.stringify(normalized(sheet.getRange(row,1,1,13).getValues()[0]))!==JSON.stringify(values))throw Error('No se confirma la lectura de cuentas');
 return 'https://docs.google.com/spreadsheets/d/'+bookId+'/edit#gid='+sheet.getSheetId()+'&range=A'+row+':N'+row;
}
function feCiEnviar_(p){
 const secret=props_().getProperty('FE_APP_BRIDGE_SECRET');if(!secret||secret.length<32)throw Error('Falta el secreto de integración');
 const raw=JSON.stringify(p),ts=String(Math.floor(Date.now()/1000)),signature=feAppMac_(ts+'.'+raw,secret);
 const response=UrlFetchApp.fetch('https://vulbpjayunvlpftgfzyf.supabase.co/functions/v1/ingest-generated-contract',{method:'post',contentType:'application/json',payload:raw,headers:{'x-fe-timestamp':ts,'x-fe-signature':signature},muteHttpExceptions:true,followRedirects:false,validateHttpsCertificates:true});
 let result;try{result=JSON.parse(response.getContentText());}catch(e){throw Error('Respuesta de integración no válida');}
 if(!result||typeof result!=='object'||Array.isArray(result))throw Error('Respuesta de integración no válida');
 if(![200,201].includes(response.getResponseCode())||!['recorded','already_recorded'].includes(result.state))throw Error('Gestión pendiente: HTTP '+response.getResponseCode());return result;
}
function feContratosIntegrarPendientes(){
 const props=props_();if(props.getProperty('FE_CONTRACT_INTEGRATION_ENABLED')!=='TEST_ONLY')return {state:'disabled'};
 if(props.getProperty('FE_APP_TEST_MODE')!=='true')throw Error('Integración de prueba bloqueada en modo real');
 const lock=LockService.getScriptLock();if(!lock.tryLock(1000))return {state:'busy'};
 const result={integrados:0,existentes:0,errores:0};
 try{
  const book=libro_(),source=book.getSheetByName('FE_Contratos');if(!source)return result;
  const journal=feCiSheet_(book,'FE_Integracion_Contratos',['Clave','Estado','Huella PDF','Cuentas','Actualizado','Detalle']);
  const rows=source.getDataRange().getValues();
  for(let i=rows.length-1;i>=1&&result.integrados+result.errores<4;i--){
   if(rows[i][1]!=='GENERADO')continue;
   // El lote puede haber creado o actualizado una entrada en la vuelta anterior.
   const records=journal.getDataRange().getValues();
   let key='fila-'+(i+1),j=-1,journalConflict=false;
   try{
    const d=JSON.parse(rows[i][2]),p=feCiPlan_(d,String(rows[i][6]||''));key=p.source_key;
    const exact=feContratoPresupuesto_(p.quote_number,p.revision);if(JSON.stringify(exact)!==JSON.stringify(d.presupuesto))throw Error('La copia contractual no coincide con FE_Cola');
    const matches=records.map((r,index)=>({r,index})).filter(x=>x.index&&x.r[0]===key);
    if(matches.length>1){journalConflict=true;throw Error('Referencia duplicada en diario; requiere conciliación');}
    j=matches.length?matches[0].index:-1;
    const file=DriveApp.getFileById(p.contract_url.match(/\/d\/([\w-]+)/)[1]),blob=file.getBlob(),bytes=blob.getBytes();
    if(bytes.length>10485760||bytes.length<5||String.fromCharCode(...bytes.slice(0,5))!=='%PDF-')throw Error('Documento contractual no válido');
    p.pdf_sha256=feCiSha_(bytes);
    if(j>=0&&records[j][2]&&records[j][2]!==p.pdf_sha256)throw Error('El PDF previamente registrado ha cambiado; requiere conciliación');
    p.accounts_url=feCiCuentas_(p);
    if(j>=0&&records[j][1]==='INTEGRADO'){if(records[j][2]!==p.pdf_sha256||records[j][3]!==p.accounts_url)throw Error('El documento integrado ha cambiado; requiere conciliación');result.existentes++;continue;}
    const answer=feCiEnviar_(p);const row=j>=0?j+1:journal.getLastRow()+1;
    journal.getRange(row,1,1,6).setValues([[key,'INTEGRADO',p.pdf_sha256,p.accounts_url,new Date(),answer.state]]);SpreadsheetApp.flush();result.integrados++;
   }catch(e){result.errores++;if(journalConflict)continue;const row=j>=0?j+1:journal.getLastRow()+1;journal.getRange(row,1,1,6).setValues([[key,'PENDIENTE',j>=0?records[j][2]||'':'',j>=0?records[j][3]||'':'',new Date(),'Error: '+String(e&&e.message||'Fallo de integración').replace(/[\x00-\x1f]/g,' ').slice(0,173)]]);SpreadsheetApp.flush();}
  }
  if(props.getProperty('FE_XLSX_PREVIEW_2027')==='TEST_ONLY'&&result.errores===0)result.excel=feCiXlsxSync_();
 }finally{lock.releaseLock();}
 console.log(JSON.stringify(result));return result;
}
function feContratosActivarIntegracionPrueba(){
 if(props_().getProperty('FE_APP_TEST_MODE')!=='true')throw Error('Requiere modo prueba');
 props_().setProperty('FE_CONTRACT_INTEGRATION_ENABLED','TEST_ONLY');
 if(!ScriptApp.getProjectTriggers().some(t=>t.getHandlerFunction()==='feContratosIntegrarPendientes'))ScriptApp.newTrigger('feContratosIntegrarPendientes').timeBased().everyMinutes(5).create();
 return feContratosIntegrarPendientes();
}



/* Private test preview inside the existing Office file. No closed-date/balance writes. */
const FE_XLSX_2027='174JxA-f27Fl4PS5jHibG0R8q0RqOgKfG';
const FE_XLSX_PART='xl/worksheets/fe_contracts_test_2027.xml';
const FE_XLSX_REL='rIdFEContractTest2027';
const FE_XLSX_NAME='PRUEBA contratos 2027';
const FE_XLSX_MIME='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
function feXEsc_(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));}
function feXAttr_(tag,key){const m=tag.match(new RegExp('(?:^|\\s)'+key+'=(?:"([^"]*)"|\'([^\']*)\')'));return m?(m[1]===undefined?m[2]:m[1]):null;}
function feXRequire_(ok,code){if(!ok)throw Error('Excel: '+code);}
function feXSheet_(rows,styles){
 const ns='http://schemas.openxmlformats.org/spreadsheetml/2006/main';
 const body=rows.map((row,i)=>'<row r="'+(i+1)+'" ht="'+(i?54:44)+'" customHeight="1">'+row.map((v,j)=>{
  const ref=String.fromCharCode(65+j)+(i+1),numeric=typeof v==='number';
  const style=i===0?styles.header:j===3||j===13?styles.date:j>=7&&j<=9?styles.money:styles.text;
  feXRequire_(!numeric||Number.isFinite(v),'INVALID_NUMBER');
  return '<c r="'+ref+'" s="'+style+'" t="'+(numeric?'n':'inlineStr')+'">'+(numeric?'<v>'+v+'</v>':'<is><t xml:space="preserve">'+feXEsc_(v)+'</t></is>')+'</c>';
 }).join('')+'</row>').join('');
 return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="'+ns+'"><dimension ref="A1:N'+rows.length+'"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="18"/><cols>'+[20,18,10,15,22,42,60,18,18,18,55,70,60,18].map((w,i)=>'<col min="'+(i+1)+'" max="'+(i+1)+'" width="'+w+'" customWidth="1"/>').join('')+'</cols><sheetData>'+body+'</sheetData><autoFilter ref="A1:N'+rows.length+'"/></worksheet>';
}
function feXBuild_(parts,rows){
 const wb='xl/workbook.xml',rel='xl/_rels/workbook.xml.rels',ct='[Content_Types].xml';
 feXRequire_(parts[wb]&&parts[rel]&&parts[ct]&&parts['xl/worksheets/sheet1.xml'],'PACKAGE_UNSUPPORTED');
 for(const name of [wb,rel,ct,'xl/worksheets/sheet1.xml'])feXRequire_(!/<!DOCTYPE|<!ENTITY/i.test(parts[name]),'XML_UNSUPPORTED');
 feXRequire_(!/date1904=["'](?:1|true)["']/.test(parts[wb]),'DATE_SYSTEM_UNSUPPORTED');
 const sheets=parts[wb].match(/<sheet\b[^>]*\/?\s*>/g)||[];
 const original=sheets.filter(t=>feXAttr_(t,'name')==='Fechas cerradas 2027 por fecha ');
 const links=parts[rel].match(/<Relationship\b[^>]*\/?\s*>/g)||[];
 const ledgerLinks=links.filter(t=>feXAttr_(t,'Id')===feXAttr_(original[0]||'','r:id'));
 feXRequire_(original.length===1&&ledgerLinks.length===1&&feXAttr_(ledgerLinks[0],'Target')==='worksheets/sheet1.xml'&&feXAttr_(ledgerLinks[0],'TargetMode')!=='External','LEDGER_LAYOUT_CHANGED');
 function style(ref){const tags=parts['xl/worksheets/sheet1.xml'].match(/<c\b[^>]*>/g)||[];const c=tags.filter(t=>feXAttr_(t,'r')===ref);feXRequire_(c.length===1,'STYLE_REFERENCE_MISSING');const s=feXAttr_(c[0],'s')||'0';feXRequire_(/^\d+$/.test(s),'STYLE_INVALID');return s;}
 const sheet=feXSheet_(rows,{header:style('C3'),text:style('C5'),date:style('D5'),money:style('H5')});
 const existing=sheets.filter(t=>feXAttr_(t,'name')===FE_XLSX_NAME);
 const owned='<Relationship Id="'+FE_XLSX_REL+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/fe_contracts_test_2027.xml"/>';
 const content='<Override PartName="/'+FE_XLSX_PART+'" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>';
 const changed=Object.assign({},parts);
 if(existing.length){
  feXRequire_(existing.length===1&&feXAttr_(existing[0],'r:id')===FE_XLSX_REL&&parts[rel].includes(owned)&&parts[ct].includes(content)&&typeof parts[FE_XLSX_PART]==='string','EXISTING_SHEET_NOT_OWNED');
 }else{
  feXRequire_(!parts[FE_XLSX_PART]&&!parts[rel].includes(FE_XLSX_REL)&&!parts[ct].includes(FE_XLSX_PART),'PART_COLLISION');
  const ids=sheets.map(t=>Number(feXAttr_(t,'sheetId')));feXRequire_(ids.length>0&&ids.every(Number.isInteger),'SHEET_ID_INVALID');
  const id=Math.max(...ids)+1;
  feXRequire_(parts[wb].split('</sheets>').length===2&&parts[rel].split('</Relationships>').length===2&&parts[ct].split('</Types>').length===2,'PACKAGE_LAYOUT_UNSUPPORTED');
  changed[wb]=parts[wb].replace('</sheets>','<sheet name="'+FE_XLSX_NAME+'" sheetId="'+id+'" r:id="'+FE_XLSX_REL+'"/></sheets>');
  changed[rel]=parts[rel].replace('</Relationships>',owned+'</Relationships>');
  changed[ct]=parts[ct].replace('</Types>',content+'</Types>');
 }
 changed[FE_XLSX_PART]=sheet;
 return {parts:changed,changed:Object.keys(changed).filter(n=>parts[n]!==changed[n]),sheet:sheet};
}
function feXRequest_(url,options){
 const opts=Object.assign({muteHttpExceptions:true,followRedirects:false,validateHttpsCertificates:true},options||{});
 opts.headers=Object.assign({Authorization:'Bearer '+ScriptApp.getOAuthToken()},opts.headers||{});
 return UrlFetchApp.fetch(url,opts);
}
function feXMeta_(id){
 const r=feXRequest_('https://www.googleapis.com/drive/v2/files/'+encodeURIComponent(id)+'?fields=id,etag,mimeType,md5Checksum,fileSize,version');
 feXRequire_(r.getResponseCode()===200,'METADATA_HTTP_'+r.getResponseCode());const v=JSON.parse(r.getContentText());
 feXRequire_(v.id===id&&v.mimeType===FE_XLSX_MIME&&typeof v.etag==='string'&&v.etag.length>2&&Number(v.fileSize)<=20000000&&/^[a-f0-9]{32}$/.test(v.md5Checksum),'METADATA_INVALID');return v;
}
function feXRead_(id,meta){
 const r=feXRequest_('https://www.googleapis.com/drive/v2/files/'+encodeURIComponent(id)+'?alt=media');feXRequire_(r.getResponseCode()===200,'DOWNLOAD_FAILED');
 const b=r.getBlob().setContentType('application/zip'),bytes=b.getBytes();
 const md5=Utilities.computeDigest(Utilities.DigestAlgorithm.MD5,bytes).map(b=>('0'+((b+256)%256).toString(16)).slice(-2)).join('');
 feXRequire_(md5===meta.md5Checksum,'FILE_CHANGED');return b;
}
function feXUnzip_(blob){
 const blobs=Utilities.unzip(blob),map={};let total=0;feXRequire_(blobs.length<500,'TOO_MANY_PARTS');
 blobs.forEach(b=>{const n=b.getName();total+=b.getBytes().length;feXRequire_(!Object.prototype.hasOwnProperty.call(map,n)&&!n.includes('..')&&!n.startsWith('/'),'INVALID_ZIP');map[n]=b;});feXRequire_(total<=80000000,'UNCOMPRESSED_TOO_LARGE');return map;
}
function feXRows_(){
 const b=SpreadsheetApp.openById(FE_CI_BOOKS[2027]),s=b.getSheetByName(FE_XLSX_NAME);feXRequire_(s&&s.getLastRow()>=2&&s.getLastRow()<=500,'SOURCE_RANGE_INVALID');
 const rows=s.getRange(1,1,s.getLastRow(),14).getValues();feXRequire_(JSON.stringify(rows[0])===JSON.stringify(FE_CI_HEADERS),'SOURCE_HEADERS_CHANGED');
 const seen={};const contracts=libro_().getSheetByName('FE_Contratos').getDataRange().getValues();
 const normalized=rows.map((r,i)=>{
  if(!i)return r;
  feXRequire_(!seen[r[0]],'DUPLICATE_SOURCE_KEY');seen[r[0]]=true;
  const date=r[3] instanceof Date?Utilities.formatDate(r[3],b.getSpreadsheetTimeZone(),'yyyy-MM-dd'):r[3];
  feXRequire_(typeof date==='string'&&date.startsWith('2027-'),'SOURCE_YEAR_INVALID');
  const matches=contracts.filter((c,j)=>j&&c[1]==='GENERADO'&&JSON.parse(c[2]).presupuesto.key===r[0]);feXRequire_(matches.length===1,'CONTRACT_SOURCE_AMBIGUOUS');
  const p=feCiPlan_(JSON.parse(matches[0][2]),String(matches[0][6]||''));
  const expected=[p.source_key,p.quote_number,p.revision,p.event_date,p.client_label,p.venue,p.service,p.total_eur,p.deposit_eur,p.balance_eur,p.contract_url,r[11],'PRUEBA · PDF generado; pendiente revisión comercial'];
  feXRequire_(JSON.stringify([r[0],r[1],r[2],date,...r.slice(4,13)])===JSON.stringify(expected),'SOURCE_CONTRACT_CHANGED');
  const bytes=DriveApp.getFileById(p.contract_url.match(/\/d\/([\w-]+)/)[1]).getBlob().getBytes();feXRequire_(feCiSha_(bytes)===r[11],'PDF_CHANGED');
  return r.map((v,j)=>v instanceof Date?(j===3?Date.parse(date+'T00:00:00Z')/86400000+25569:Date.parse(Utilities.formatDate(v,b.getSpreadsheetTimeZone(),'yyyy-MM-dd')+'T00:00:00Z')/86400000+25569):v);
 });return normalized;
}
function feXPut_(id,blob,etag){return feXRequest_('https://www.googleapis.com/upload/drive/v2/files/'+encodeURIComponent(id)+'?uploadType=media&newRevision=true',{method:'put',contentType:FE_XLSX_MIME,payload:blob.getBytes(),headers:{'If-Match':etag}});}
function feXMirror_(id,rows,backup){
 const meta=feXMeta_(id),source=feXRead_(id,meta),blobs=feXUnzip_(source),text={};
 for(const n of ['xl/workbook.xml','xl/_rels/workbook.xml.rels','[Content_Types].xml','xl/worksheets/sheet1.xml',FE_XLSX_PART])if(blobs[n]){text[n]=blobs[n].getDataAsString('UTF-8');XmlService.parse(text[n]);}
 const built=feXBuild_(text,rows);
 if(!built.changed.length)return {state:'already_mirrored',rows:rows.length-1,file_id:id};
 for(const n of built.changed){XmlService.parse(built.parts[n]);blobs[n]=Utilities.newBlob(built.parts[n],'application/xml',n);}
 const candidate=Utilities.zip(Object.keys(blobs).map(n=>blobs[n]),'accounts.xlsx');
 const check=feXUnzip_(candidate);
 for(const n of Object.keys(blobs))feXRequire_(check[n]&&feCiSha_(check[n].getBytes())===feCiSha_(blobs[n].getBytes()),'CANDIDATE_AUDIT_FAILED');
 let backupId='';if(backup){const f=DriveApp.getFileById(id);backupId=f.makeCopy('COPIA antes integración PRUEBA 2027 · '+Utilities.formatDate(new Date(),'Europe/Madrid','yyyyMMdd-HHmmss')+'.xlsx',f.getParents().next()).getId();}
 feXRequire_(feXMeta_(id).etag===meta.etag,'VERSION_CONFLICT');
 const r=feXPut_(id,candidate,meta.etag);feXRequire_(r.getResponseCode()===200,'CONDITIONAL_UPDATE_HTTP_'+r.getResponseCode());
 const after=feXMeta_(id),saved=feXRead_(id,after),actual=feXUnzip_(saved);
 feXRequire_(Object.keys(actual).length===Object.keys(check).length,'READBACK_PART_COUNT');
 for(const n of Object.keys(check))feXRequire_(actual[n]&&feCiSha_(actual[n].getBytes())===feCiSha_(check[n].getBytes()),'READBACK_AUDIT_FAILED');
 return {state:'mirrored',rows:rows.length-1,file_id:id,backup_id:backupId,source_sha256:feCiSha_(source.getBytes()),result_sha256:feCiSha_(saved.getBytes()),protected_parts_verified:true};
}
function feCiXlsxSync_(){
 feXRequire_(props_().getProperty('FE_APP_TEST_MODE')==='true'&&props_().getProperty('FE_XLSX_PREVIEW_2027')==='TEST_ONLY','TEST_MODE_REQUIRED');
 const result=feXMirror_(FE_XLSX_2027,feXRows_(),true);
 props_().setProperty('FE_XLSX_PREVIEW_2027_LAST',JSON.stringify(Object.assign({checked_at:new Date().toISOString()},result)));
 console.log(JSON.stringify({excel_preview:result}));return result;
}
function feExcel2027ProbarCopia(){
 feXRequire_(props_().getProperty('FE_APP_TEST_MODE')==='true','TEST_MODE_REQUIRED');
 const original=feXMeta_(FE_XLSX_2027),file=DriveApp.getFileById(FE_XLSX_2027);
 const copy=file.makeCopy('ENSAYO técnico XLSX 2027 · '+Utilities.formatDate(new Date(),'Europe/Madrid','yyyyMMdd-HHmmss')+'.xlsx',file.getParents().next());
 const id=copy.getId();props_().setProperty('FE_XLSX_PREVIEW_2027_TRIAL_ID',id);
 const m=feXMeta_(id),raw=feXRead_(id,m),before=feCiSha_(raw.getBytes());
 const rejected=feXPut_(id,raw,'"FE-intentionally-stale-etag"');feXRequire_(rejected.getResponseCode()===412,'IF_MATCH_NOT_ENFORCED');
 feXRequire_(feCiSha_(feXRead_(id,feXMeta_(id)).getBytes())===before,'STALE_WRITE_CHANGED_FILE');
 const first=feXMirror_(id,feXRows_(),false),again=feXMirror_(id,feXRows_(),false);
 feXRequire_(first.state==='mirrored'&&again.state==='already_mirrored','IDEMPOTENCE_FAILED');
 feXRequire_(feXMeta_(FE_XLSX_2027).etag===original.etag,'ORIGINAL_CHANGED_DURING_TRIAL');
 const result={state:'trial_passed',copy_id:id,stale_write_rejected:true,protected_parts_verified:true,repeat_state:again.state};
 props_().setProperty('FE_XLSX_PREVIEW_2027_TRIAL',JSON.stringify(result));console.log(JSON.stringify(result));return result;
}
function feExcel2027ConectarPrueba(){
 feXRequire_(props_().getProperty('FE_APP_TEST_MODE')==='true','TEST_MODE_REQUIRED');
 const trial=JSON.parse(props_().getProperty('FE_XLSX_PREVIEW_2027_TRIAL')||'{}');feXRequire_(trial.state==='trial_passed'&&trial.stale_write_rejected===true,'VERIFIED_TRIAL_REQUIRED');
 props_().setProperty('FE_XLSX_PREVIEW_2027','TEST_ONLY');return feContratosIntegrarPendientes();
}
