> **Estado vigente:** comprobación de bytes privados incorporada en
> import-event-document **v8 ACTIVE**. Código/bundle comparados y 83 pruebas
> sintéticas en GitHub superadas. No hay todavía prueba Auth/Google/Storage
> positiva real de esta operación ni escritura contable. Ver evidencia al final.

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

## Límites explícitos de v7 (histórico)

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

## Comprobación de bytes almacenados · continuación del 6 noviembre

El código ampliado de `accounts_preview` ya descarga internamente el objeto
exacto desde el bucket privado `event-documents`, después de superar las
comprobaciones de identidad y cifras anteriores. Solo admite rutas con el UUID
del evento, `contract-vREVISION-` y una huella hexadecimal de 64 caracteres más
`.pdf`. Rechaza otro evento/revisión, presupuesto, URL, ruta vacía o traversal
antes de leer Google o Storage. La ruta se toma de los metadatos de servidor;
ningún campo de ruta del cuerpo autoriza seleccionar un objeto.

Comprueba tamaño contra el PDF de origen y límite de 10 MB, cabecera PDF y SHA-256
de los bytes descargados. La igualdad de tamaño y de metadatos no sustituye la
comparación de contenido. Un objeto distinto con la misma longitud se rechaza.
Los errores de Storage se convierten en error genérico 502, sin propagar rutas
o mensajes internos. No se generan URLs firmadas ni se retornan bytes.

En el código ampliado, un resultado correcto incluye `stored_pdf_bytes=true`
y ya no enumera ese control como pendiente. Siguen pendientes fecha/horario,
versión y mes del XLSX, diario remoto y reglas comerciales. Esto no es firma,
cierre o movimiento económico. `production_writable=false`, `remote_committed=false`;
sin escrituras, cambios de permisos, fórmulas, PDF o libro real.

Prueba local afectada:

```sh
node --test tests/accounts-preflight.test.cjs tests/edge-workflow.test.cjs
```

**30 pruebas afectadas superadas**, 12 del preflight y 18 del flujo Edge. Cuatro
casos nuevos cubren contenido alterado con idéntico tamaño, aislamiento de ruta,
errores de servicio sin filtración y tamaño/cabecera inválidos. Los reintentos
siguen leyendo sin crear escrituras ni promover estado contractual. Auth,
Google y Storage son dobles; no se usaron cuentas/sesiones ni PDF reales.
No se repitieron las pruebas Python/XLSX sin cambios.

Referencia técnica verificada antes de implementar:
https://supabase.com/docs/reference/javascript/storage-from-download . Se usa
la llamada estable download(path), manteniendo el cliente y versión existentes.

Estado en este punto: preparado y probado localmente. La publicación y prueba
remota deben constar después; las pruebas sintéticas no acreditan descarga real
de Storage con sesión administrativa.

### Publicación de la comprobación de bytes

- Código en main: `e1459b96619a54e4a3012c437dc29e420b9bdec7`.
- Workflow https://github.com/flamencoevents/Flamenco-Events-app/actions/runs/42282609740 :
  success. Logs confirman **83 tests, 83 pass, 0 fail**. Las 30 pruebas afectadas
  también pasaron localmente. No se repitieron localmente las demás sin cambios.
- Función existente actualizada a **v8 ACTIVE**. Se comprobó que v7 seguía intacta
  antes de publicar. El bundle leído después coincide con index.ts guardado;
  bridge.ts y autenticación propia se conservan, con verify_jwt=false anterior.
- La comparación positiva de bytes y sus fallos están probados con dobles. No se
  ha utilizado una sesión administrativa real ni se ha descargado en esta
  continuación ningún PDF real de Drive o Storage. El rechazo anónimo 401 de v7
  sigue como evidencia anterior; no se repitió al no cambiar la autenticación.
- Sin operaciones SQL, usuarios, asignaciones o sesiones nuevas; no hay limpieza
  remota pendiente. Ningún cambio de bucket, permisos, plantilla, fórmula, PDF,
  cobro o libro XLSX. Modo prueba y sincronización apagada conservados.

Pendientes actuales: probar con acceso administrativo ya autorizado el recorrido
positivo de esta operación, conciliar fecha/horario y conectar el diario privado
con versiones de una copia remota aislada. Ninguno de estos controles habilita
firma, reserva, cierre o escritura en el libro real por sí solo.


## Inventario remoto previo al ensayo positivo · 6 noviembre 2026

Lecturas SQL reales, sin mutaciones, confirman test_mode=true, tres eventos
ficticios, tres fichas aceptadas y un único documento contractual. Los otros
dos eventos no tienen PDF contractual incorporado.

El único contrato vinculado conserva un objeto en el bucket event-documents
(2206 bytes según metadatos Storage), pero event_documents.sha256 y
source_reference son NULL. Sus condiciones son individual_full_invoice y
payment_method=efectivo100. Ambas modalidades siguen expresamente bloqueadas
por accounts_preview. Que el contrato técnico histórico tenga state=sent no
levanta esos bloqueos ni acredita aprobación comercial.

Por tanto, no existe actualmente una fixture remota elegible para obtener
accounts_source_checked: la modalidad se rechaza antes de comprobar los
metadatos, y estos tampoco cumplen los requisitos. La mera disponibilidad de
una sesión administrativa no resuelve este impedimento. La existencia y tamaño
del objeto proceden de catálogo SQL; no acreditan descarga HTTP ni SHA-256 de
sus bytes. No se ha ejecutado la operación con Auth real en esta continuación.

Próximo ensayo positivo: preparar un presupuesto ficticio de modalidad ya
admitida, con su secuencia comercial de prueba y origen verificable; importar
su PDF contractual mediante el circuito existente para registrar huella y
origen; vincular la misma revisión y ejecutar accounts_preview con sesión
administrativa autorizada. Comprobar también denegación comercial/cliente.
No rellenar huellas manualmente ni cambiar la modalidad de la fixture histórica
para forzar un resultado positivo. No considerar esta lectura como prueba de
firma, reserva, cierre contable o sincronización.

No se cambiaron datos, objetos, permisos, usuarios, sesiones ni funciones.
CUENTAS 27 no se abrió ni modificó. No se ejecutaron pruebas de código al no
haber cambios de implementación.


## Fallo de lectura del cuerpo privado · 6 noviembre 2026

Protegida también la lectura arrayBuffer del Blob: si falla después de download,
accounts_preview responde 502 genérico sin propagar mensajes internos ni emitir
evidencia contable. Prueba sintética nueva con excepción que contiene una ruta
secreta; comprueba ausencia de filtración, evidencia y escrituras.

13 pruebas afectadas superadas localmente con node --test tests/accounts-preflight.test.cjs.
Código y prueba guardados en GitHub. Preparado, NO desplegado: v8 continúa como
última publicación documentada. No se repiten pruebas XLSX sin cambios.
El ensayo positivo real sigue pendiente del nuevo presupuesto/contrato ficticio
que Nacho indicó que prepararía; no se alteró la fixture histórica ni se crearon
identidades. CUENTAS 27 intacto y sincronización apagada.
