import {route,body,database,runtime,settings,mac,uuid,Problem} from '../_shared/bridge.ts';
Deno.serve(route(async request=>{
 const b=await body(request,5000),db=database();if(!await runtime(db))throw new Problem(503,'La captación real todavía no está habilitada');
 if(!uuid(b.submission_id)||b.honeypot||b.consent!==true||b.is_test!==true||b.consent_version!=='test-2026-11-v1'||typeof b.name!=='string'||!/^PRUEBA.{0,94}$/.test(b.name)||typeof b.email!=='string'||!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.invalid$/.test(b.email)||typeof b.service!=='string'||b.service.length<2||b.service.length>150||typeof b.venue!=='string'||b.venue.length>180||typeof b.notes!=='string'||b.notes.length>1000||typeof b.started_at!=='number'||Date.now()-b.started_at<2500||Date.now()-b.started_at>86400000)throw new Problem(422,'Usa datos ficticios, un correo .invalid y confirma el consentimiento de prueba');
 if(b.event_date&&(typeof b.event_date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(b.event_date)||!Number.isFinite(Date.parse(b.event_date))||new Date(b.event_date).toISOString().slice(0,10)!==b.event_date))throw new Problem(422,'Fecha no válida');
 const data={name:b.name.trim(),email:b.email.toLowerCase(),service:b.service.trim(),venue:b.venue.trim(),notes:b.notes.trim(),event_date:b.event_date||'',consent:true,is_test:true,consent_version:b.consent_version};
 const {secret}=settings();const peer=(request.headers.get('x-forwarded-for')||'unknown').split(',').pop()!.trim();
 const saved=await db.rpc('submit_public_test_enquiry',{p_submission:b.submission_id,p_fingerprint:await mac(secret,'intake-peer:'+peer),p_hash:await mac(secret,'intake-data:'+JSON.stringify(data)),p_data:data});
 if(saved.error){if(saved.error.code==='P0001')throw new Problem(429,'Demasiadas solicitudes. Prueba más tarde');if(saved.error.code==='23505')throw new Problem(409,'La referencia ya tiene otros datos');throw new Problem(422,'No se pudo registrar la solicitud ficticia');}
 return{state:'received',reference:b.submission_id,message:'Solicitud ficticia registrada, pendiente de llamada. No se ha enviado presupuesto ni creado acceso cliente.'};
}));
