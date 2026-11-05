/* Presentation only. Permissions and commercial gates remain on the server. */
(function(){
 'use strict';
 const words={es:{draft:'Borrador',ready:'Preparado para revisión',sent:'Publicado en el portal',signed:'Firma verificada',contract_pending:'Pendiente de contrato',accepted:'Aceptación comercial registrada',confirmed:'Reserva confirmada',completed:'Finalizado',cancelled:'Cancelado',quotation:'Presupuesto',contract:'Contrato',other:'Otro documento',pending:'Pendiente',received:'Cobrado',no_vat_quote:'Presupuesto sin IVA · impuestos no incluidos',individual_reservation:'Particular · reserva y condiciones pactadas',individual_full_invoice:'Particular · factura completa · 100 % en efectivo',business_full_invoice:'Empresa · factura completa',billing:'Pendiente de aprobar la cláusula de pago 100 % en efectivo. Generación contractual bloqueada.',create:'Preparar el contrato y comprobar sus datos.',pdf:'Incorporar el PDF de la revisión exacta antes de publicar.',review:'Revisar el PDF y publicarlo desde administración.',signature:'Firma pendiente: proveedor todavía sin configurar. Publicación no equivale a firma ni reserva.',reservation:'Revisar las condiciones de reserva; confirmación bloqueada en modo prueba.'},en:{draft:'Draft',ready:'Ready for review',sent:'Published in the portal',signed:'Verified signature',contract_pending:'Contract pending',accepted:'Commercial acceptance recorded',confirmed:'Booking confirmed',completed:'Completed',cancelled:'Cancelled',quotation:'Quotation',contract:'Contract',other:'Other document',pending:'Pending',received:'Received',no_vat_quote:'Quotation excluding VAT · taxes not included',individual_reservation:'Individual · deposit and agreed terms',individual_full_invoice:'Individual · full invoice · 100% cash',business_full_invoice:'Business · full invoice',billing:'The 100% cash payment clause needs approval. Contract generation is blocked.',create:'Prepare the contract and review its details.',pdf:'Import the PDF for the exact revision before publishing.',review:'Review the PDF and publish it as administrator.',signature:'Signature pending: provider not configured. Publication does not confirm signature or booking.',reservation:'Review booking requirements; confirmation remains blocked in test mode.'}};
 function label(key,lang='es'){return (words[lang]||words.es)[key]||key;}
 function template(mode){return {no_vat_quote:'no_vat',individual_reservation:'individual_reservation',business_full_invoice:'business_tax_detail'}[mode]||null;}
 function nextAction(mode,contract,hasDocument,lang='es'){
  if(!template(mode))return label('billing',lang);
  if(!contract)return label('create',lang);
  if(contract.state==='signed')return label('reservation',lang);
  if(contract.state==='sent')return label('signature',lang);
  return label(hasDocument?'review':'pdf',lang);
 }
 window.FEState={label,template,nextAction};
})();
