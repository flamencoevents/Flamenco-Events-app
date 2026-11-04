# Estado verificado · 4 noviembre 2026

**MODO PRUEBA ACTIVO.** No se han contactado clientes, enviado presupuestos/contratos ni invitado clientes reales. La sincronización general continúa desactivada. Nacho conserva la única administración; Azahara conserva el único perfil sales tras retirar identidades técnicas.

## Documentos y contratos · avance del 4 noviembre 2026

- Apps Script publicado en **versión 45**, workflow https://github.com/flamencoevents/flamenco-events-appscript/actions/runs/41788989944. El flujo contractual ya no selecciona la última revisión: si existen varias filas/revisiones GENERADO, exige `/contrato NÚMERO vN`. Comprueba número, revisión, clave y copia FE3, y rechaza copias no ficticias mientras siga prueba. Una única revisión continúa siendo compatible con el comando anterior. Los comandos con revisión mal escrita devuelven instrucciones.
- Se han conservado las tres plantillas Canva aprobadas; se verificaron sus metadatos sin modificarlas ni exportarlas. Nombres observados: Particular sin IVA (3 páginas), Empresa con IVA e IRPF (3) y Particular con reserva facturada (4). Esta revisión de metadatos no certifica todo su contenido jurídico.
- PDF técnico creado con datos exclusivamente ficticios, rotulado SIN VALIDEZ COMERCIAL NI CONTRACTUAL; 2663 bytes. Drive confirma shared=false y solo permiso de propietario. Vinculado únicamente a FE_App_Pruebas!J2, fila X26-P900001-v1, conservando el resto de la fila y las fórmulas. Archivo: `1CyKLInq2bsYgRwz5CVtTmfnWVoF-Y_B6`. Huella SHA-256: `c985adb2ad644eb392ae4ba57c395e490c4ab230cc0ae4a37ad3c6bfaeb03f1d`.
- Nueva comprobación documental previa en `import-event-document`: un miembro del equipo puede comprobar el archivo exacto; devuelve tamaño, versión y huella, **sin bytes PDF, URL ni escrituras**. La incorporación real continúa exigiendo administrador. La pestaña técnica se rechaza fuera de modo prueba.
- HTTP real con identidad comercial ficticia: Drive → Apps Script firmado → Supabase devolvió 200 y la misma huella/tamaño que el archivo local. El intento comercial de importar devolvió 403 y la petición sin sesión 401. El bucket continúa privado y con cero objetos: esto verifica lectura e integridad de origen, **no importación ni descarga cliente de un PDF ya almacenado**.
- La identidad técnica de esta comprobación quedó bloqueada, sin contraseña utilizable y sin rol comercial; su perfil se conserva como PRUEBA DOCUMENTAL DESACTIVADA · NO ASIGNAR. El intento de eliminarla no se ejecutó porque expiró la confirmación; se aplicó la alternativa de desactivación sin ampliar permisos. El servidor ahora impide asignar identidades bloqueadas o eliminadas a eventos.
- Nueva migración `20261104073434`: el contrato toma el número del presupuesto enlazado al evento, rechaza otro número y otra revisión PDF; comienza en borrador y exige proveedor, fecha y referencia para registrar firma. No se han cambiado las condiciones de reserva ni las fórmulas.
- `supabase/tests/documents-contracts-rollback.sql` pasó en la base real con roles SQL simulados: número incorrecto, revisión PDF incorrecta, inserción sin borrador, firma incompleta, alteración de contrato firmado, reserva en prueba e identidad bloqueada. Solo utilizó metadatos ficticios, sin PDF real ni firma real, y terminó ROLLBACK. También volvió a pasar continuation-rollback.sql.
- 28 pruebas locales de la app superadas. Apps Script: 20 pruebas del puente y baterías existentes, ampliada la de contratos con revisión explícita, ambigüedad, borrador, copia alterada, marca ficticia y sintaxis de comando.

### Paso personal imprescindible para continuar el ensayo documental

Entrar como Nacho en https://flamencoevents.github.io/Flamenco-Events-app/admin.html. En el evento **PRUEBA · Efectivo 100 % · X26-P900001**, pulsar **Incorporar PDF del presupuesto**. El origen y el PDF ya están preparados. Esta acción requiere su sesión personal: no se han creado otros administradores ni rutas de prueba que eludan la autorización.

Después se podrá comprobar por HTTP un objeto privado realmente existente con dos clientes ficticios, manteniendo sus asignaciones limitadas al ensayo y retirándolas después. No confundir ese paso con confirmar reserva o publicar un contrato.

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
| Paneles | admin, staff y portal publicados | Roles y aislamiento por HTTP con sesiones Auth ficticias; pruebas locales de navegación y presentación. Browser sin sesión muestra exclusivamente acceso privado. No se ha comprobado visualmente una sesión personal de Nacho/Azahara. |
| Documentos | import-event-document v4 activa; preflight de equipo y copia solo administrativa | Lectura real e integridad de PDF privado de Drive verificadas. La copia al bucket y descarga cliente de objeto existente requieren el paso personal indicado arriba. |
| Apps Script | Versión 45 publicada; selección contractual explícita | Workflow 41788989944 superado; puente firmado conservado. Las nuevas reglas contractuales se comprobaron con dobles, sin emitir contratos reales. |

App publicada: https://flamencoevents.github.io/Flamenco-Events-app/

Despliegue Pages del código principal: https://github.com/flamencoevents/Flamenco-Events-app/actions/runs/41733521042 (success, commit e86616dc4d36298e6bf1c01ac8674422b28050a7). La revisión documental y el control adicional de conflicto PDF se guardan posteriormente en main.

Publicación Apps Script: https://github.com/flamencoevents/flamenco-events-appscript/actions/runs/41786601991 (success; versión 44). Los intentos anteriores fallaron antes de subir código y han quedado superados.

## Funcionamiento implementado

Solicitud → aviso interno → llamada registrada → validación de datos → autorización expresa → registro de envío efectuado fuera de la app → aceptación comprobada. Los controles del servidor rechazan saltarse etapas. Ningún formulario crea/envía presupuestos ni activa clientes automáticamente.

Una solicitud aceptada permite seleccionar número, revisión y clave exactos de FE_Cola. La previsualización exige una única fila GENERADO y copia FE3 coherente. Esa condición de Sheets no acredita aceptación. La confirmación de equipo queda ligada al usuario y caduca a diez minutos; se relee la copia antes de importar y se rechazan cambios. Se conserva origen y desglose fiscal sin recalcular.

Preparar evento exige versión aceptada concreta. El evento queda contract_pending, sin cliente inicialmente y marcado PRUEBA. El cliente ve únicamente esa versión vinculada; no todas las revisiones de la solicitud. La asignación exige identidad cliente verificada y, en prueba, marca técnica de servidor. El comercial coordina repertorio/vestuario/horarios y tareas sin concederse administración ni cambiar propietario.

Los documentos se copian desde la fila exacta a almacenamiento privado, nunca a GitHub Pages. Importación solo administrativa, PDF hasta 10 MB, sin enlaces Drive públicos ni regeneración Canva. Otro PDF para el mismo tipo/versión se rechaza antes de subirlo. En la revisión anterior no había cola FE_Contratos; su disponibilidad actual deberá comprobarse antes del ensayo documental. La copia ficticia v1 de efectivo ya tiene un PDF técnico privado asociado; la v2 no tiene PDF. No se generaron contratos ficticios en Canva.

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

1. Nacho debe ejecutar la incorporación del PDF preparado desde su sesión administrativa, según el paso personal indicado arriba. Después comprobar descarga propia y denegación ajena de un objeto existente con clientes A/B ficticios. La lectura e integridad Drive→Apps Script→Supabase ya están verificadas; el circuito de almacenamiento/descarga completo sigue pendiente.
2. Nacho debe definir los requisitos de reserva formal, incluido el caso de reserva económica cero. La confirmación permanece bloqueada durante el modo prueba. Importar importes o aceptar comercialmente no confirma una reserva.
3. Captación real requiere revisión de datos/contacto, información de privacidad y consentimientos del negocio. La implementación actual recoge exclusivamente consentimiento técnico ficticio. Faltan comprobaciones visuales con sesiones personales y móviles Safari/Android.
4. Investigar si se repite el SOURCE_NOT_VERIFIED observado en una lectura paralela; la posterior lectura secuencial y el resto de operaciones fueron correctos. No se confirma todavía la causa de aquella respuesta.

Seguridad: tabla privada intake_limits cerrada deliberadamente a usuarios; solo service_role usa la cuota. El aviso existente de contraseñas filtradas deshabilitadas sigue pendiente de decisión de Auth. Se eliminaron índices duplicados y se indexó recorded_by, conservando restricciones únicas. Las migraciones anteriores y la nueva protección contractual siguen aplicadas. No se han leído ni incluido secretos en código o mensajes.
