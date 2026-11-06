# Comprobación previa contractual y económica · 6 noviembre 2026

## Alcance preparado

La operación administrativa `accounts_preview` de `import-event-document`
comprueba el enlace de un evento ficticio con sus condiciones aceptadas, contrato
y metadatos del PDF privado ya incorporado. Solo admite MODO PRUEBA comprobado
en servidor. Reutiliza autenticación y lectura HMAC existentes; no crea otro
servicio, tabla, permiso o integración de pago.

Entrada mínima:

```json
{"operation":"accounts_preview","event_id":"00000000-0000-4000-8000-000000000301","kind":"contract"}
```

El UUID es sintético; no identifica un evento real. Solo se utiliza en fixtures.
La identidad procede de Auth.getUser y del perfil en base, nunca del cuerpo.
Comercial y cliente reciben 403; una petición sin sesión recibe 401. No hay
botón nuevo, credenciales guardadas, invitaciones ni sesiones de ensayo creadas.

## Comprobaciones

- Evento y solicitud ficticios; llamada, autorización, envío y aceptación
  registrados según el control de secuencia existente. Una prueba sintética de
  esos campos no acredita una llamada o envío real.
- Ficha económica de la misma solicitud y referencia exacta de origen, incluidos
  número textual, clave, pestaña y revisión. Se rechazan sufijos adicionales.
- Contrato del mismo evento y presupuesto, con documento de esa revisión.
- PDF actual leído por el puente HMAC: su SHA-256 coincide con los metadatos del
  documento privado incorporado. Una huella ausente o distinta bloquea la consulta.
- Nueva lectura firmada de las condiciones de origen: total, reserva prevista,
  modalidad y los seis campos fiscales coinciden con la versión aceptada.
  No se recalculan impuestos ni se redondean cifras para tolerar diferencias.
- Efectivo100 y factura completa particular siguen bloqueados a falta de la
  aprobación contractual correspondiente. No se inventa cláusula o reserva.

La respuesta `accounts_source_checked` incluye únicamente identificadores,
revisión, huella/tamaño e indicadores de comprobación. No devuelve el PDF, enlaces
Drive/Storage, referencia privada completa, importes ni datos del cliente.
`source_response_hmac` acredita la respuesta del puente, **no una firma del
cliente**. La firma contractual permanece `false` en este informe.

## Límites explícitos

La consulta no descarga los bytes almacenados en Storage: compara el PDF de
origen con los metadatos de incorporación. `stored_pdf_bytes=false` lo expresa.
Tampoco verifica horario/fecha contractual, huella/versión del XLSX, bloque
mensual, firma electrónica, cierre comercial, reserva ni cobros. El estado
contractual existente no se promociona ni se interpreta como cierre contable.

Es una comprobación puntual de dos lecturas sucesivas; no es snapshot atómico,
token de autorización ni condición suficiente para una escritura posterior.
El futuro coordinador debe releer las fuentes y conciliar su versión antes de
actuar. No se integra todavía con el diario SQLite ni con el escritor MJS.

No hace INSERT/UPDATE/RPC, upload o reemplazo de archivos; mantiene
`production_writable=false`, `remote_committed=false` e `is_forecast=true`.
CUENTAS 27 no se abre ni se modifica. La sincronización general sigue apagada.

## Pruebas reproducibles

```sh
node --test tests/accounts-preflight.test.cjs tests/edge-workflow.test.cjs
node --test --test-concurrency=1 tests/*.test.cjs
```

Ocho casos nuevos con dobles cubren acceso, modo, secuencia comercial, revisión,
documento ajeno, huella y cifras cambiadas, HMAC/nonce/redirección, fiscalidad,
ausencia de datos privados en salida y reintentos sin escrituras. Fixture PDF,
Auth, base y Google son sintéticos. No acreditan un recorrido Auth/Google real.

La ampliación detectó dos pruebas desactualizadas por cambios anteriores de la
web: `accounts-events` esperaba cinco columnas aunque ahora usa fichas, y
`accounts-history` esperaba sheetHtml y un mock sin limit(), aunque el panel
ahora solicita solo source_url y muestra un enlace. La segunda podía quedarse
esperando indefinidamente. Se actualizaron las pruebas al comportamiento vigente,
sin modificar la interfaz ni restaurar un visor retirado. Se añadió comprobación
del cero inicial visible sin mutar la referencia original.

Resultado local: **79 pruebas Node superadas**, incluidas ocho del preflight y
la nueva de referencias. El workflow web ahora vigila también cambios en Edge
y en el harness. No se repitieron las pruebas Python/XLSX sin cambios.

Lectura SQL remota de configuración, sin modificaciones: test_mode=true y un
perfil por cada rol admin/sales. No se crearon accesos ni hay limpieza de sesiones
pendiente de esta continuación. Se verificó que el bundle remoto anterior v6
coincide con el origen GitHub, antes de preparar una actualización.

Estado en este punto: código preparado y probado localmente. El despliegue y su
comprobación se documentan aparte tras obtener evidencia; no se deducen de CI.

## Despliegue y evidencia confirmados

- Código guardado en main: `444783b851a3e899e57c4e4bc2c5c195f3bbc0bd`.
- GitHub Actions https://github.com/flamencoevents/Flamenco-Events-app/actions/runs/42274256444 :
  success; logs de mocked-web-tests confirman 79 pruebas, 79 superadas, cero fallos.
- Actualización de la función existente `import-event-document`: **v7 ACTIVE**.
  Antes de desplegar se volvió a comprobar que v6 no había cambiado. Lectura del
  bundle v7 confirma index.ts idéntico al código guardado y bridge.ts conservado.
  verify_jwt=false se mantiene porque el código conserva autenticación propia
  mediante Auth.getUser y autorización de perfil, no acceso libre.
- HTTP real sin credenciales, POST accounts_preview con UUID sintético:
  **401, Acceso requerido**. No crea petición de correo ni sesión.
- No se ha probado esta nueva operación con sesión Auth administrativa real y
  fuentes Google reales. La correspondencia documental/económica se ha probado
  con dobles; el despliegue y la denegación anónima sí tienen evidencia remota.
- No se modificaron Apps Script, SQL/RLS, permisos, documentos ni libro XLSX.
  No se activó la sincronización ni se crearon usuarios o asignaciones.

Siguiente paso: completar comprobación de bytes en Storage y fecha/horario,
seguida de integración con el coordinador privado de operaciones y la versión
remota de una copia aislada. Este preflight no autoriza ni ejecuta esa escritura.
