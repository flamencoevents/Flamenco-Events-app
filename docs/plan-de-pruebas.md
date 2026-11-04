# Pruebas y continuidad · 4 noviembre 2026

MODO PRUEBA; solo datos ficticios. Evidencia y límites en [estado-verificado.md](estado-verificado.md).

## Superado

- 28 pruebas locales de la app y 20 del puente Apps Script, además de las baterías económicas/formulario/contratos/WhatsApp existentes.
- SQL transaccional con ROLLBACK: consentimiento nulo/ausente, cuotas, idempotencia, secuencia, evento, efectivo, roles y RLS de dos clientes.
- HTTP con identidades ficticias: captación repetida sin duplicados, secuencia, rechazo de privilegios e aislamiento de eventos/presupuestos.
- Publicación Apps Script v44: workflow 41786601991. Bloqueo Google resuelto.
- HTTP real Sheets→lectura firmada→autorización→importación para X26-P900001-v1: total1210, IVA210, reserva0 y referencia exacta. Repetición de la misma aprobación sin duplicados.
- Revisión 2 seleccionada explícitamente: total1331, IVA231, sin importar. Cambio posterior de copia ficticia rechazado con 409; copia restaurada y verificada.
- Evento ficticio preparado desde versión 1 con RPC bajo rol SQL simulado; repetición devuelve mismo evento y reserva formal sigue bloqueada.
- Identidad técnica de esta prueba desactivada y sesiones revocadas; auditoría conservada. Solo Nacho y Azahara conservan perfiles de administración/comercial.

## Continuación

1. Probar importación real de PDF de prueba autorizado y acceso propio/denegación ajena a un objeto existente. No sustituirlo por una comprobación de archivo inexistente.
2. Revisar estado actual de contratos, Canva y Drive; conservar plantillas aprobadas. No dar por generado/publicado/firmado un documento por existir código.
3. Revisar paneles con sesiones personales y Safari iPhone/Chrome Android.
4. Definir requisitos finales de reserva, especialmente anticipo cero, y revisar captación real con privacidad/consentimientos del negocio.
5. Si vuelve a aparecer SOURCE_NOT_VERIFIED bajo solicitudes paralelas, investigar su causa. Se observó una vez y la repetición secuencial funcionó; la causa no está confirmada.

No ejecutar schema.sql histórico ni repetir migraciones ya aplicadas. No reconfigurar SMTP o rol comercial sin evidencia de problema. No desactivar modo prueba ni activar sincronización general.

## Ensayo documental preparado

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

