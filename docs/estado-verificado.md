# Estado verificado · 3 noviembre 2026

**MODO PRUEBA ACTIVO.** No se han contactado clientes, enviado presupuestos/contratos ni invitado clientes reales. La sincronización general continúa desactivada. Nacho conserva la única administración; Azahara conserva el único perfil sales tras retirar identidades técnicas.

## Código, despliegue y comportamiento

| Elemento | Código / despliegue | Comprobación y límite |
| --- | --- | --- |
| Formulario público | Publicado en index.html; public-enquiry v1 activa | HTTP real: solicitud ficticia + repetición = una solicitud; avisos internos; sin presupuesto/evento/cuenta. Solo PRUEBA y correo .invalid. |
| Efectivo100 particular | Modelo, lector, Edge, fiscal guardado y presentación implementados | Pruebas locales y SQL: base 1000, IVA 210, total 1210, reserva 0. Nueva importación real desde Google pendiente de publicar Apps Script. Empresa conserva modalidad y reglas; no se inventa exención. |
| Vinculación de presupuesto | workflow.js publicado; quote-bridge v1 activa | JWT/roles y errores comprobados por HTTP. Revisión exacta, HMAC, caducidad, releer antes de autorizar e idempotencia comprobados con dobles. La lectura Google desplegada todavía no ofrece esta ruta: falla cerrada 502 y no crea preview/importación. |
| Receptor firmado | ingest-accepted-quote v5 activa | Pruebas con dobles: firma, conflictos, impuestos, origen y repetición. Las dos importaciones históricas reales siguen intactas. |
| Preparación del evento | RPC y UI publicados | Dos eventos ficticios preparados usando el RPC con rol administrativo simulado en SQL sobre la base real. Idempotencia y reserva bloqueada comprobadas con ROLLBACK. Sin cliente asignado al finalizar. |
| Paneles | admin, staff y portal publicados | Roles y aislamiento por HTTP con sesiones Auth ficticias; pruebas locales de navegación y presentación. Browser sin sesión muestra exclusivamente acceso privado. No se ha comprobado visualmente una sesión personal de Nacho/Azahara. |
| Documentos | import-event-document v2 activa; bucket privado existente | Importación PDF exacta, validación y rechazo de conflicto probados con dobles; RLS de metadatos probado en SQL. HTTP rechaza comercial y no firma objeto ajeno/inexistente. No equivale a probar descarga de un PDF real existente. |
| Apps Script | Commit ef1dcac19822cfeb5b5b836a8dd07deaaebf135d guardado | Tests pasan; publicación bloqueada por Google invalid_grant / invalid_rapt antes de subir código. Editor e implementación WhatsApp no se actualizaron en esta ejecución. |

App publicada: https://flamencoevents.github.io/Flamenco-Events-app/

Despliegue Pages del código principal: https://github.com/flamencoevents/Flamenco-Events-app/actions/runs/41733521042 (success, commit e86616dc4d36298e6bf1c01ac8674422b28050a7). La revisión documental y el control adicional de conflicto PDF se guardan posteriormente en main.

Intento Apps Script: https://github.com/flamencoevents/flamenco-events-appscript/actions/runs/41732895411 (tests success; publicación no ejecutada por autenticación Google).

## Funcionamiento implementado

Solicitud → aviso interno → llamada registrada → validación de datos → autorización expresa → registro de envío efectuado fuera de la app → aceptación comprobada. Los controles del servidor rechazan saltarse etapas. Ningún formulario crea/envía presupuestos ni activa clientes automáticamente.

Una solicitud aceptada permite seleccionar número, revisión y clave exactos de FE_Cola. La previsualización exige una única fila GENERADO y copia FE3 coherente. Esa condición de Sheets no acredita aceptación. La confirmación de equipo queda ligada al usuario y caduca a diez minutos; se relee la copia antes de importar y se rechazan cambios. Se conserva origen y desglose fiscal sin recalcular.

Preparar evento exige versión aceptada concreta. El evento queda contract_pending, sin cliente inicialmente y marcado PRUEBA. El cliente ve únicamente esa versión vinculada; no todas las revisiones de la solicitud. La asignación exige identidad cliente verificada y, en prueba, marca técnica de servidor. El comercial coordina repertorio/vestuario/horarios y tareas sin concederse administración ni cambiar propietario.

Los documentos se copian desde la fila exacta a almacenamiento privado, nunca a GitHub Pages. Importación solo administrativa, PDF hasta 10 MB, sin enlaces Drive públicos ni regeneración Canva. Otro PDF para el mismo tipo/versión se rechaza antes de subirlo. No hay actualmente cola FE_Contratos en el libro ni PDF en las nuevas copias ficticias; no se inventan documentos.

## Evidencia de pruebas

- 25 tests Node de la app: receptor, flujo Edge con dobles, documentos, navegación y presentación. No son pruebas reales Google.
- 20 tests Node de Apps Script: adaptador/endpoint con dobles, incluida fiscalidad contra la función económica existente. Además pasan solicitudes, historial, PDF WhatsApp, formulario y contratos existentes. No se modificó economia.js ni plantillas aprobadas.
- `supabase/tests/continuation-rollback.sql`: base real con roles/JWT simulados localmente en SQL, usuarios ficticios, consentimiento ausente/nulo, cuotas, repetición, secuencia comercial, efectivo, evento idempotente, reserva bloqueada, límites comerciales y aislamiento de eventos/condiciones/metadatos documentales. Finaliza ROLLBACK.
- HTTP real public-enquiry: dos solicitudes ficticias independientes, cada una repetida sin duplicado. Referencias 55f22935-f89c-4011-a663-f3f918005cb2 y 997d4c49-7627-4734-b9bb-e647d6fc0b49. La primera sigue new; la segunda completó etapas comerciales **simuladas**, anotadas expresamente, sin llamadas ni envíos reales. Ambas sin presupuesto importado.
- HTTP real con tres identidades técnicas temporales: cliente no usa puente 403; comercial no importa PDF 403 ni prepara evento 403; salto new→accepted 403; secuencia comercial autorizada 204 por etapa; falta autorización 422; revisión/clave inconsistente 422; lectura Google no publicada 502 sin escrituras.
- HTTP real con dos clientes técnicos: cada uno consulta un solo evento y sus condiciones; cero solicitudes y cero previews ajenos. Una petición de firma a objeto ajeno/inexistente devuelve 400 sin enlace. Esta última comprobación sola no acredita denegación de un PDF existente; lo complementan las pruebas SQL de RLS y dobles.
- Las identidades, sesiones y perfiles técnicos se retiraron. Los dos eventos se dejaron sin cliente. Cero administradores adicionales al finalizar. La primera preparación de usuarios técnicos tuvo un error de fecha ausente en identities; se corrigieron solo esos registros ficticios y las sesiones posteriores funcionaron. No se alteró SMTP ni cuentas reales.
- Browser: formulario público renderizado, sin antigua demo local; paneles comercial/administrativo muestran login sin datos privados. No se emitieron enlaces de correo.

## Datos reutilizables de prueba

| Origen | Registro | Resultado |
| --- | --- | --- |
| Prueba histórica firmada | 9999926 v1 · solicitud ca4ecea7-863f-4077-b5a9-20454aeb364b | Total 1000 / reserva 300, una condición aceptada; evento ficticio b27248d1-e4c4-489f-9f05-d448a373253c preparado. |
| Lectura histórica real FE_Cola | X26-P000004 v1 · solicitud 63310bc3-2785-4ecd-8b31-525a29578dc1 | Total 520 / reserva 0, referencia de origen intacta; evento ficticio c7fccf50-5de1-458c-b3af-04a3bee6b45e preparado. Aceptación comercial simulada. |
| Nueva pestaña FE_App_Pruebas | X26-P900001-v1 y -v2 | Copias ficticias FE3: 1210/0 e IVA210; 1331/0 e IVA231. Sin PDFs, cuentas ni envíos. Aún NO importadas desde Google por el bloqueo de publicación. |

La pestaña técnica tiene cabeceras A:L equivalentes a FE_Cola, encabezado congelado y nota de prueba. Se verificaron valores/formatos por API; no se realizó inspección visual de Google Sheets con cuenta iniciada. No se alteraron FE_Cola, fórmulas ni documentos de origen. Las copias técnicas no forman parte de las colas automáticas.

## Pendientes reales y siguiente acción

1. **Renovar autorización Google de clasp**: Google exige autenticación personal (invalid_rapt). Desde el equipo de Nacho, renovar la sesión de la misma cuenta autorizada y actualizar privadamente el secreto GitHub Actions CLASPRC_JSON. Nunca copiar su contenido al chat. Después ejecutar el workflow Apps Script mediante workflow_dispatch con publicar=true. No basta con subir al editor.
2. Repetir la nueva operación autenticada Sheets→preview→autorización→importación con X26-P900001-v1; comprobar 1210/IVA210/reserva0, repetición y cambio de copia entre lectura y autorización. Mantener apagada la sincronización general. Esa prueba entre servicios no está confirmada todavía.
3. Con un PDF de prueba autorizado disponible, comprobar importación real y descarga de objeto existente con sesiones cliente A/B. Contrato/Canva/Drive conservados, sin regeneración innecesaria. No se ha confirmado el circuito documental completo.
4. Nacho debe definir los requisitos de reserva formal, incluido el caso de reserva económica cero. Hasta entonces y mientras siga modo prueba, la confirmación permanece bloqueada. Importar importes o aceptar comercialmente no confirma una reserva.
5. Captación real requiere revisión de datos/contacto, información de privacidad y consentimientos del negocio. La implementación actual recoge exclusivamente consentimiento técnico ficticio; no es una autorización de lanzamiento. Faltan comprobaciones con sesiones personales y móviles Safari/Android.

Seguridad: tabla privada intake_limits sin políticas de usuarios está cerrada deliberadamente; solo service_role usa la cuota. El aviso existente de contraseñas filtradas deshabilitadas sigue pendiente de decisión de Auth. Se eliminaron índices duplicados y se indexó recorded_by, conservando restricciones únicas. El historial incluye las tres migraciones nuevas aplicadas. No se han cambiado ni leído secretos.
