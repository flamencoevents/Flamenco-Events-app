# Estado verificado · 5 noviembre 2026

**MODO PRUEBA ACTIVO.** No se han contactado clientes, enviado presupuestos/contratos ni invitado clientes reales. La sincronización general continúa desactivada. Nacho conserva la única administración; Azahara conserva el único perfil sales tras retirar identidades técnicas.

## Documentos y contratos · avance del 4 noviembre 2026

- Apps Script publicado en **versión 45**, workflow https://github.com/flamencoevents/flamenco-events-appscript/actions/runs/41788989944. El flujo contractual ya no selecciona la última revisión: si existen varias filas/revisiones GENERADO, exige `/contrato NÚMERO vN`. Comprueba número, revisión, clave y copia FE3, y rechaza copias no ficticias mientras siga prueba. Una única revisión continúa siendo compatible con el comando anterior. Los comandos con revisión mal escrita devuelven instrucciones.
- Se han conservado las tres plantillas Canva aprobadas; se verificaron sus metadatos sin modificarlas ni exportarlas. Nombres observados: Particular sin IVA (3 páginas), Empresa con IVA e IRPF (3) y Particular con reserva facturada (4). Esta revisión de metadatos no certifica todo su contenido jurídico.
- PDF técnico creado con datos exclusivamente ficticios, rotulado SIN VALIDEZ COMERCIAL NI CONTRACTUAL; 2663 bytes. Drive confirma shared=false y solo permiso de propietario. Vinculado únicamente a FE_App_Pruebas!J2, fila X26-P900001-v1, conservando el resto de la fila y las fórmulas. Archivo: `1CyKLInq2bsYgRwz5CVtTmfnWVoF-Y_B6`. Huella SHA-256: `c985adb2ad644eb392ae4ba57c395e490c4ab230cc0ae4a37ad3c6bfaeb03f1d`.
- Nueva comprobación documental previa en `import-event-document`: un miembro del equipo puede comprobar el archivo exacto; devuelve tamaño, versión y huella, **sin bytes PDF, URL ni escrituras**. La incorporación real continúa exigiendo administrador. La pestaña técnica se rechaza fuera de modo prueba.
- HTTP real con identidad comercial ficticia: Drive → Apps Script firmado → Supabase devolvió 200 y la misma huella/tamaño que el archivo local. El intento comercial de importar devolvió 403 y la petición sin sesión 401. En esa comprobación del 4 de noviembre el bucket estaba privado y vacío: solo se verificó lectura e integridad del origen. La incorporación y descarga se completaron el 5 de noviembre, según la evidencia siguiente.
- La identidad técnica de esta comprobación quedó bloqueada, sin contraseña utilizable y sin rol comercial; su perfil se conserva como PRUEBA DOCUMENTAL DESACTIVADA · NO ASIGNAR. El intento de eliminarla no se ejecutó porque expiró la confirmación; se aplicó la alternativa de desactivación sin ampliar permisos. El servidor ahora impide asignar identidades bloqueadas o eliminadas a eventos.
- Nueva migración `20261104073434`: el contrato toma el número del presupuesto enlazado al evento, rechaza otro número y otra revisión PDF; comienza en borrador y exige proveedor, fecha y referencia para registrar firma. No se han cambiado las condiciones de reserva ni las fórmulas.
- `supabase/tests/documents-contracts-rollback.sql` pasó en la base real con roles SQL simulados: número incorrecto, revisión PDF incorrecta, inserción sin borrador, firma incompleta, alteración de contrato firmado, reserva en prueba e identidad bloqueada. Solo utilizó metadatos ficticios, sin PDF real ni firma real, y terminó ROLLBACK. También volvió a pasar continuation-rollback.sql.
- 28 pruebas locales de la app superadas. Apps Script: 20 pruebas del puente y baterías existentes, ampliada la de contratos con revisión explícita, ambigüedad, borrador, copia alterada, marca ficticia y sintaxis de comando.

## PDF privado: incorporación y aislamiento comprobados · 5 noviembre 2026

- Nacho incorporó el PDF desde su sesión administrativa. Base real: documento `4b8612c8-ce42-4a13-b55d-0a80ab15fcab`, quotation v1, evento `e4a35ff8-2fca-4e23-83ed-ffb4ab3c45de`, registrado el 5 de noviembre a las 14:42:14 UTC. Su captura confirma apertura desde el panel y marca SIN VALIDEZ COMERCIAL NI CONTRACTUAL.
- HTTP real con dos clientes Auth ficticios: A vio los metadatos del documento, obtuvo un enlace firmado y descargó el objeto privado existente (200). Los 2663 bytes y SHA-256 `c985adb2ad644eb392ae4ba57c395e490c4ab230cc0ae4a37ad3c6bfaeb03f1d` coincidieron exactamente con el original.
- B obtuvo cero metadatos del documento de A; tanto firma como descarga autenticada del mismo objeto existente devolvieron 400, sin PDF ni enlace. La ruta pública anónima también devolvió 400. El bucket sigue public=false.
- Las asignaciones a los eventos ficticios se hicieron con rol administrativo simulado en SQL; los accesos y descargas se comprobaron por HTTP con sesiones Auth reales. No se prueba aquí una sesión cliente en Safari/Android, una firma contractual ni una reserva.
- Limpieza verificada en base real: cero eventos asignados a estas identidades, dos usuarios técnicos bloqueados, sin contraseña utilizable y con fe_test_retired=true; cero sesiones vigentes (not_after vencido), cero refresh tokens utilizables. Se conservan filas técnicas desactivadas. La eliminación inicial no se ejecutó al expirar la confirmación; se completó la alternativa de desactivación. Credenciales locales eliminadas.
- Estado final: test_mode=true, un administrador y un comercial. No se activó sincronización general ni se enviaron comunicaciones a clientes reales.


## Prueba real completada · 4 noviembre 2026

- Publicación correcta del commit `5dc578dfefd3e03a6509e7324effd99cb1cf4773` en la implementación existente de Apps Script, **versión 44**. Workflow: https://github.com/flamencoevents/flamenco-events-appscript/actions/runs/41786601991. Subida de 13 archivos, pruebas y publicación superadas. El bloqueo de autenticación Google está resuelto.
- Petición autenticada con identidad comercial ficticia: lectura firmada de X26-P900001-v1 desde FE_App_Pruebas, revisión 1. Respuesta HTTP 200 con base 1000 €, IVA 210 €, total 1210 €, reserva 0 € y modalidad individual_full_invoice. Importes e impuestos copiados sin recalcular.
- Sin autorización expresa: HTTP 422 y ninguna importación. Con autorización: HTTP 200 y registro `9f7f51ba-73c5-4d8e-bbab-255da56741dd`. Repetir la aprobación de la **misma previsualización** devolvió already_recorded con el mismo registro. Consulta SQL posterior: exactamente una versión 1 y ninguna versión 2.
- Lectura explícita de revisión 2: 1331 € e IVA 231 €, sin elegir automáticamente esa revisión para importar. Se cambió únicamente la copia ficticia E3 después de previsualizarla; aprobar la previsualización anterior devolvió HTTP 409. La celda quedó restaurada byte por byte y se comprobó mediante API.
- La primera lectura de revisión 2, solicitada en paralelo con la importación v1, devolvió SOURCE_NOT_VERIFIED/422; una repetición secuencial funcionó. La causa no está confirmada. No produjo importación ni datos parciales; se mantiene como incidencia observada, sin atribuirla a un componente concreto.
- Preparación del evento `e4a35ff8-2fca-4e23-83ed-ffb4ab3c45de` mediante RPC en base real con rol administrativo simulado en SQL. Vinculado exclusivamente al presupuesto importado, marcado PRUEBA, contract_pending y sin cliente. Una segunda preparación devolvió el mismo evento; la confirmación formal fue rechazada en una transacción revertida. Esto no equivale a una prueba con sesión personal de Nacho en navegador.
- Se conservan las dos previsualizaciones como auditoría: v1 importada y v2 cerrada como failed/TEST_COMPLETED_SOURCE_CHANGED. La identidad técnica quedó bloqueada, sin contraseña utilizable, identidades de acceso, sesiones ni perfil comercial. Su fila Auth se conserva únicamente como referencia de auditoría. El token anterior devuelve 401 al puente.
- Estado final consultado: test_mode=true, un administrador (Nacho), un comercial (Azahara), cero eventos confirmados. No se activó la sincronización general, ni se enviaron comunicaciones, invitaciones o documentos a clientes reales.

## Código, despliegue y comportamiento

| Elemento | Código / despliegue | Comprobación y límite |
| --- | --- | --- |
| Formulario público | Publicado en index.html; public-enquiry v1 activa | HTTP real: solicitud ficticia + repetición = una solicitud; avisos internos; sin presupuesto/evento/cuenta. Solo PRUEBA y correo .invalid. |
| Efectivo100 particular | Modelo, lector, Edge, fiscal guardado y presentación implementados | Pruebas locales y SQL: base 1000, IVA 210, total 1210, reserva 0. Importación real desde Google completada: X26-P900001-v1, una sola condición guardada. Empresa conserva modalidad y reglas; no se inventa exención. |
| Vinculación de presupuesto | workflow.js publicado; quote-bridge v1 activa | JWT/roles y errores comprobados por HTTP. Revisión exacta, HMAC, caducidad, releer antes de autorizar e idempotencia comprobados con dobles. La lectura Google v44 y la importación han pasado por HTTP real; cambio de copia rechazado con 409. |
| Receptor firmado | ingest-accepted-quote v5 activa | Pruebas con dobles: firma, conflictos, impuestos, origen y repetición. Las dos importaciones históricas reales siguen intactas, más la nueva importación ficticia de efectivo. |
| Preparación del evento | RPC y UI publicados | Tres eventos ficticios preparados usando el RPC con rol administrativo simulado en SQL sobre la base real. Idempotencia y reserva bloqueada comprobadas con ROLLBACK. Sin cliente asignado al finalizar. |
| Paneles | admin, staff y portal publicados | Roles y aislamiento por HTTP con sesiones Auth ficticias; pruebas locales de navegación y presentación. Browser sin sesión muestra exclusivamente acceso privado. Nacho ha aportado capturas del panel y de la apertura del PDF de prueba; falta comprobación visual de Azahara y de clientes en móviles. |
| Documentos | import-event-document v4 activa; preflight de equipo y copia solo administrativa | PDF incorporado por Nacho y abierto en su panel; HTTP real: cliente asignado descarga con huella exacta, cliente ajeno y anónimo rechazados sobre objeto existente. Asignaciones técnicas retiradas. |
| Apps Script | Versión 45 publicada; selección contractual explícita | Workflow 41788989944 superado; puente firmado conservado. Las nuevas reglas contractuales se comprobaron con dobles, sin emitir contratos reales. |

App publicada: https://flamencoevents.github.io/Flamenco-Events-app/

Despliegue Pages del código principal: https://github.com/flamencoevents/Flamenco-Events-app/actions/runs/41733521042 (success, commit e86616dc4d36298e6bf1c01ac8674422b28050a7). La revisión documental y el control adicional de conflicto PDF se guardan posteriormente en main.

Publicación Apps Script: https://github.com/flamencoevents/flamenco-events-appscript/actions/runs/41786601991 (success; versión 44). Los intentos anteriores fallaron antes de subir código y han quedado superados.

## Funcionamiento implementado

Solicitud → aviso interno → llamada registrada → validación de datos → autorización expresa → registro de envío efectuado fuera de la app → aceptación comprobada. Los controles del servidor rechazan saltarse etapas. Ningún formulario crea/envía presupuestos ni activa clientes automáticamente.

Una solicitud aceptada permite seleccionar número, revisión y clave exactos de FE_Cola. La previsualización exige una única fila GENERADO y copia FE3 coherente. Esa condición de Sheets no acredita aceptación. La confirmación de equipo queda ligada al usuario y caduca a diez minutos; se relee la copia antes de importar y se rechazan cambios. Se conserva origen y desglose fiscal sin recalcular.

Preparar evento exige versión aceptada concreta. El evento queda contract_pending, sin cliente inicialmente y marcado PRUEBA. El cliente ve únicamente esa versión vinculada; no todas las revisiones de la solicitud. La asignación exige identidad cliente verificada y, en prueba, marca técnica de servidor. El comercial coordina repertorio/vestuario/horarios y tareas sin concederse administración ni cambiar propietario.

Los documentos se copian desde la fila exacta a almacenamiento privado, nunca a GitHub Pages. Importación solo administrativa, PDF hasta 10 MB, sin enlaces Drive públicos ni regeneración Canva. Otro PDF para el mismo tipo/versión se rechaza antes de subirlo. La pestaña FE_Contratos existe actualmente (metadatos de Sheets consultados el 5 de noviembre); esto por sí solo no verifica sus filas, PDF ni la importación contractual. La copia ficticia v1 de efectivo ya tiene un PDF técnico privado asociado; la v2 no tiene PDF. No se generaron contratos ficticios en Canva.

## Evidencia anterior y regresiones

Las pruebas siguientes corresponden al 3 de noviembre salvo indicación expresa. La nueva transferencia real del 4 de noviembre se detalla arriba.

- 25 tests Node de la app: receptor, flujo Edge con dobles, documentos, navegación y presentación. No son pruebas reales Google.
- 20 tests Node de Apps Script: adaptador/endpoint con dobles, incluida fiscalidad contra la función económica existente. Además pasan solicitudes, historial, PDF WhatsApp, formulario y contratos existentes. No se modificó economia.js ni plantillas aprobadas.
- `supabase/tests/continuation-rollback.sql`: base real con roles/JWT simulados localmente en SQL, usuarios ficticios, consentimiento ausente/nulo, cuotas, repetición, secuencia comercial, efectivo, evento idempotente, reserva bloqueada, límites comerciales y aislamiento de eventos/condiciones/metadatos documentales. Finaliza ROLLBACK.
- HTTP real public-enquiry: dos solicitudes ficticias independientes, cada una repetida sin duplicado. Referencias 55f22935-f89c-4011-a663-f3f918005cb2 y 997d4c49-7627-4734-b9bb-e647d6fc0b49. La primera sigue new; la segunda completó etapas comerciales **simuladas**, anotadas expresamente, sin llamadas ni envíos reales. Entonces ambas estaban sin presupuesto importado; el 4 de noviembre la segunda recibió la versión ficticia de efectivo descrita arriba.
- HTTP real con tres identidades técnicas temporales: cliente no usa puente 403; comercial no importa PDF 403 ni prepara evento 403; salto new→accepted 403; secuencia comercial autorizada 204 por etapa; falta autorización 422; revisión/clave inconsistente 422; lectura Google no publicada 502 sin escrituras.
- HTTP real con dos clientes técnicos: cada uno consulta un solo evento y sus condiciones; cero solicitudes y cero previews ajenos. Una petición de firma a objeto ajeno/inexistente devuelve 400 sin enlace. Esta última comprobación sola no acredita denegación de un PDF existente; lo complementan las pruebas SQL de RLS y dobles.
- Las identidades, sesiones y perfiles técnicos se retiraron. Los dos eventos se dejaron sin cliente. Cero administradores adicionales al finalizar. La primera preparación de usuarios técnicos tuvo un error de fecha ausente en identities; se corrigieron solo esos registros ficticios y las sesiones posteriores funcionaron. No se alteró SMTP ni cuentas reales.
- Browser: formulario público renderizado, sin antigua demo local; paneles comercial/administrativo muestran login sin datos privados. No se emitieron enlaces de correo.

## Datos reutilizables de prueba

| Origen | Registro | Resultado |
| --- | --- | --- |
| Prueba histórica firmada | 9999926 v1 · solicitud ca4ecea7-863f-4077-b5a9-20454aeb364b | Total 1000 / reserva 300, una condición aceptada; evento ficticio b27248d1-e4c4-489f-9f05-d448a373253c preparado. |
| Lectura histórica real FE_Cola | X26-P000004 v1 · solicitud 63310bc3-2785-4ecd-8b31-525a29578dc1 | Total 520 / reserva 0, referencia de origen intacta; evento ficticio c7fccf50-5de1-458c-b3af-04a3bee6b45e preparado. Aceptación comercial simulada. |
| Nueva pestaña FE_App_Pruebas | X26-P900001-v1 y -v2 | Copias ficticias FE3: 1210/0 e IVA210; 1331/0 e IVA231. v1 importada una sola vez y con PDF técnico privado preparado; v2 solo previsualizada y no importada. Sin envíos. |

La pestaña técnica tiene cabeceras A:L equivalentes a FE_Cola, encabezado congelado y nota de prueba. Se verificaron valores/formatos por API; no se realizó inspección visual de Google Sheets con cuenta iniciada. No se alteraron FE_Cola, fórmulas ni documentos de origen. Las copias técnicas no forman parte de las colas automáticas.

## Pendientes reales y siguiente acción

1. Circuito documental del presupuesto ficticio completado: origen firmado → importación administrativa → almacenamiento privado → descarga propia y denegación ajena. El recorrido contractual con PDF técnico ficticio se completó después, según la evidencia al final. Siguen pendientes la generación desde plantillas aprobadas y la firma real.
2. Nacho debe definir los requisitos de reserva formal, incluido el caso de reserva económica cero. La confirmación permanece bloqueada durante el modo prueba. Importar importes o aceptar comercialmente no confirma una reserva.
3. Captación real requiere revisión de datos/contacto, información de privacidad y consentimientos del negocio. La implementación actual recoge exclusivamente consentimiento técnico ficticio. Faltan comprobaciones visuales con sesiones personales y móviles Safari/Android.
4. Investigar si se repite el SOURCE_NOT_VERIFIED observado en una lectura paralela; la posterior lectura secuencial y el resto de operaciones fueron correctos. No se confirma todavía la causa de aquella respuesta.

Seguridad: tabla privada intake_limits cerrada deliberadamente a usuarios; solo service_role usa la cuota. El aviso existente de contraseñas filtradas deshabilitadas sigue pendiente de decisión de Auth. Se eliminaron índices duplicados y se indexó recorded_by, conservando restricciones únicas. Las migraciones anteriores y la nueva protección contractual siguen aplicadas. No se han leído ni incluido secretos en código o mensajes.

## Visibilidad contractual por estado · 5 noviembre 2026

- Nueva prueba reproducible `supabase/tests/contract-visibility-rollback.sql`, ejecutada satisfactoriamente sobre la base real con identidades y roles SQL simulados.
- Cliente propietario: contrato, metadatos PDF y fila Storage ocultos en draft/ready; visibles en sent/signed. Otro cliente: ocultos incluso en sent/signed. Comercial: lectura disponible, actualización de estado rechazada por RLS (cero filas). Cliente: no puede autocertificar la firma (cero filas).
- Para evaluar la política de Storage sobre una fila existente, se reclasificaron temporalmente los metadatos del presupuesto de prueba como contrato dentro de la transacción. No se modificaron bytes PDF ni se creó un PDF contractual. La plantilla usada en esta fixture solo permite ejercitar permisos; no acredita correspondencia contractual con efectivo100.
- Finalizó ROLLBACK. Consulta posterior: cero contratos, documento original quotation, evento sin cliente, cero usuarios de esta prueba y test_mode=true.
- No equivale a sesiones Auth reales ni a descarga HTTP de contrato. El circuito HTTP ya comprobado corresponde al presupuesto. Esta comprobación histórica quedó ampliada por el ensayo HTTP posterior descrito a continuación; la firma electrónica real sigue pendiente.
- Limitación histórica de esa comprobación SQL: el entorno de ejecución y navegador remoto no estaban disponibles. Quedó superada en el ensayo posterior documentado a continuación.


## Contrato técnico: importación, publicación y descarga reales · 5 noviembre 2026

- Acceso administrativo remoto comprobado mediante el perfil guardado de TinyFish. Importación y publicación realizadas desde el panel con sesión administrativa real; no se enviaron correos.
- PDF técnico independiente, sin validez comercial ni contractual: 2206 bytes, SHA-256 `e304d882c72d10b1f324fc5420969f605de23e7adfe888de3777d215cf7ffc91`. No reproduce las plantillas Canva ni certifica su contenido.
- Origen Drive privado `12q9JgnNti4OMWBhYceDAC3nHi10Be6ZI`, vinculado temporalmente en FE_Contratos!A4:I4 a X26-P900001-v1. Se verificó esa fila después de escribir. Tras importar se archivó como PRUEBA_TECNICA_ARCHIVADA, fuera de GENERADO, para excluir la fixture técnica del procesamiento habitual. No se tocaron las filas de contratos anteriores, fórmulas ni plantillas.
- Documento privado `26033a63-7537-4f12-a45d-4dcbf79ab95d`, contract v1, evento `e4a35ff8-2fca-4e23-83ed-ffb4ab3c45de`. El panel devolvió “PDF privado incorporado. Publicación del contrato pendiente de revisión”.
- Contrato de ensayo creado en draft con etiqueta técnica individual_reservation; esta etiqueta solo permite ejercitar permisos y **no acredita que esa plantilla sea adecuada para efectivo100**. La publicación desde el panel devolvió “Contrato publicado en el portal, sin envío automático de correo”, estado sent.
- Dos sesiones Auth ficticias reales por contraseña, sin correo: en draft, ambos clientes obtuvieron cero metadatos y denegación de firma de URL y descarga autenticada. En sent, el propietario obtuvo metadatos, enlace firmado y descarga; los 2206 bytes y la huella coincidieron con el PDF original. El otro cliente continuó bloqueado en todas esas vías. La ruta pública anónima devolvió 400, sin PDF.
- Asignación y creación del contrato de ensayo realizadas mediante rol administrativo simulado en SQL; importación/publicación mediante sesión administrativa de navegador; acceso de clientes mediante HTTP real. No equivale a prueba visual móvil ni a firma electrónica.
- También pasó en ROLLBACK una comprobación SQL sobre el objeto contractual existente, con estados draft/ready/sent/signed. Las firmas solo fueron valores simulados dentro de la transacción revertida.
- Limpieza confirmada: evento sin cliente, dos cuentas ficticias bloqueadas y sin contraseña utilizable, cero sesiones vigentes y cero refresh tokens utilizables. Credenciales locales retiradas. Se conserva el contrato técnico publicado, sin firma y sin destinatario activo, para revisión.
- Estado final: test_mode=true, bucket privado, evento contract_pending, sin reserva confirmada. El bloqueo anterior del entorno y navegador quedó superado; la demora de red no impidió completar el ensayo.
- Pendiente: circuito de generación contractual con plantillas aprobadas (incluida correspondencia de efectivo100), firma electrónica real y criterios definitivos de reserva. La prueba de privacidad del PDF contractual técnico ya está completada.

## Continuación autónoma · 5 noviembre 2026 · contratos y seguimiento

- Migraciones aplicadas: 20261105180052 y 20261105180802. La modalidad del contrato se comprueba contra la versión aceptada: no_vat_quote → no_vat; individual_reservation → individual_reservation; business_full_invoice → business_tax_detail. individual_full_invoice sigue bloqueada hasta aprobar su cláusula. El contrato técnico histórico de efectivo se conserva sin firma y sin cliente, como evidencia anterior.
- La firma ahora exige integración habilitada y recibo verificado ligado al contrato y documento exactos. Configuración y recibos están en app_private, sin acceso de anon/authenticated y sin endpoint de recepción expuesto. Proveedor null y verified=false: no hay firma electrónica operativa ni contratación de servicio. El futuro adaptador deberá comprobar webhook, firmante, huella y evento antes de registrar recibos.
- Avisos internos automáticos a administración/comercial al crear borrador y cambiar a preparado/publicado/firmado. Repetir el mismo estado no duplica avisos. No hay correo, WhatsApp nuevo, cron ni sincronización general habilitada.
- Una restricción única impide duplicar contratos por evento. Las nuevas incorporaciones PDF guardan SHA-256 de los bytes y referencia de origen. Los documentos históricos conservan sus metadatos previos; no se inventaron huellas ni se regeneraron.
- Nuevas etiquetas de estados y documentos en español/inglés, siguiente acción por evento, plantilla derivada del presupuesto y mejoras de anchura en móvil. El selector administrativo consulta solo clientes verificados, activos y compatibles con prueba; los perfiles retirados ya no se ofrecen. No equivale a una revisión visual de Safari/iPhone ni a traducción integral de los paneles.
- Apps Script: generación bloqueada para particular/particular_base con efectivo100 pendiente de cláusula; comandos y selector genérico distinguen número+clave+revisión; PDF nombrado con revisión para impedir reutilizar el archivo anterior. No se tocaron las fórmulas, las plantillas originales ni las reglas recientes de Bizum.
- Canva: leídas las tres plantillas y verificado dataset. Se creó una copia empresarial de tres páginas con todos los datos personales, contactos y banco sustituidos por datos ficticios: diseño DAHaEmUPAAE. Lectura posterior sin placeholders pendientes y con base 1000, IVA 210, IRPF 150, total 1060. Prueba de generación mediante conector Canva; todavía no verifica exportación PDF y recorrido completo desde la cola Apps Script. No se incorporó esa copia a un evento ni se envió.
- Validación: 31 pruebas Node de app; 20 del puente Apps Script más baterías de solicitudes/historial/PDF/formulario/contratos; tres pruebas SQL con roles simulados y ROLLBACK (contract-safety, documents-contracts, contract-visibility). Los nuevos controles SQL rechazaron plantilla incorrecta, firma inventada y directorio administrativo desde comercial; avisos exactos y sin duplicados. No se crearon accesos Auth persistentes en esta continuación.
- Asesores: sin nuevas advertencias de seguridad. RLS sin políticas en tablas app_private es deliberado (cerradas); persiste el aviso previo de protección de contraseñas filtradas desactivada.
- TinyFish no se volvió a ejecutar en esta continuación. Consulta de cuenta: saldo 10.696 USD y recarga automática desactivada. Histórico: cuatro ejecuciones, 19 pasos; coste teórico del agente 0.304 USD, más minutos de navegador si se facturan. No acredita un cargo a tarjeta.

### Pendientes que requieren decisión o acceso

1. Aprobar texto y plantilla del particular con factura completa/efectivo100; no se ha supuesto que tenga reserva.
2. Elegir proveedor de firma, condiciones de uso y presupuesto; ningún proveedor configurado ni coste nuevo autorizado.
3. Definir confirmación formal cuando la reserva económica es cero, y los demás requisitos definitivos. Continúa bloqueada en prueba.
4. Completar exportación de la copia de Canva y ensayo desde la cola sin envío; el conector disponible genera y lee diseños, pero no expone exportación PDF. No se han creado rutas privilegiadas de diagnóstico.
5. Revisión visual en sesiones personales/móvil, traducción completa, privacidad/consentimientos reales y la incidencia histórica de lectura paralela SOURCE_NOT_VERIFIED.

### Publicación y límites comprobados al cerrar esta continuación

- App: commit edc8e28697f2da0f1dca8920123b119af8cc9958. GitHub Pages: ejecución 42081965306. Supabase import-event-document v5 ACTIVE, autenticación propia conservada. Las dos migraciones nuevas están aplicadas.
- Apps Script: código guardado en commit 0ebba675b86f375c228cae1dea6f84fe9c8426d0. Workflow 42081970873 superó sintaxis y todas las pruebas, pero Google devolvió invalid_rapt antes de subir/publicar. Las nuevas protecciones de Contratos.js todavía NO están confirmadas en la implementación de WhatsApp. No se ha modificado esa implementación en este intento.
- Para publicar ese código hace falta renovar la autorización Google usada por CLASPRC_JSON en GitHub; no se han solicitado ni mostrado secretos.
- Verificación adicional en ROLLBACK: SHA-256 inválido y segundo contrato para el mismo evento rechazados.
- Inspección del navegador disponible: la página administrativa abre en modo prueba y solicita acceso; este navegador no comparte la sesión TinyFish. No se ha solicitado otro correo de acceso. No se confirma aquí el renderizado autenticado o móvil de las nuevas pantallas.

## Recuperación limitada de lecturas · 5 noviembre 2026

- Un solo reintento total por lectura firmada ante fallo de transporte o HTTP 502/503/504. El presupuesto, documento y revisión se mantienen exactos. No se reintentan escrituras, límites 429, rechazos firmados, firmas inválidas ni respuestas de otra operación.
- 32 pruebas Node superadas con dobles. La nueva prueba simula caída puntual y persistente, 503, 429, firma alterada y rechazo de origen: verifica número de peticiones y ausencia de escrituras en los errores. No es una reproducción real de la incidencia histórica SOURCE_NOT_VERIFIED, cuya causa permanece sin confirmar.
- Desplegados quote-bridge v2 e import-event-document v6 con autenticación y permisos anteriores conservados; solo cambia su lectura remota.
- El último workflow exitoso de Apps Script corresponde a documentación sin publicación (42082230893). No resuelve el invalid_rapt del intento de publicación 42081970873. No se repitió una publicación sabiendo que falta autenticación personal.
- Sin nuevas ejecuciones TinyFish, nuevos usuarios o envíos externos. Modo prueba y reservas bloqueadas.
