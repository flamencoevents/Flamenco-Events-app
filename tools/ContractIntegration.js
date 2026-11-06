/* Contratos generados → previsión de prueba en cuentas y bandeja administrativa.
 * No registra llamadas, aceptación comercial, firma, reservas ni cobros.
 */
const FE_CI_BOOK='1dsgfqv6YG49-_QaAx-0dUyvLImBTdkkDEvgXBu1QZuY';
const FE_CI_HEADERS=['Clave','Presupuesto','Revisión','Fecha evento','Cliente de prueba','Lugar','Servicio','Total previsto','Reserva prevista','Saldo previsto','Contrato PDF','Huella PDF SHA256','Estado','Actualizado'];
function feCiSha_(value){return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,value).map(b=>('0'+((b+256)%256).toString(16)).slice(-2)).join('');}
function feCiTexto_(value,max){const s=String(value||'').trim();if(!s||s.length>max||/[\x00-\x1f]/.test(s))throw Error('Dato de integración no válido');return /^[=+@-]/.test(s)?"'"+s:s;}
function feCiPlan_(d,url){
 const b=d&&d.presupuesto;
 if(!b||b.modelo!=='FE3'||b.modoPrueba!==true||!/^X\d{2}-P\d{6}$/.test(b.id)||!Number.isInteger(b.revision)||b.revision<1||b.revision>99||b.key!==b.id+'-v'+b.revision)throw Error('Solo contratos de prueba con referencia exacta');
 const date=b.request.fecha;if(!/^\d{4}-\d\d-\d\d$/.test(date)||isNaN(new Date(date+'T12:00:00Z').getTime())||new Date(date+'T12:00:00Z').toISOString().slice(0,10)!==date)throw Error('Fecha de evento no válida');
 if(!/^https:\/\/drive\.google\.com\/file\/d\/[\w-]+\/view(?:\?[^#]*)?$/.test(url))throw Error('Falta PDF contractual privado de Drive');
 feContratoModalidad_(b);
 const c=b.calculo;for(const k of ['total','reserva','pendiente'])if(typeof c[k]!=='number'||!Number.isFinite(c[k])||c[k]<0||Math.round(c[k]*100)!==Math.round(c[k]*100000)/1000)throw Error('Importes guardados no válidos');
 if(Math.round((c.reserva+c.pendiente)*100)!==Math.round(c.total*100))throw Error('Reserva y saldo no concilian');
 return {source_key:b.key,quote_number:b.id,revision:b.revision,is_test:true,event_date:date,client_label:feCiTexto_('PRUEBA · '+b.request.cliente,150),venue:feCiTexto_(b.request.lugar,180),service:feCiTexto_(b.request.servicios.map(x=>x.artistas+'; '+x.duracion).join(' / '),600),total_eur:c.total,deposit_eur:c.reserva,balance_eur:c.pendiente,contract_url:url};
}
function feCiSheet_(book,name,headers){let s=book.getSheetByName(name);if(!s){s=book.insertSheet(name);s.getRange(1,1,1,headers.length).setValues([headers]);s.setFrozenRows(1);}if(JSON.stringify(s.getRange(1,1,1,headers.length).getValues()[0])!==JSON.stringify(headers))throw Error('Cabeceras de integración inesperadas');return s;}
function feCiCuentas_(p){
 const year=Number(p.event_date.slice(0,4)),book=SpreadsheetApp.openById(FE_CI_BOOK),sheet=feCiSheet_(book,'PRUEBA contratos '+year,FE_CI_HEADERS),rows=sheet.getDataRange().getValues();
 const matches=rows.map((r,i)=>({r,i})).filter(x=>x.i&&x.r[0]===p.source_key);if(matches.length>1)throw Error('Referencia duplicada en cuentas de prueba');
 const values=[p.source_key,p.quote_number,p.revision,p.event_date,p.client_label,p.venue,p.service,p.total_eur,p.deposit_eur,p.balance_eur,p.contract_url,p.pdf_sha256,'PRUEBA · PDF generado; pendiente revisión comercial'];
 const row=matches.length?matches[0].i+1:rows.length+1;
 if(matches.length&&JSON.stringify(matches[0].r.slice(0,13))!==JSON.stringify(values))throw Error('La previsión existente ha cambiado; requiere conciliación');
 if(!matches.length){sheet.getRange(row,1,1,14).setValues([[...values,new Date()]]);SpreadsheetApp.flush();}
 if(JSON.stringify(sheet.getRange(row,1,1,13).getValues()[0])!==JSON.stringify(values))throw Error('No se confirma la lectura de cuentas');
 return 'https://docs.google.com/spreadsheets/d/'+FE_CI_BOOK+'/edit#gid='+sheet.getSheetId()+'&range=A'+row+':N'+row;
}
function feCiEnviar_(p){
 const secret=props_().getProperty('FE_APP_BRIDGE_SECRET');if(!secret||secret.length<32)throw Error('Falta el secreto de integración');
 const raw=JSON.stringify(p),ts=String(Math.floor(Date.now()/1000)),signature=feAppMac_(ts+'.'+raw,secret);
 const response=UrlFetchApp.fetch('https://vulbpjayunvlpftgfzyf.supabase.co/functions/v1/ingest-generated-contract',{method:'post',contentType:'application/json',payload:raw,headers:{'x-fe-timestamp':ts,'x-fe-signature':signature},muteHttpExceptions:true,followRedirects:false,validateHttpsCertificates:true});
 let result;try{result=JSON.parse(response.getContentText());}catch(e){throw Error('Respuesta de integración no válida');}
 if(![200,201].includes(response.getResponseCode())||!['recorded','already_recorded'].includes(result.state))throw Error('Gestión pendiente: HTTP '+response.getResponseCode());return result;
}
function feContratosIntegrarPendientes(){
 const props=props_();if(props.getProperty('FE_CONTRACT_INTEGRATION_ENABLED')!=='TEST_ONLY')return {state:'disabled'};
 if(props.getProperty('FE_APP_TEST_MODE')==='false')throw Error('Integración de prueba bloqueada en modo real');
 const lock=LockService.getScriptLock();if(!lock.tryLock(1000))return {state:'busy'};
 const result={integrados:0,existentes:0,errores:0};
 try{
  const book=libro_(),source=book.getSheetByName('FE_Contratos');if(!source)return result;
  const journal=feCiSheet_(book,'FE_Integracion_Contratos',['Clave','Estado','Huella PDF','Cuentas','Actualizado','Detalle']);
  const rows=source.getDataRange().getValues(),records=journal.getDataRange().getValues();
  for(let i=rows.length-1;i>=1&&result.integrados+result.errores<4;i--){
   if(rows[i][1]!=='GENERADO')continue;
   let key='fila-'+(i+1),j=-1;
   try{
    const d=JSON.parse(rows[i][2]),p=feCiPlan_(d,String(rows[i][6]||''));key=p.source_key;
    const exact=feContratoPresupuesto_(p.quote_number,p.revision);if(JSON.stringify(exact)!==JSON.stringify(d.presupuesto))throw Error('La copia contractual no coincide con FE_Cola');
    j=records.findIndex((r,index)=>index&&r[0]===key);if(j>=0&&records[j][1]==='INTEGRADO'){result.existentes++;continue;}
    const file=DriveApp.getFileById(p.contract_url.match(/\/d\/([\w-]+)/)[1]),blob=file.getBlob(),bytes=blob.getBytes();
    if(bytes.length>10485760||bytes.length<5||String.fromCharCode(...bytes.slice(0,5))!=='%PDF-')throw Error('Documento contractual no válido');
    p.pdf_sha256=feCiSha_(bytes);p.accounts_url=feCiCuentas_(p);
    const answer=feCiEnviar_(p);const row=j>=0?j+1:journal.getLastRow()+1;
    journal.getRange(row,1,1,6).setValues([[key,'INTEGRADO',p.pdf_sha256,p.accounts_url,new Date(),answer.state]]);SpreadsheetApp.flush();result.integrados++;
   }catch(e){result.errores++;const row=j>=0?j+1:journal.getLastRow()+1;journal.getRange(row,1,1,6).setValues([[key,'PENDIENTE','','',new Date(),String(e.message).slice(0,180)]]);SpreadsheetApp.flush();}
  }
 }finally{lock.releaseLock();}
 console.log(JSON.stringify(result));return result;
}
function feContratosActivarIntegracionPrueba(){
 if(props_().getProperty('FE_APP_TEST_MODE')==='false')throw Error('Requiere modo prueba');
 props_().setProperty('FE_CONTRACT_INTEGRATION_ENABLED','TEST_ONLY');
 if(!ScriptApp.getProjectTriggers().some(t=>t.getHandlerFunction()==='feContratosIntegrarPendientes'))ScriptApp.newTrigger('feContratosIntegrarPendientes').timeBased().everyMinutes(5).create();
 return feContratosIntegrarPendientes();
}
