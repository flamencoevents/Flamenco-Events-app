> Actualización del 6 noviembre: el bloqueo XLSX descrito en el historial de este
> documento se resolvió en copia aislada con empaquetado conservador; ver
> [evidencia vigente](circuito-whatsapp-cuentas.md). Registro local de operaciones
> preparado con 12 pruebas nuevas; sin escritura remota ni integración desplegada.

> **Ensayo local con diario · 6 noviembre, continuación:** `accounts_2027_trial.py`
> conecta el escritor MJS existente al registro SQLite con exclusión de proceso,
> recuperación y auditoría independiente. Ocho pruebas de integración sintéticas
> locales superadas. Preparado, sin despliegue ni conexión a Drive/servidor.
> [Reproducción y límites](circuito-whatsapp-cuentas.md#ensayo-local-coordinado--6-noviembre-2026).

> **Conciliación de servidor · 6 noviembre, continuación:** import-event-document
> v8 ACTIVE añade comparación de bytes del PDF privado almacenado con el origen,
> tras validar ruta, revisión y cifras aceptadas. Bundle comprobado, autenticación
> conservada; 83 pruebas Node en GitHub superadas, 30 afectadas locales. Lectura
> positiva probada con dobles; falta ensayo Auth/Google/Storage real de esta
> operación. Sin escritura XLSX ni activación contable.
> [Alcance y evidencia](conciliacion-servidor-cuentas.md).

# Estado verificado · 5 noviembre 2026

> **Listado compartido y balances · 6/11/2026:** incorporada lectura interna de
> ocho eventos del libro 2027 al principio de administración/comercial, con cinco
> columnas y enlaces separados. Balances económicos queda preparado solo para
> administración, por ejercicios y sin cálculos. 66 pruebas web locales;
> comprobación RLS en ROLLBACK. [Estado y límites](listado-eventos-cuentas.md).

> **Actualización 6/11/2026 · circuito de cuentas:** preparado adaptador local
> de las filas FE3/FE_Contratos a propuesta mensual. 40 pruebas sintéticas
> locales superadas. El empaquetado conservador resuelve el rechazo anterior:
> la auditoría independiente pasa en copia aislada, sin cambios ajenos a C:H.
> No hay escritor contable
> desplegado ni balances modificados. [Evidencias y límites](circuito-whatsapp-cuentas.md).

> **PRIORIDAD VIGENTE · 5/11/2026:** web de gestión empresarial primero; adaptación a app después. Se amplía el alcance para enlazar presupuestos, contratos, seguimiento económico e histórico y balances. Ver [web-gestion-empresa.md](web-gestion-empresa.md). El progreso porcentual anterior no mide este nuevo alcance.

> Estado vigente: consultar las últimas secciones fechadas de este documento. Apps Script v54 y quote-bridge v4 están verificados en la continuación del 6 de noviembre; las versiones y bloqueos anteriores se conservan como evidencia histórica. Siguen pendientes la generación contractual completa desde plantillas aprobadas, la firma mediante proveedor y las decisiones de reserva formal.

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

## Autorización Google renovada y publicación completada · 5 noviembre 2026

- Nacho actualizó privadamente CLASPRC_JSON. Se repitió el intento fallido 42081970873 con las credenciales actuales.
- Nuevo intento completado correctamente: sintaxis, todas las baterías de pruebas, acceso a Google, subida y publicación. Logs: 15 archivos subidos y despliegue existente actualizado a **versión 51**, commit 0ebba675b86f375c228cae1dea6f84fe9c8426d0.
- Evidencia: https://github.com/flamencoevents/flamenco-events-appscript/actions/runs/42081970873 . El bloqueo invalid_rapt anterior queda resuelto para este intento. La autorización temporal del ejecutor se eliminó al terminar.
- Las protecciones de generación contractual por modalidad y revisión de Contratos.js ya están publicadas. Esta publicación no es una nueva prueba real de generación Canva → PDF → app.
- Modo prueba conservado; no se activaron sincronización general, clientes reales, firmas ni reservas. Sin nuevas ejecuciones TinyFish.

## Portal bilingüe y respuestas tardías · 5 noviembre 2026

- Portal cliente: controles de avisos, presupuesto, pagos, tareas, documentos y propuestas usan el idioma seleccionado; cabecera y atributo lang se actualizan. Se traducen las etiquetas fiscales del presupuesto. Los textos introducidos por usuarios y los avisos guardados no se traducen automáticamente.
- Respuestas de conversaciones ligadas a identidad y época de refresco: si cambia la cuenta o se invalida la sesión antes de terminar la consulta, su resultado no se dibuja.
- 34 pruebas Node superadas. Las nuevas pruebas renderizan un evento ficticio en español/inglés, comprueban escape HTML y simulan respuestas tardías tras cambio de cuenta o refresco. Son pruebas de renderizado con dobles, no sesiones Auth reales ni Safari.
- No se crearon usuarios, enviaron correos, activaron servicios de firma ni ejecutó TinyFish. Google v51 ya publicado; su bloqueo de autenticación anterior sigue resuelto.
- Preparada comparativa de dos proveedores en docs/firma-opciones.md con fuentes oficiales consultadas el 5/11/2026. No se seleccionó, abrió ni contrató ninguna cuenta.
- Pendientes: exportación Canva no disponible por conector; texto contractual efectivo100; proveedor de firma y acceso a sandbox; requisitos de reserva cero; revisión móvil autenticada y traducción integral del panel comercial/administrativo.

### Evidencia de publicación del portal

- Commit 21d8889a721c95d25038fd01cdba44f27fdc55d5 publicado por GitHub Pages: ejecución 42111220294, trabajos build y deploy completados con success.
- Comprobación interactiva del portal público publicado: página de acceso carga sin error, aviso MODO PRUEBA · TEST MODE visible, cambio ES→EN actualiza cabecera, títulos, campo de correo y botón de acceso. No se solicitó ningún correo ni se abrió sesión.
- Esta comprobación pública no acredita recorrido privado autenticado, firma, reserva formal ni funcionamiento en iPhone real.

## Envíos concurrentes y descargas tras cambio de sesión · 5 noviembre 2026

- Portal cliente: bloqueo local por cuenta, evento y tipo de envío mientras se guarda un mensaje o propuesta. Evita escrituras simultáneas por doble pulsación, incluso desde formularios reconstruidos. No es una garantía de idempotencia de servidor entre recargas.
- Se deshabilitan botones y se marca aria-busy durante la operación; texto conservado ante rechazo o fallo de red, controles restaurados al terminar. Los fallos de resultado incierto no se reintentan automáticamente: se pide comprobar el estado antes de repetir.
- Las respuestas de escritura de una cuenta anterior no limpian formularios, muestran avisos ni cargan conversaciones en la nueva sesión. Las respuestas de descarga privada tampoco abren documentos tras cambiar de cuenta o invalidar el refresco. Se conservan RLS, bucket privado y expiración de 60 segundos.
- 39 pruebas Node superadas con dobles: concurrencia de mensajes/propuestas, rechazo y fallo de transporte, recuperación del bloqueo, cambios de cuenta durante escritura y descarga, descarga válida y traducciones existentes. Sin nuevas sesiones Auth ni prueba HTTP real de estos cambios; no se repitieron los ensayos históricos de importes y aislamiento real.
- Código publicado: commit 62749c92d71578686240b6125f8b9dcb7ebd8c9b; GitHub Pages 42112791130 con build, deploy e informe final completados correctamente. Evidencia: https://github.com/flamencoevents/Flamenco-Events-app/actions/runs/42112791130 . No se ha realizado una nueva inspección visual autenticada del portal. Modo prueba activo, sin cambios económicos, plantillas, permisos, proveedores, sincronización general ni envíos reales. TinyFish no ejecutado.

## Resultado de la revisión contractual · 5 noviembre 2026

- Matriz y propuesta revisables en https://github.com/flamencoevents/flamenco-events-appscript/blob/main/docs/contratos-correspondencia.md . Se verificaron por lectura los tres originales y las tres copias Canva; no se modificaron. Datasets reales contrastados con el generador.
- Commit Apps Script 832a952d4247b6c3692d8a12f6f3fb7cbae59103 publicado en la implementación existente como **versión 52**. Workflow 42114335647: sintaxis, baterías, acceso Google, subida de 15 archivos, publicación y eliminación de credenciales del ejecutor completados correctamente. Evidencia: https://github.com/flamencoevents/flamenco-events-appscript/actions/runs/42114335647 . No basta con la subida: logs confirman @52.
- Empresa+efectivo100 ya no puede generar una cláusula bancaria incompatible. Particular efectivo100 sigue bloqueado. La propuesta privada de cláusula conserva base, IVA, IRPF, total, clave y revisión; no está conectada a generación. Proponer cobro al finalizar no equivale a aprobarlo.
- Pasa la matriz de 15 combinaciones y las baterías existentes, con dobles; 20 tests del puente superados. Sin nuevo PDF, ensayo HTTP real ni firma. No se tocaron fórmulas ni plantillas originales.
- Pendiente de Nacho: aprobar momento de cobro efectivo100, consecuencias de cancelación sin anticipo y requisitos de confirmación sin reserva económica. Continúa MODO PRUEBA, sin clientes ni envíos reales.

## Cambio de prioridad: gestión empresarial web

- Nacho prioriza la web de gestión completa y posterga la adaptación a app. Se conserva el trabajo y el modo prueba.
- Localizados en la cuenta Flamenco Events el seguimiento económico anual y otra fuente de fechas cerradas. Inspeccionados metadatos, cabeceras y rangos acotados; no se modificó ningún libro.
- Se identificó número de presupuesto en el seguimiento económico como posible enlace; no se ha validado su unicidad ni conciliado el histórico. Los balances no están integrados todavía.
- Alcance, fases y criterios de aceptación en docs/web-gestion-empresa.md. Las cifras reales y referencias de los nuevos libros privados no se publican en el repositorio.

## Preparación de entrada web de gestión · 5 noviembre 2026

- Panel administrativo convertido en entrada de gestión con navegación a funciones existentes. La integración histórica/balances sigue pendiente y se indica expresamente.
- La raíz HTTPS de gesion.flamencoevents.net queda preparada para abrir admin.html; entradas sales/client redirigen a su área tras comprobar perfil. El dominio actual GitHub y la web IONOS conservan su navegación.
- 47 pruebas Node superadas con dobles. Nuevos casos: host exacto, roles, denegación de perfil desconocido, invalidación de respuesta tardía y enlaces existentes. No hay una nueva prueba Auth real de subdominio.
- No se activó dominio personalizado, DNS ni callbacks Supabase. La configuración GitHub Pages es accesible por sesión existente, pero IONOS solicita autenticación; DNS y certificado no están comprobados. No se ha añadido CNAME al repositorio para no redirigir la URL activa antes de completar DNS.
- Requisito añadido: enlace Espacio cliente en la web pública solo cuando esté verificado y se autorice uso real. No se editó IONOS ni se emitieron correos. Detalles en docs/dominio-gestion.md.
- Publicado commit 6f711de977cd01ddedcc89f2c4def971c594b425 mediante Pages 42120655796: build y deploy correctos. Verificación interactiva del admin publicado: título Gestión de empresa, aviso MODO PRUEBA y acceso privado sin datos. No se abrió sesión ni emitió correo. Modo prueba y permisos de servidor conservados.

## Bandeja de origen WhatsApp · 5 noviembre 2026

- Preparada bandeja interna de presupuestos/revisiones y estado contractual exacto, consulta paginada a petición y selección de referencia sin aceptación/importación automática. Encaja en el circuito de importación existente tras llamada, autorización, envío y aceptación. Mapa de destinos y pendientes en docs/integracion-whatsapp-web.md.
- Filtro ficticio en modo prueba y doble validación en Apps Script/Edge. Sin transferir raw snapshots, identidades contractuales, PDF, secretos ni URLs Drive. Contratos múltiples requieren revisión; no se elige la última versión.
- 52 pruebas Node de app y 23 del puente con dobles superadas; pasan también las cinco baterías Apps Script. Incluyen solo lectura sin escrituras, roles/anon, modos y referencias, respuesta HMAC alterada, paginación, campos limitados, escape y descarte por cambio de cuenta. No es una nueva demostración Auth/HTTP real.
- Corrección de nombre previsto a gestion.flamencoevents.net. Activación manual exclusivamente por Nacho al finalizar la web. El acceso IONOS ya no es un bloqueo del desarrollo y no se vuelve a solicitar; no hay cambios DNS/CNAME/callbacks.
- Código preparado y publicación en curso; registrar al final la versión Apps Script y estado de Edge/Pages. Se conservan modo prueba, sincronización general apagada y ausencia de nuevos clientes/envíos/costes contratados. El detalle económico completo y balances siguen pendientes.

## Publicación verificada del inventario WhatsApp

- Apps Script **v53** publicado (commit b597c314c2f60bf6d2c9042b5f0597cb51c0beae, workflow 42123431351). Subida y actualización de implementación comprobadas por logs @53; credenciales del ejecutor retiradas.
- quote-bridge **v3 ACTIVE** en Supabase; se comprobó el bundle desplegado con catálogo y validación staff anteriores conservados.
- Web publicada desde commit 7aa9e2853da2ca6087d79fbf997dd4acbda9a4ec, con funcionalidad incorporada en 60fa8a81fa899e29af3c0a503f89f032076b27f1. GitHub Pages 42123653296: build y deploy success. La bandeja está dentro de Presupuestos y eventos, tanto en administración como comercial.
- 52 pruebas Node app y 23 puente con dobles; cinco baterías Apps Script y sintaxis correctas. No se ha realizado una nueva consulta del catálogo por HTTP con sesión Auth real ni revisión visual autenticada; el despliegue no sustituye esa prueba.
- Drive conserva las carpetas y originales del circuito WhatsApp. La bandeja informa referencia PDF guardada, no disponibilidad comprobada. La revisión/importación privada existente comprueba el PDF exacto antes de incorporarlo; no se mueve ni regenera el original ni se expone su enlace.
- Pendiente: integración estructurada completa de datos operativos/económicos, conciliación del histórico, balances, circuito contractual desde plantillas y firma. No se ha declarado terminada toda la integración. Modo prueba y sincronización general apagada; sin nuevos usuarios, correos, WhatsApp, documentos, cambios DNS o costes contratados.

## Detalle de origen publicado · 6 noviembre 2026

- Consulta source_detail publicada en Apps Script **v54** (commit 2d80f0b87349934cdc8b00843362ff703b3deff6, workflow 42129074849; logs @54) y quote-bridge **v4 ACTIVE**. Se comprobó el bundle con validación de detalle y comprobación staff conservada. Sin cambios de RLS, permisos SQL o claves.
- Botón Consultar detalle guardado dentro de Origen WhatsApp. Código de interfaz e52350a0865b555fb0f94bfc6c152f0a388cff1a, incluido en 0784fad1c363184e9431430e477117350e5b686a; Pages **42129340295**, build y deploy completados correctamente. La ejecución previa fue cancelada al entrar una revisión documental posterior; no se tomó como prueba final de publicación.
- Servicios/descripciones, modalidad y cifras fiscales, reserva y saldo previstos se leen de clave/revisión exactas. Costes/logística y parámetros internos solo para administración, filtrados en servidor; comercial no puede pedirlos modificando include_costs. Se conserva cero, ausencia y ajustes negativos; sin recálculo ni suma entre niveles.
- Huella SHA-256 del JSON consultado actual. No prueba una incorporación o aceptación histórica de todo el desglose. El campo calculo.real se muestra como Neto previsto según cálculo, nunca cobro o beneficio acreditado.
- **56 tests Node app y 25 puente con dobles superados**, además de las cinco baterías Apps Script y sintaxis. Comprobaciones nuevas: exactitud/hashes, tipos, duplicados, revisión y modo, escalada de costes, campos privados eliminados, escape y descarte de respuestas de otra página. No hay una nueva prueba HTTP con sesión Auth real ni revisión visual autenticada de este botón.
- Las fallas de las operaciones GitHub de referencia/creación se resolvieron guardando archivos existentes por Contents API tras verificar el estado. Código y pruebas están en main; especificación en docs/integracion-whatsapp-web.md. Ningún cambio perdido ni fuerza sobre trabajo ajeno.
- Sin escrituras contables, nuevos accesos, emails/WhatsApp, PDFs nuevos o cambios de plantillas/fórmulas. Drive y modo prueba conservados, sincronización general apagada. Activación de gestion.flamencoevents.net manual por Nacho al finalizar.
- Pendientes: persistir por evento el desglose aprobado con versión/auditoría, conciliar histórico y movimientos reales, y comprobar balances. La consulta desplegada no equivale a completar esas tareas.


## Cuentas 2027: conciliación sin escrituras · 6 noviembre 2026

Implementados tools/accounts_2027.py, trece pruebas sintéticas y workflow de comprobación automática. Permiten leer el XLSX y preparar propuestas exclusivamente ficticias, ligadas a evento/presupuesto/contrato exactos; no modifican libros ni ejecutan servicios. GitHub Actions 42206658541: success. La lectura de la copia descargada y una propuesta ficticia conservaron su SHA-256 antes/después.

No contiene bloque ENERO; se rechazan meses ausentes y el último bloque sin límite auditado. Se comprobaron fórmulas fuera de A:Q y se protege toda la fila. No se cambia el libro para resolverlo. Las propuestas no acreditan cierre, firma o cobro; no rellenan IVA ni movimientos reales y permanecen pending_review/writable=false.

Código guardado y probado; no hay nueva integración desplegada en Apps Script/Supabase ni cambio visual del panel. Falta escritor XLSX preservador, conciliación de fórmulas/estilos, ensayo de escritura en copia y conexión autenticada con el registro privado de operaciones. Detalles y ejecución: [web-gestion-empresa.md](web-gestion-empresa.md). MODO PRUEBA y sincronización general desactivada conservados; sin datos reales publicados ni comunicaciones.


## Continuación encadenada: ensayo XLSX y conservación · 6 noviembre 2026

Se encadenaron implementación, pruebas y guardado sin nueva confirmación rutinaria. Preparado ensayo de escritura exclusivamente en copia (tools/accounts_2027_roundtrip.mjs), pero el importador disponible falló al abrir el XLSX descargado: avisos de sheetId ausente y Sheet not found; causa interna no confirmada. No hay copia exportada válida, conservación tras escritura ni interfaz nueva verificada. El original mantiene la misma huella.

Completado independientemente tools/accounts_2027_verify.py y ocho pruebas adicionales: rechaza cambios ajenos, pérdida de fórmulas, estilos/enlaces/estructura alterados y datos propuestos ausentes o incorrectos. Veintiuna pruebas locales totales y sintaxis MJS pasaron; workflow 42207740208 success. Una copia idéntica al origen fue correctamente rechazada por no contener el registro ficticio esperado. Son pruebas sintéticas y lectura local; no nuevas pruebas Auth/HTTP ni escritura Drive.

Código guardado; ningún escritor desplegado, Apps Script/Supabase sin cambio funcional. Modo prueba y sincronización general apagada. Bloqueo concreto: importación conservadora del XLSX; continúan pendientes escritura y revisión visual en copia y enlace transaccional autenticado. Reproducción y límites en docs/web-gestion-empresa.md.


## Continuación: registro local de operaciones · 6 noviembre 2026

Preparado `tools/accounts_2027_ledger.py` y 12 pruebas nuevas, todas superadas
localmente. Evita duplicados y conflictos y serializa ensayos del mismo libro;
completa una operación solo después de auditar la copia. No autentica usuarios,
no escribe XLSX ni llama a servicios. No está conectado al circuito remoto.
Evidencia, reproducción y límites: [circuito-whatsapp-cuentas.md](circuito-whatsapp-cuentas.md#registro-local-de-operaciones--6-noviembre-2026).
Modo prueba, libro real intacto y sincronización general apagada. No hay nuevo
despliegue Apps Script/Supabase ni cambio funcional en el panel.


## Revisión de continuidad · 7 noviembre 2026

El commit 95cf07646ae6a237b78e1658bf394ab80127e0a1 guarda en
`tools/ContractIntegration.js` una revalidación de PDF y referencia de cuentas
incluso para entradas INTEGRADO. Leído el diff: compara huella y destino antes
de aceptar un reintento; el fallo queda PENDIENTE. Esta lectura no demuestra
publicación en Apps Script ni ejecución con Drive real.

La conexión bandeja contractual → seguimiento comercial anunciada en el chat no
tiene todavía cierre verificable en estos documentos. No tratar el anuncio como
implementación terminada ni la presencia de PDF como aceptación, firma o cobro.
Próxima revisión: inspeccionar el generador, receptor y pruebas actuales de esa
conexión, comprobar recuperación sin duplicados y registrar despliegue aparte.
No repetir la supuesta actividad concurrente como bloqueo sin evidencia nueva.

Esta continuación solo concilia documentación con el código guardado: sin pruebas
repetidas, despliegues, sesiones, comunicaciones o escrituras en cuentas. MODO
PRUEBA y sincronización general apagada siguen siendo condiciones obligatorias.


## Modo de integración contractual explícito · 7 noviembre 2026

ContractIntegration.js exige ahora FE_APP_TEST_MODE exactamente true (cadena)
antes de activar propiedades/triggers o adquirir bloqueo para integrar. Ausencia,
vacío, false y valores desconocidos se rechazan: antes solo false bloqueaba.
Prueba nueva tests/contract-integration-mode.test.cjs superada localmente con
node --test tests/contract-integration-mode.test.cjs: seis modos inválidos,
ambas entradas y cero efectos. Código y prueba preparados; NO desplegados.
No se crearon triggers, sesiones, documentos ni comunicaciones. Sin escritura
remota, CUENTAS 27 intacto y sincronización general apagada. La prueba usa dobles,
no acredita Google ni integración de extremo a extremo.


## Duplicados en diario contractual · 7 noviembre 2026

ContractIntegration.js rechaza claves múltiples en el diario antes de leer Drive,
escribir cuentas o enviar al receptor. Conserva las filas ambiguas sin añadir
otra ni sobrescribir evidencia; contabiliza error y libera el bloqueo.
Dos pruebas locales superadas con node --test tests/contract-integration-mode.test.cjs,
incluido caso nuevo de diario ambiguo con cero efectos y limpieza del bloqueo.
Preparado y guardado; NO desplegado ni probado con Google real. Sin escritura
en CUENTAS 27, sesiones nuevas, comunicaciones ni activación de sincronización.


## Respuesta del receptor contractual · 7 noviembre 2026

feCiEnviar_ valida objeto JSON no nulo ni array antes de consultar state; una
respuesta null ya no produce TypeError interno. Se conservan HTTP 200/201 y
estados recorded/already_recorded como únicos resultados aceptados.
Tres pruebas locales afectadas superadas (node --test tests/contract-integration-mode.test.cjs),
incluida matriz nueva de nueve respuestas: JSON inválido, null, array, primitivo,
estado ausente, redirección, HTTP 500 y dos éxitos sintéticos. Sin red ni secretos
reales. Código y pruebas guardados, NO desplegados. No acredita el recorrido
Google real ni modifica CUENTAS 27, permisos, sincronización o estados comerciales.


## Evidencia conservada ante fallo · 7 noviembre 2026

El registro PENDIENTE conserva ahora huella y destino previamente registrados
si una revalidación falla, en lugar de borrarlos. El detalle de error lleva prefijo
Error: y elimina controles para almacenarse como texto, incluso si el mensaje
empieza por =. Cuatro pruebas afectadas superadas localmente con
node --test tests/contract-integration-mode.test.cjs; caso nuevo con fallo Drive
simulado, evidencia conservada y bloqueo liberado. Preparado y guardado, NO
desplegado. Sin acceso Drive real, escritura contable, sesiones, envíos o
activación de sincronización. CUENTAS 27 permanece intacto.


## Recuperación de entrega contractual · 7 noviembre 2026

Añadida prueba reproducible del coordinador: primer envío falla, segundo devuelve
already_recorded y tercero reconoce INTEGRADO sin reenviar. Una sola fila del
diario, misma clave de cuentas y tres liberaciones de bloqueo. Prueba nueva local
superada con node --test --test-name-pattern="Partial delivery" tests/contract-integration-mode.test.cjs.
No se repitieron casos anteriores sin cambios. Drive, cuentas y receptor son
dobles: el Set de claves no demuestra idempotencia del escritor real ni entrega
remota. Implementación sin cambios; prueba y evidencia guardadas. Sin despliegue,
mutaciones remotas o comunicaciones. CUENTAS 27 intacto; sincronización apagada.


## Diario actualizado dentro del lote · 7 noviembre 2026

La lectura actual de tools/ContractIntegration.js confirma que records se relee
por fila, dentro del bucle; el posible defecto de snapshot inicial ya está
corregido en el código actual. Se añade regresión que procesa dos filas de origen
con la misma clave: una integración, un reconocimiento existente, una sola fila
de diario, un envío y bloqueo liberado. Prueba nueva local superada:
node --test --test-name-pattern="Repeated source" tests/contract-integration-mode.test.cjs.
Drive/cuentas/receptor son dobles; no acredita publicación o escritura real.
No se modificó la implementación ni se repitieron baterías anteriores sin cambios.
Prueba y evidencia guardadas. El código actual incluye destino auxiliar 2027;
no equivale al XLSX original. Sin despliegue en esta continuación, cuentas reales
intactas y sincronización general apagada.


## Céntimos representables sin pérdida · 7 noviembre 2026

feCiPlan_ rechaza total, reserva y saldo si sus céntimos exceden el rango entero
seguro de JavaScript. Evita validar/importar cantidades que perderían precisión;
no recalcula impuestos ni cambia los importes admitidos. Caso nuevo: 0,29 válido
y cantidades inseguras rechazadas en los tres campos antes de efectos externos.
Siete pruebas locales afectadas superadas con
node --test tests/contract-integration-mode.test.cjs.
Código y pruebas guardados; NO desplegados en esta continuación. Sin red en las
pruebas, accesos nuevos, comunicaciones o escrituras en libros. El código leído
incluye integración auxiliar 2027 y ensayo XLSX; no se ejecutaron esas rutas ni
se modifica el original. La identificación del destino 2027 y acceso Google
pendientes en el chat no se dan por resueltos. Sincronización general apagada.


## Fracciones de céntimo rechazadas · 7 noviembre 2026

La comparación anterior redondeaba ambos lados y admitía cantidades como
0.000001 o 1230.000001. feCiPlan_ exige ahora igualdad numérica con su
representación de dos decimales: valida sin modificar el importe. No cambia
fórmulas fiscales ni redondea valores al importarlos.

Regresión nueva: cinco cantidades subcéntimo rechazadas y cuatro importes
exactos (incluido 0,29) conservados. Se comprobó que el test falla con la
validación anterior (Missing expected exception). Ocho pruebas locales afectadas
superadas con node --test tests/contract-integration-mode.test.cjs.
Código y prueba guardados; NO desplegados. Sin red en ensayos, escrituras Drive,
conversión de libros, cambios de permisos, sesiones o comunicaciones. Las tareas
remotas de copia nativa anunciadas en el chat no se certifican aquí por lectura
de este código. Sincronización general apagada y original sin modificar.


## Identidad PDF conservada durante reintentos · 7 noviembre 2026

La huella guardada se contrasta ahora antes de feCiCuentas_ y feCiEnviar_,
tanto para INTEGRADO como para PENDIENTE. Antes un fallo convertía la fila a
PENDIENTE y el reintento podía omitir el control previo de identidad PDF.
Un cambio de bytes exige conciliación y conserva huella/destino anteriores.

Nueva prueba con dobles cubre ambos estados, rechazo antes de cuentas/envío,
evidencia conservada y bloqueo liberado. Nueve pruebas afectadas superadas
localmente con node --test tests/contract-integration-mode.test.cjs.
Código actual releído y SHA contrastado antes de guardar; sin sobrescritura
forzada. Preparado y probado localmente, NO desplegado. No se ejecutaron rutas
Google/XLSX ni se crearon identidades, documentos, mensajes o movimientos reales.
Libro original intacto; MODO PRUEBA y sincronización general apagada.


## Preparación de publicación en Apps Script · 7 noviembre 2026

Detectada divergencia: las últimas correcciones de céntimos y reintento PDF
estaban solo en el repositorio web. Tras contrastar ambos archivos, trasladadas
al repositorio flamenco-events-appscript sin diferencias adicionales. Su
ContractIntegration.js coincide ahora con tools/ContractIntegration.js, blob
19b8dc7b879d630c701aeeb9df009c28e9e9332c.

Nueve pruebas con dobles pasan localmente en la estructura del repositorio de
publicación, y node --check pasa. Pruebas añadidas allí y conectadas al workflow
antes de cualquier publicación. Commit CI fb9bf2b56ff75ec0d22acf7c5c15c8aaedeaf667;
evidencia y límites en docs/integracion-app.md de Apps Script.

No se ha publicado en Google ni modificado la implementación del editor, que
requiere contraste actual antes de sobrescribirla. Sin cambios en libros,
clientes, envíos, permisos, fórmulas, plantillas o sincronización general.


## Publicación: archivos exactos y contrato obligatorio · 7 noviembre 2026

Apps Script workflow ahora exige ContractIntegration.js y compara nombres de
archivos completos. Defecto reproducido: Formulario.html ausente podía pasar
por coincidencia parcial con ContratoFormulario.html. Tres pruebas locales
nuevas superadas; conectadas al workflow de publicación. Evidencia detallada en
docs/integracion-app.md del repositorio Apps Script; commit funcional
5190e00db32dd78785fa2cbeb2b76af5077efcbb, ejecución CI 42369723609 pendiente al
registrar. Sin cambios de código de negocio ni despliegue Google. No se usaron
sesiones, credenciales o libros; MODO PRUEBA y sincronización apagada conservados.


## Revisión del editor antes de publicar · 7 noviembre 2026

Preparada en Apps Script la utilidad tools/verify-script-snapshot.cjs y cuatro
pruebas locales superadas. Contrasta inventario/tipos/código de snapshot privado
con SHA-256 previamente revisado; detecta cambios y archivos añadidos/eliminados,
rechaza duplicados y baseline ausente, sin imprimir código. Pruebas conectadas
a CI en 3801cf1df44448d174cfb63838f094c8c1186b61; ejecución 42374173861 pendiente
al guardar. Evidencia y límites en docs/integracion-app.md de ese repositorio.

Solo preparado: no se ha leído aquí el código actual del editor Google ni se ha
integrado el comparador como bloqueo efectivo de clasp push. No resuelve por sí
solo cambios entre lectura y publicación. Sigue pendiente revisión real antes
de publicar. Sin escritura remota, usuarios, sesiones, mensajes, cambios de
libros o activación de sincronización; MODO PRUEBA conservado.


## Publicación remota confirmada · 7 noviembre 2026

Nacho completó el acceso Google y autorizó explícitamente publicar manteniendo
MODO PRUEBA. Editor del proyecto vigente: leído ContractIntegration.gs actual
(8198 caracteres antes del cambio), aplicado únicamente el control de céntimos
seguros/exactos y de huella previa para reintentos PENDIENTE. Una coincidencia
exacta por sustitución, sin reemplazo del proyecto completo. Relectura por
portapapeles del editor confirmó igualdad exacta con el texto corregido y guardado.

La implementación existente pasó de versión 59 a **versión 60**; la interfaz
mostró «Se actualizó correctamente la implementación» y «Se implementó el proyecto
correctamente». Mismo ID y URL de implementación; permisos de ejecución/acceso
conservados. No se ejecutó sincronización, no se cambiaron propiedades ni se
invocaron funciones de cuentas, clientes, envíos, firma o cobro.

Esto verifica guardado y publicación por editor, no una nueva prueba real del
recorrido contractual completo. El archivo remoto es distinto del repositorio:
se conservaron sus cambios; no afirmar igualdad de todo el proyecto con main.
Antes de publicar por clasp, reconciliar esas diferencias, especialmente destinos
y rutas XLSX, sin forzar sobrescritura. No se activó sincronización general ni
se alteraron libros en esta continuación.


## Fuente de publicación reconciliada con v60 · 7 noviembre 2026

ContractIntegration.js del repositorio Apps Script igualado al texto observado y
releído en el editor (8365 caracteres, blob 1791e459686b60fdbd239bc81166fac25deeb014).
El repositorio conservaba una ruta experimental de escritura XLSX ausente del
editor; archivada íntegra como .experimental.txt fuera de los tipos de clasp.
Se evita reintroducir esa ruta accidentalmente. Nueve pruebas locales y sintaxis
superadas. No es otra publicación ni una comprobación de todo el proyecto remoto.
La copia tools/ContractIntegration.js de este repositorio conserva el experimento;
NO usarla para reemplazar la fuente de publicación. Referencia durable actual:
ContractIntegration.js en flamenco-events-appscript; límites en docs/integracion-app.md.
Sin escrituras contables, cambios de permisos, envíos ni activación de sincronización.


## Comparación remota de tres archivos adicionales · 7 noviembre 2026

Solo lectura en el editor autenticado: AppWhatsAppSync y AppBridgeEndpoint
coinciden exactamente con sus blobs actuales del repositorio. Contratos coincide
en contenido y difiere únicamente en un salto de línea final (26580 frente a
26581 caracteres); no se normalizó ni escribió para ocultar esa diferencia.
Huella, blob y alcance registrados sin código privado en
`docs/editor-reviewed-files-20261107.json` del repositorio Apps Script.

Con ContractIntegration revisado anteriormente, son cuatro archivos examinados;
NO es comparación completa del proyecto ni exportación del bundle desplegado.
No se publica ni ejecuta el circuito y no se repiten pruebas de código sin cambios.
Resto de archivos, HTML y manifiesto pendientes antes de cualquier reemplazo total.
Sin modificaciones en Google, sesiones ficticias, permisos, libros, comunicaciones
o sincronización general. Las lecturas no acreditan firma, cobro o cierre.


## Recuperación WhatsApp y publicación v61 · 7 noviembre 2026

Revisados secuencialmente los 19 archivos del editor autenticado frente al
repositorio: completados los 15 restantes tras los cuatro ya documentados.
Doce coincidían exactamente; appsscript.json difiere solo en salto final y
FormularioServidor.js solo en comentario/salto final. En whatspp.gs faltaba
la llamada de recuperación a feAppWhatsAppSyncPendientes_; no se reemplazó
el proyecto completo ni se alteraron los demás archivos.

Corregido waWebhookRecuperar conservando wa9Despachar_ y aislando errores de
sincronización. La llamada nueva exige FE_APP_TEST_MODE exactamente 'true';
el helper mantiene su interruptor FE_APP_WA_SYNC_ENABLED y filtros ficticios.
No se cambiaron propiedades ni se activó sincronización general.
Código: e85d9b9c6afb70b60fc6cf5112c51b61b9101880, repositorio Apps Script.
Tres pruebas nuevas con dobles superadas: orden, ausencia/error del helper
y modo ausente/falso/mal escrito. Reproducir:
node --test tests/whatsapp-recovery-sync.test.cjs
CI confirmado success:
https://github.com/flamencoevents/flamenco-events-appscript/actions/runs/42383077395
(commit 238ca688643307435ebef83865b62ab1a564637c).

Aplicada solo la sustitución puntual en el editor, sobre una coincidencia
exacta; relectura completa confirmó el texto guardado. Google confirmó
«Se actualizó correctamente la implementación. Versión 61» el 7 noviembre,
con el mismo ID/URL. El comentario explicativo del repositorio no se añadió
al archivo remoto; comportamiento equivalente, sin afirmar igualdad byte a byte.
La revisión secuencial del editor no es un snapshot atómico del bundle publicado.

Verificado: pruebas con dobles, guardado y publicación. Pendiente: ensayo
de extremo a extremo de una solicitud ficticia recuperada hasta la gestión.
No se invocó el recuperador ni se enviaron mensajes para probarlo; no se
crearon usuarios, sesiones ni asignaciones ficticias que limpiar. No se
escribió CUENTAS 27, no se acredita firma/cierre/cobro y no se publicó un
escritor XLSX. MODO PRUEBA conservado.


## Ventana de pendientes corregida · 7 noviembre 2026

Detectado y reproducido un desfase en AppWhatsAppSync.js: con última fila 102,
la ventana de 100 filas terminaba en 101 y omitía la solicitud más reciente.
Corregido únicamente el inicio de rango de lastRow-100 a lastRow-99; mantiene
máximo 100 filas, orden descendente, cuatro entregas por ejecución e interruptor
existente. No se activó sincronización.

Dos pruebas nuevas locales superadas y sintaxis válida:
node --test tests/whatsapp-sync-window.test.cjs
node --check AppWhatsAppSync.js
La regresión falló antes de la corrección (101 frente a 102); cubre límites
2, 100, 101, 102 y 150, primera entrega más reciente, límite de cuatro y
ausencia de lectura del libro con sincronización desactivada.
Solo dobles ficticios, sin servicios externos ni sesiones/asignaciones que limpiar.

Código 9f8ac397af0215bb82d4b1456029574d86f2d7b7; pruebas
a1b574b9639e8ec8ec40f9ca7861292e8bc5ea00; workflow
35c89ba46f66edb89060fa396b1d98d33b855616 (repositorio Apps Script).
CI 42383852366 pendiente al registrar; no se atribuye aún éxito.
Preparado y guardado en GitHub, NO desplegado: la última publicación comprobada
continúa en v61. Próximo paso: contrastar nuevamente el archivo del editor antes
de aplicar esta sustitución puntual; no hacer clasp push del proyecto completo.
No hay prueba nueva de extremo a extremo ni escritura de CUENTAS 27.
MODO PRUEBA, fórmulas, plantillas, permisos y sincronización general conservados.


## Reintentos de solicitudes validados · 7 noviembre 2026

CI 42383852366 completado success para la corrección de ventana de pendientes.
Nueva prueba con payload FE3 ficticio y huellas SHA-256 reales (transporte y
Sheets simulados): error de entrega o requires_manual_review no guardan marca;
el reintento already_recorded guarda una marca y la tercera pasada no reenvía.
Reproducir solo el caso nuevo:
node --test --test-name-pattern="Retry keeps" tests/whatsapp-sync-window.test.cjs
Una prueba local superada; commit e447f77d5aaddf5e86c3a14e99b9520e1837d67f.
El primer intento del fixture contó por error FE_APP_WA_SYNC_ENABLED como marca;
se corrigió el filtro de la prueba y pasó. No se cambió la implementación.

Acceso remoto comprobado: abrir el proyecto y el enlace Panel de Apps Script
redirige a developers.google.com/apps-script; no se obtuvo el editor ni una
sesión autenticada verificable. Causa/caducidad no confirmadas. No se introdujeron
credenciales ni se publicó la corrección. Última versión comprobada: v61;
lastRow-99 sigue preparado en GitHub, pendiente de contraste remoto y publicación.
No usar despliegue completo forzado para evitar este contraste.

No es ensayo HTTP/Google real. Sin envíos, usuarios, sesiones o asignaciones
creados; sin escrituras de CUENTAS 27. MODO PRUEBA y sincronización apagada.


## Límite único de lectura de cola · 7 noviembre 2026

AppWhatsAppSync.js consulta ahora getLastRow una sola vez para calcular inicio y
cantidad del rango. Antes realizaba tres consultas: un crecimiento intercalado
podía combinar límites distintos. Regresión sintética nueva falló antes del
cambio y pasó después; no implica bloqueo de ediciones ni snapshot transaccional
del contenido de Sheets. Las filas añadidas después del límite quedan para otra
ejecución. Se conserva la ventana máxima de 100 y cuatro entregas por pasada.

Cuatro pruebas afectadas locales y sintaxis superadas tras cambiar implementación:
node --test tests/whatsapp-sync-window.test.cjs
node --check AppWhatsAppSync.js
Código 80885ff5c0bc1331d80f6377a01df8ec281e15d4; prueba
9ca131281c86d972153643b9dc5782e62c497636 (Apps Script).
Además, CI anterior 42385940539 success confirma la prueba de reintentos guardada
en e447f77d5aaddf5e86c3a14e99b9520e1837d67f; no es CI del cambio nuevo.

Preparado y guardado, sin publicación Google. Última publicación comprobada v61.
El bloqueo de acceso al editor documentado sigue sin resolución verificada;
no se repitió navegación ni se usó push forzado. Pendiente contraste remoto antes
de publicar los cambios de ventana/límite. Sin envío real, usuarios, sesiones o
asignaciones creados, ni escritura en CUENTAS 27. MODO PRUEBA y sincronización
general apagada. Pruebas con dobles, no ensayo de extremo a extremo.


## Recuperación ante servicios vacíos · 12 noviembre 2026

Un elemento null en la lista de servicios de una fila GENERADO interrumpía
todo el lote antes de la entrega. AppWhatsAppSync.js omite ese elemento,
conserva la descripción de los servicios válidos y procesa la siguiente fila.
La regresión con dos solicitudes ficticias falló antes del cambio y pasó
después. Sintaxis y cinco pruebas afectadas superadas localmente mediante
`node --check AppWhatsAppSync.js` y
`node --test tests/whatsapp-sync-window.test.cjs`.

Código fc83fc306072c566fd1e1e9dd3e9b857f369e4af y prueba
5180fac091a0237736c03877ba96a511692a543d. Preparado en GitHub.
La corrección queda pendiente de publicación y de validación de extremo a
extremo. El ensayo empleó dobles de Sheets y transporte, con MODO PRUEBA
y sin operaciones sobre el XLSX real.


## Precisión del verificador XLSX · 12 noviembre 2026

El verificador podía aceptar un cambio numérico fuera de C:H si los dos
valores solo diferían después del dígito significativo 28. El contexto
decimal predeterminado los redondeaba al normalizar el XML. Ahora conserva
los dígitos de la celda y sigue aceptando representaciones equivalentes,
como un cero final adicional.

La regresión con XML ficticio falló antes de la corrección y pasó después.
Nueve pruebas afectadas superadas localmente con
`PYTHONPATH=tests python3 -m unittest -v test_accounts_2027_verify`.
Código 2ee91f612114dfee1aa9c8f9fb67a52fb6f7937a y prueba
e4bfd02da51b4feb2b9d37478f46e45bee9e0612.
Preparado en GitHub y validado con datos ficticios. Pendientes el despliegue
y el ensayo integral. Sin acceso ni escritura al XLSX real.

## Conservación de extensiones de fila XLSX · 12 noviembre 2026

La comparación estructural descartaba todos los hijos de cada fila.
Ahora separa únicamente las celdas, de forma que una modificación de
extLst produce SHEET_STRUCTURE_CHANGED. La regresión con dos ZIP de
XML ficticio falló antes del cambio y pasó después. La validación
preliminar del libro se simula en ese caso para aislar la comparación.
Diez pruebas afectadas pasaron con
`PYTHONPATH=tests python3 -m unittest test_accounts_2027_verify`.

Código 85c5944cf93fb9746d4ac51cf55ca7a1f3ac4d21 y prueba
73e7453fec9dc02c21961ea2870c569999f4f812.
Preparado y probado localmente, pendiente de integración remota.
Los archivos temporales se limpiaron al finalizar la prueba.
Sin operaciones sobre el libro real ni cambios en la sincronización.

## Referencias de celdas inequívocas · 12 noviembre 2026

El verificador rechaza referencias duplicadas o ausentes en cada hoja.
El mapa de celdas podía ocultar duplicados en hojas secundarias. Una
regresión con ZIP ficticio y lector preliminar simulado reproduce ambos
casos y comprueba el rechazo. Once pruebas afectadas superadas con
`PYTHONPATH=tests python3 -m unittest test_accounts_2027_verify`.
El ZIP temporal se elimina al terminar.

Código 32133c2c2be38d4699ab9c4c5ec08b6f8f629493 y prueba
46a53dfcc297fc9091299c46012307a9eba87537.
Preparado y verificado localmente en modo prueba. Escritura remota y
validación integral pendientes. El original permanece intacto.

## Rechazo de ensayo antes de crear el diario · 12 noviembre 2026

El coordinador valida el XLSX sintético y la propuesta antes de abrir el
bloqueo y el diario SQLite. Una solicitud con test_mode=false ya se
rechazaba, pero dejaba ambos archivos locales. La regresión comprueba que
tampoco se crea ninguno ni se invoca el escritor.

Ocho pruebas del coordinador superadas con
`PYTHONPATH=tests python3 -m unittest test_accounts_2027_trial`.
Código ad0edb558bdf73cc4570b0d9e1b6c601f35eddb7 y prueba
d33afe25845e3aba17d24aab0854b596e27db2bb.
Validación local con fixtures ficticias, sin despliegue. Pendiente ensayo
remoto aislado. Sin acceso ni escritura al original.

## Huella del exportado en el ensayo XLSX · 12 noviembre 2026

El empaquetador contrasta el SHA-256 de los bytes del exportado que consume
con el obtenido al validarlo. Si cambia entre lecturas, devuelve
ARTIFACT_CHANGED antes de generar la copia. La regresión modifica solo
la representación XML del archivo ficticio entre ambas lecturas, sin
alterar los valores propuestos. El código anterior aceptaba el cambio.

Nueve pruebas de empaquetado superadas con
`PYTHONPATH=tests python3 -m unittest test_accounts_2027_package`.
Código dd736d6dde10a745a8567cc987e74f36b6c5cee6 y prueba
35705e9a762263ef4c24c41c06f64a9587c0a9b7.
Validado localmente con archivos ficticios eliminados al terminar.
Despliegue y ensayo remoto pendientes. Sin acceso ni escritura al original.

## Contrato ficticio a copia XLSX auditada · 12 noviembre 2026

Una prueba enlaza filas FE3/FE_Contratos ficticias y bytes PDF de prueba
con la propuesta mensual y el empaquetador real. Utiliza un exportado
XLSX simulado, conserva el origen y verifica 1060,01 en H11 sin diferencias
fuera de la propuesta. El adaptador también rechaza números JSON que
desbordan a infinito dentro del cálculo guardado. La regresión reprodujo
la aceptación indebida antes de la corrección.

Trece pruebas superadas con
`PYTHONPATH=tests python3 -m unittest test_accounts_2027_contract`.
Código 6efb2d80012dc2683700b9ea26b843413ea7352b y pruebas
cd539fe6ee1cce9d3baf47ac09b60462df30723c.
Verificado localmente en modo prueba. El ensayo elimina sus temporales.
Pendientes el exportador real en este recorrido, Drive y despliegue.
Sin operaciones sobre el libro original.

## Exportador real con contrato ficticio · 12 noviembre 2026

Ejecutado el importador, renderizado, exportador y empaquetador con Artifact
Tool en un XLSX creado desde cero y un contrato ficticio. Resultado
copy_audited_requires_review y preservation_verified=true. Auditoría sin
diferencias, 1060,01 en H11, fórmula de V12 conservada y origen idéntico
byte a byte. El nombre de la hoja pierde el espacio final al crear la
fixture. El ensayo restaura ese espacio únicamente en el XML de la
fixture, para probar la grafía exacta del origen. Con ese nombre, el
recorrido pasó. Esto no determina la causa del antiguo error sheetId.

Reproducción optativa con el runtime existente:
`python3 tests/run_accounts_2027_artifact_trial.py`.
Código de ensayo b5b204e0316d6839525b0a07b0bd7c009dc5e362. Temporal aislado y
eliminado al terminar. Validado localmente en modo prueba.
Pendientes Drive y despliegue. El libro real no intervino.

## Copia ficticia privada en Drive · 12 noviembre 2026

Se reutilizó la salida ficticia auditada del ensayo anterior. La huella
SHA-256 local coincidió con candidate_sha256 y el informe tenía cero
diferencias. Se subió a Mi unidad de la cuenta autorizada como archivo
nuevo, sin convertirlo ni compartirlo. La lectura posterior confirmó MIME
XLSX, 3872 bytes y shared=false. La descarga del conector devolvió una
referencia autenticada, sin bytes materializados en el ensayo. No se
certifica igualdad byte a byte tras la descarga.

Limpieza confirmada: eliminación del único archivo ficticio creado y
lectura posterior 404. No se crearon usuarios ni sesiones de prueba.
Para reproducir la parte local usar
`python3 tests/run_accounts_2027_artifact_trial.py` (b5b204e0316d6839525b0a07b0bd7c009dc5e362).
La comprobación de Drive consistió en subir una salida ficticia auditada,
leer metadatos, solicitar descarga y eliminar ese archivo temporal.
No hubo despliegue ni escritura sobre el original. Pendientes la
verificación de bytes descargados y el flujo remoto con control de versión.

## Integridad de descarga XLSX desde Drive · 12 noviembre 2026

Se reutilizó la copia ficticia auditada de 3872 bytes. Drive la registró
como un archivo XLSX nuevo y no compartido. Se descargó el contenido
mediante la referencia temporal del conector y se comparó en memoria
con la salida local, byte a byte y por SHA-256. Ambos controles pasaron
(huella c616665338fffe4c74c31a015882c83de2ccfd733837451b3d6d36879df72dd6).
La eliminación de la única copia remota quedó confirmada con lectura 404.

Reproducción: generar una salida ficticia con el recorrido de
`tests/run_accounts_2027_artifact_trial.py`, subir solo la copia auditada
como XLSX nuevo, comprobar shared=false y comparar el contenido descargado
con la salida local mediante `cmp` y `sha256sum`. Eliminar únicamente
el archivo temporal creado y comprobar que su lectura devuelve 404.
No conservar referencias temporales ni enlaces de descarga.

Verificado el transporte de la copia ficticia. Pendiente comprobar la
escritura condicionada a la versión remota y la integración autenticada.
No se desplegó el circuito ni se abrió el libro original.

## Huella ligada a los bytes auditados · 12 noviembre 2026

El lector y el verificador analizan los mismos bytes con los que calculan
la huella. Antes podían auditar una copia y devolver el SHA-256 de una
lectura posterior distinta. La regresión reproduce el fallo con un XLSX
ficticio y comprueba que el verificador lee el candidato una sola vez.

34 pruebas afectadas superadas localmente con
`PYTHONPATH=tests python3 -m unittest test_accounts_2027 test_accounts_2027_verify test_accounts_2027_package`.
Código y regresión guardados en b2d272cc61e0adbdc3a3e5af93d480f557341f5f.
Las pruebas usan temporales eliminados al finalizar.

El conector Drive disponible permite reemplazar bytes por ID pero no
expone una precondición de versión. Por tanto, sigue pendiente una
escritura remota que compruebe la versión y escriba en una sola operación.
El cambio local queda probado en modo prueba y sin despliegue.
Sin operaciones sobre el libro real.

## Conservación del formato dentro de las celdas · 12 noviembre 2026

La auditoría conserva la estructura del texto enriquecido, tanto en
cadenas compartidas como en celdas con texto en línea. La regresión
reproduce la pérdida de negrita sin cambio de texto ni de estilo de
celda, que antes pasaba inadvertida en texto en línea. Ahora se detecta
en ambos tipos de almacenamiento.

Doce pruebas afectadas superadas con
`PYTHONPATH=tests python3 -m unittest test_accounts_2027_verify`.
Código 8b3c4ba71c086ef870cc4b38eb9a91fde9bcd661 y prueba
7a6378445ae39b14b4429f5c96b13e7041c8ebdb.
Preparado y verificado localmente con datos ficticios. Pendientes el
control de versión remoto y el despliegue. Sin operaciones sobre el
libro real, asignaciones ni sesiones.

## Hipervínculo conservado en el ensayo del exportador · 12 noviembre 2026

Se amplió la prueba optativa con un hipervínculo ficticio en A12, fuera de
la fila de destino, con relación XLSX externa a example.invalid. El ensayo
con el exportador real terminó con preservation_verified=true y comprobó
que el vínculo sigue en A12 y que su parte de relaciones es idéntica
byte a byte. Se mantuvieron los controles de importe y del archivo de
partida. El primer montaje de la fixture asumía un cierre XML sin prefijo.
Se corrigió usando el árbol XML de la hoja ficticia.

Reproducción: `python3 tests/run_accounts_2027_artifact_trial.py` con
el runtime existente. Prueba guardada en 4a359df07ea01533e19efe4c743ed64b80007560.
Temporales eliminados al finalizar. Verificado localmente en modo prueba.
Pendientes el control de versión en Drive y el despliegue.
Sin operaciones sobre el libro real.

## Coherencia de coordenadas XLSX · 12 noviembre 2026

El verificador rechaza referencias con sintaxis no canónica y celdas
cuya coordenada no corresponde a la fila explícita que las contiene.
Antes podía separar la celda de su fila y pasar por alto ese desajuste
en una hoja secundaria. Los dos casos nuevos fallaron antes del cambio
y pasaron después.

Doce pruebas locales con datos ficticios superadas mediante
`PYTHONPATH=tests python3 -m unittest test_accounts_2027_verify`.
Código 0fac9f8db7da8d2133fee89e624dd25120b76366 y pruebas
3f32c45e7431d8ae1d77a6bf32653d918db5e916.
Preparado y verificado localmente. Pendiente control de versión remoto
y despliegue. Sin acceso ni escritura al libro original.

## Selección de la hoja de cuentas por nombre · 12 noviembre 2026

El ensayo con el exportador real fallaba cuando la hoja de cuentas
estaba en segunda posición. El escritor seleccionaba la primera.
Ahora busca el nombre exacto validado y usa el índice de esa hoja para
renderizar, porque el renderizado por nombre falló en la fixture con
espacio final. No se modifica el nombre de ninguna hoja del libro.

Pasó `python3 tests/run_accounts_2027_artifact_trial.py` con dos hojas
ficticias, preservation_verified=true y cero diferencias de auditoría.
La prueba compara byte a byte las partes ajenas a la hoja de destino y
verifica el hipervínculo y el importe. Limpieza de temporales mediante
TemporaryDirectory. Código 254b17137a26237d1e74fad8331f345762584c2a y prueba 8df109fd54b3146eeae1dd77dfeda517d434e8bc.
Verificado localmente, sin despliegue. Sigue pendiente el control de
versiones en Drive. No intervino el libro real.

## Celdas con contenido ambiguo · 12 noviembre 2026

El verificador de la copia XLSX rechaza celdas con valores, fórmulas o
bloques de texto en línea repetidos, así como una combinación de valor
y texto en línea. Antes la lectura podía quedarse con el primer
elemento y omitir el resto. Se conserva la lectura de una fórmula con
su valor de caché habitual.

Los cuatro casos ficticios reprodujeron el fallo previo. Pasaron 13
pruebas del verificador y 10 del empaquetador con
`PYTHONPATH=tests python3 -m unittest test_accounts_2027_verify test_accounts_2027_package`.
Las pruebas eliminan sus temporales al terminar. Verificado localmente
en modo prueba y sin despliegue. El libro original no intervino.
Sigue pendiente la escritura remota con control de versión en Drive.

## Filas cubiertas por fórmulas de rango · 13 noviembre 2026

El preparador de CUENTAS 27 bloquea una fila candidata cuando una
fórmula declara un rango que la cubre, aunque la celda que contiene
la fórmula esté en otra fila y fuera de A:Q. La comprobación usa
el rango declarado en el XLSX y no recalcula el libro.

Dos regresiones ficticias, con fórmula matricial y tabla de datos,
reprodujeron la aceptación anterior. Tras el cambio ambas bloquearon
el empaquetado, conservaron la fuente byte a byte y no dejaron copia
ni archivo temporal de salida. Pasaron 24 pruebas mediante
`PYTHONPATH=tests python3 -m unittest test_accounts_2027 test_accounts_2027_package`.

Verificado localmente en modo prueba. Sin despliegue ni acceso al libro
original. Sigue pendiente la escritura remota con control de versión.

## Metadatos dentro de las celdas · 13 noviembre 2026

El verificador compara también los elementos XML de metadatos dentro
de las celdas, incluidas las extensiones. Detecta su pérdida tanto en
la celda de destino como en hojas ajenas, aunque se conserve el valor.
Los dos casos ficticios pasaban antes de la corrección y ahora quedan
bloqueados. Con los metadatos conservados, la copia de prueba pasa.

Pasaron 25 pruebas locales con
`PYTHONPATH=tests python3 -m unittest test_accounts_2027_verify test_accounts_2027_package`.
Verificado en modo prueba, sin despliegue ni acceso al XLSX original.

## Límites mensuales calculados · 13 noviembre 2026

El preparador bloquea la propuesta si detecta un marcador mensual cuyo
texto procede de una fórmula. Su valor en caché puede quedar obsoleto y
hacer que se use un bloque incorrecto. Se conserva la inspección de
solo lectura.

Dos ensayos ficticios reprodujeron la aceptación anterior al sustituir
por una fórmula el marcador de inicio o el siguiente. Tras el cambio,
ambos se bloquearon antes de producir una copia, conservaron los bytes
de la fuente y no dejaron temporales. Pasaron 25 pruebas con
`PYTHONPATH=tests python3 -m unittest test_accounts_2027 test_accounts_2027_package`.

Verificado localmente en modo prueba, sin despliegue ni acceso al XLSX
original. Sigue pendiente la escritura remota con control de versión.

## Validación del origen antes de solicitar el PDF · 13 noviembre 2026

La conciliación de servidor valida la marca de prueba del origen firmado,
los importes aceptados y el detalle fiscal antes de solicitar el PDF
contractual. Si hay discrepancias, devuelve 409 sin pedir el PDF a Apps
Script ni descargar la copia de Storage. La lectura de ambos PDF y la
comparación de huellas se mantienen para un origen ficticio válido.

La regresión con origen sin marca de prueba reprodujo la petición
prematura del PDF. Tras el cambio, también se verificó el rechazo sin
descarga ante cambios de un céntimo o del IVA. Pasaron las 15 pruebas de
`node --test tests/accounts-preflight.test.cjs` con dobles de servicios.
El ensayo no creó sesiones, asignaciones ni documentos. Preparado y
verificado localmente en modo prueba. Despliegue y ensayo autenticado
pendientes. Sin acceso ni escritura al XLSX original.

## Referencias a cadenas compartidas · 13 noviembre 2026

El preparador y el verificador de CUENTAS 27 rechazan índices de texto
compartido negativos, fuera de rango o con caracteres ajenos a un índice.
Antes, un índice negativo podía seleccionar el último texto de la tabla
y hacer pasar una cabecera o una celda de otra hoja con referencia inválida.

Los casos ficticios reprodujeron el fallo y pasaron con la corrección.
Pasaron 41 pruebas con
`PYTHONPATH=tests python3 -m unittest test_accounts_2027 test_accounts_2027_verify test_accounts_2027_package`.
Verificado localmente en modo prueba. Sin despliegue ni acceso al XLSX
original. Sigue pendiente la escritura remota con control de versión.

## Vínculo entre propuesta, copia y auditoría · 13 noviembre 2026

El ensayo XLSX conserva el identificador de la propuesta inicial durante
el empaquetado y la auditoría. Un cambio de huella del contrato se
rechaza aunque las seis celdas sigan teniendo los mismos valores.

Con un contrato ficticio se reprodujo la aceptación anterior de esa
sustitución. La regresión comprueba que ahora se rechaza sin dejar copia
ni temporal y que la propuesta original se conserva. Pasaron 26 pruebas
con `PYTHONPATH=tests python3 -m unittest test_accounts_2027_package test_accounts_2027_contract`.
También pasó `python3 tests/run_accounts_2027_artifact_trial.py` con el
exportador local, incluida la coincidencia del identificador auditado.

Verificado localmente en modo prueba, sin despliegue ni acceso al XLSX
original. Siguen pendientes la revisión nativa y el control de versión remoto.

## Identidad de las hojas del XLSX · 13 noviembre 2026

El verificador rechaza nombres de hoja repetidos y dos hojas que apuntan
a la misma parte del XLSX. Antes, un nombre repetido podía ocultar la
primera hoja en el informe y dos nombres distintos podían contar el
mismo contenido dos veces.

Los dos casos ficticios reprodujeron el fallo y quedaron bloqueados tras
la corrección. Se comprobó también que dos hojas independientes pasan.
Pasaron 29 pruebas con
`PYTHONPATH=tests python3 -m unittest test_accounts_2027_verify test_accounts_2027_package`.
Verificado en modo prueba, sin despliegue ni acceso al XLSX original.

## Comprobación de la auditoría antes de publicar la copia local · 13 noviembre 2026

El empaquetador comprueba que la auditoría corresponde a la propuesta
inicial y a la huella de los bytes que preparó antes de publicar la copia
local. Dos pruebas ficticias reprodujeron la aceptación previa de una
auditoría con otro contrato o con bytes distintos. Ambos casos se
bloquean y eliminan el temporal sin producir una copia de salida.

Pasaron 15 pruebas con
`PYTHONPATH=tests python3 -m unittest test_accounts_2027_package`.
Verificado localmente en modo prueba, sin despliegue ni acceso al XLSX original.

## Relaciones del libro y entradas de texto compartido · 13 noviembre 2026

El preparador y el verificador rechazan identificadores repetidos en
las relaciones del libro. El verificador cuenta únicamente entradas de
texto al resolver índices en la tabla de cadenas compartidas. Una
extensión de la tabla no puede ocupar el lugar de una cadena.

Dos casos ficticios reprodujeron la aceptación previa. Tras el cambio,
ambos se rechazaron y se comprobó también la lectura de un índice válido
en una tabla con extensiones. Pasaron 31 pruebas con
`PYTHONPATH=tests python3 -m unittest test_accounts_2027_verify test_accounts_2027`.
Verificado localmente en modo prueba, sin despliegue ni acceso al XLSX original.

## Presupuestos existentes guardados como número · 13 noviembre 2026

El preparador detecta posibles duplicados si un presupuesto textual con
ceros iniciales coincide con una celda numérica guardada en notación
decimal o científica. La coincidencia obliga a conciliar. Se conserva
la referencia textual exacta de la propuesta.

Dos casos ficticios reprodujeron la aceptación previa. Ambos se
bloquearon después del cambio, sin crear copias ni dejar temporales.
Pasaron 30 pruebas con
`PYTHONPATH=tests python3 -m unittest test_accounts_2027 test_accounts_2027_package`.
Verificado localmente en modo prueba, sin despliegue ni acceso al XLSX original.

## Celdas ambiguas en la fuente · 13 noviembre 2026

El preparador y el verificador aplican la misma validación del contenido
de cada celda. Un valor duplicado o una mezcla de valor y texto en línea
se rechaza al leer el XLSX, antes de proponer una fila. Se mantiene el
soporte de una fórmula con un único valor en caché.

La regresión de una celda en V con un valor vacío seguido de otro
valor reprodujo la propuesta indebida anterior. Tras el cambio, ambos
casos ficticios se rechazaron y los bytes de la fuente se conservaron.
Pasaron 48 pruebas con
`PYTHONPATH=tests python3 -m unittest test_accounts_2027 test_accounts_2027_verify test_accounts_2027_package`.
Verificado localmente en modo prueba, sin despliegue ni acceso al XLSX original.

## Coordenadas de la hoja antes de preparar la propuesta · 13 noviembre 2026

El preparador aplica los mismos controles de coordenadas que el
verificador. Un XLSX ficticio con una celda V12 declarada dentro de
la fila 11 antes permitía proponer la fila 11. Ahora se rechaza al
leer la hoja, sin modificar los bytes de la fuente. La validación
también conserva el rechazo de referencias ausentes, inválidas y
duplicadas.

Pasaron 49 pruebas con
`PYTHONPATH=tests python3 -m unittest test_accounts_2027 test_accounts_2027_verify test_accounts_2027_package`.
Verificado localmente en modo prueba, sin despliegue ni acceso al XLSX original.

## Orden de los bloques mensuales · 13 noviembre 2026

El preparador comprueba el orden cronológico de los marcadores por fila
antes de proponer un destino. Un marcador de otro mes fuera de orden
impide la propuesta. Se permiten saltos entre meses existentes. Un mes
ausente sigue sin admitir propuestas.

Dos secuencias ficticias fuera de orden reprodujeron la aceptación
anterior. Tras el cambio se bloquearon ambas y se comprobó que un salto
de marzo a mayo sigue admitiendo la fila de marzo y bloquea abril.
Pasaron 16 pruebas con
`PYTHONPATH=tests python3 -m unittest test_accounts_2027`.
Verificado localmente en modo prueba, sin despliegue ni acceso al XLSX original.

## Relaciones externas en la selección de hojas · 13 noviembre 2026

El preparador, el empaquetador y el verificador resuelven las hojas con
la misma validación de relaciones internas. La regresión reprodujo que
una relación declarada externa con aspecto de ruta local podía generar
una propuesta. Ahora se rechaza antes de proponer una fila. Los
hipervínculos de las hojas siguen fuera de esta comprobación de destinos.

Pasaron 52 pruebas ficticias con
`PYTHONPATH=tests python3 -m unittest test_accounts_2027 test_accounts_2027_verify test_accounts_2027_package`.
Verificado localmente en modo prueba, sin despliegue ni acceso al XLSX original.

## Importes del contrato al leer el JSON · 13 noviembre 2026

El ensayo contractual rechaza los números decimales cuyo valor cambia al
leer el JSON. Antes, un total con precisión inferior al céntimo podía
redondearse a un total admitido. Ahora se rechaza antes de preparar la
propuesta. Se conservan las notaciones equivalentes del mismo importe.

Pasaron 15 pruebas ficticias con
`PYTHONPATH=tests python3 -m unittest test_accounts_2027_contract`.
Se verificaron el redondeo inadvertido, la conversión de un valor muy
pequeño a cero y una notación científica equivalente. Verificado
localmente en modo prueba, sin despliegue ni acceso al XLSX original.

## Identidad del origen contractual en la propuesta · 13 noviembre 2026

El ensayo contractual incorpora a la propuesta la huella conjunta de
la hoja de origen, la referencia de presupuesto, el JSON contractual
y el PDF. El identificador cambia si cambia la hoja o el JSON del
contrato, aunque los valores de C:H sigan siendo los mismos. La
propuesta guarda una huella, sin exponer el enlace privado. Las
solicitudes directas al preparador conservan su formato anterior.

Los dos casos ficticios reprodujeron el identificador compartido
anterior. Pasaron 51 pruebas mediante
`PYTHONPATH=tests python3 -m unittest test_accounts_2027_contract test_accounts_2027 test_accounts_2027_package`.
Verificado localmente en modo prueba, sin despliegue ni acceso al XLSX
original. La huella local no acredita autenticación del origen,
firma, cierre o cobro.

## Referencia privada del PDF en la propuesta · 13 noviembre 2026

La huella de origen contractual incorpora la referencia privada de
Drive. Dos archivos con bytes idénticos producen propuestas distintas
si cambia la referencia. El enlace no aparece en el resultado.

La prueba reprodujo que el empaquetador admitía el cambio bajo el
identificador anterior. Tras la corrección lo rechaza y no crea copia
ni deja temporales. Pasaron 17 pruebas ficticias con
`PYTHONPATH=tests python3 -m unittest test_accounts_2027_contract`.

Verificado localmente en modo prueba. Sin despliegue ni acceso a Drive
o al XLSX original. La comprobación autenticada sigue pendiente.

## Identidad de la auditoría en el diario local · 13 noviembre 2026

El diario comprueba la propuesta y la huella del XLSX de origen que
devuelve la auditoría antes de registrar una copia como verificada.
La regresión reprodujo que un contrato distinto con las mismas celdas
podía validar una reserva previa. Tras el cambio, el ensayo registra
el fallo y no guarda una huella de copia verificada.

Pasaron 21 pruebas ficticias con
`PYTHONPATH=tests python3 -m unittest test_accounts_2027_ledger test_accounts_2027_trial`.
Verificado localmente en modo prueba, sin despliegue ni acceso al XLSX
original. El diario no acredita una escritura remota.

## Reserva local vinculada al exportador · 13 noviembre 2026

El ensayo con diario pasa al exportador el identificador reservado.
El exportador vuelve a calcularlo antes de importar el XLSX y bloquea
cualquier discrepancia antes de crear el directorio de salida.

Pasaron 10 pruebas de `PYTHONPATH=tests python3 -m unittest test_accounts_2027_trial`
y la comprobación de sintaxis. Con
`python3 tests/run_accounts_2027_artifact_trial.py`, el exportador local
rechazó una reserva distinta sin dejar salida. Con la reserva correcta,
la auditoría confirmó la conservación de la copia sintética y su enlace.

Verificado localmente en modo prueba, sin despliegue, acceso a Drive
ni escritura en el XLSX original.

## Exportador y diario en el mismo ensayo · 13 noviembre 2026

El ensayo reproducible `python3 tests/run_accounts_2027_artifact_trial.py`
ejecutó el contrato ficticio, la propuesta, la reserva SQLite, el exportador
XLSX y la auditoría independiente. La huella registrada coincide con los
bytes de la copia. Un segundo intento verificó la misma copia sin invocar
el exportador. Se conservó el hipervínculo y el origen ficticio quedó
intacto. El directorio temporal se elimina al terminar.

Verificado localmente en modo prueba. Sin despliegue ni acceso al libro real.
La autenticación de origen y la escritura remota siguen pendientes.

## Reintento con una copia modificada · 13 noviembre 2026

El ensayo `python3 tests/run_accounts_2027_artifact_trial.py` modifica
el comentario ZIP de la copia ficticia después de verificarla. El
reintento rechaza los bytes distintos con CANDIDATE_CHANGED. Al restaurar
la copia exacta se recupera el resultado original del diario sin invocar
el exportador. La prueba pasó con el exportador XLSX local.

Verificado en modo prueba, sin despliegue ni acceso al libro original.

## Separación del diario y la salida local · 13 noviembre 2026

El ensayo rechaza un diario SQLite situado en la ruta de salida o
dentro de ella antes de crear el diario, su bloqueo o una copia.
Los dos casos ficticios se comprobaron con
`PYTHONPATH=tests python3 -m unittest test_accounts_2027_trial`.
Pasaron 11 pruebas locales en modo prueba, sin despliegue ni acceso
al XLSX original.
