> Actualización del 6 noviembre: el bloqueo XLSX descrito en el historial de este
> documento se resolvió en copia aislada con empaquetado conservador; ver
> [evidencia vigente](circuito-whatsapp-cuentas.md). Registro local de operaciones
> preparado con 12 pruebas nuevas; sin escritura remota ni integración desplegada.

# Prioridad vigente: web de gestión de Flamenco Events

> Comprobación administrativa de enlace contractual y económico desplegada en
> import-event-document v8: contrasta también bytes del PDF privado almacenado.
> [Conciliación en servidor, evidencias y límites](conciliacion-servidor-cuentas.md).
> Consulta exclusivamente ficticia, sin escritor remoto ni integración contable
> activada; falta ensayo positivo Auth/Google/Storage de esta operación.

> Consulta de eventos del libro en ambos paneles y página de balances reservada
> a administración: [avance y flujo confirmado](listado-eventos-cuentas.md).
> La incorporación automática de documentos al libro sigue pendiente; la tabla
> publicada es una lectura incorporada del origen, no sincronización en vivo.

> Última continuación del circuito WhatsApp → contrato → cuentas:
> [ensayo integrado y evidencia actual](circuito-whatsapp-cuentas.md).
> 40 pruebas sintéticas locales; empaquetado conservador y auditoría de copia
> superados. No hay escritura contable automática ni cambio del original.

Decisión de Nacho: 5 de noviembre de 2026. Sustituye la prioridad anterior de crear primero una app. MODO PRUEBA conservado.

## Resultado esperado

Una web de gestión empresarial desde la que administración y comercial controlen el flujo de solicitudes, atención personal, presupuestos, aceptación, contratos, acceso privado, coordinación y eventos. Los datos económicos derivados deben vincularse al seguimiento histórico de Flamenco Events y alimentar los balances con trazabilidad.

La adaptación a app se abordará después de completar y verificar la web. No se elimina el trabajo anterior: se reutilizan Supabase, permisos, puente Apps Script, presupuestos, plantillas y paneles existentes. Los porcentajes anteriores de avance correspondían al alcance anterior y no miden este alcance ampliado.

## Fuentes comprobadas y límites

Se ha consultado la cuenta Google Drive de Flamenco Events. Se localizaron el libro de cuentas con seguimiento anual de eventos y resúmenes de gastos/ingresos, el libro de presupuestos ya conectado y otro seguimiento de fechas cerradas. La inspección inicial fue de metadatos, cabeceras y rangos acotados; no una conciliación de todos los registros.

El seguimiento económico contiene número de presupuesto, fecha/evento, presupuesto, reserva cobrada, IVA, fecha de reserva, cobro pendiente, gastos y cobro total. Existen fórmulas de agregación mensual en el libro de gastos/ingresos. No se cambiaron hojas, importes, fórmulas, fechas, permisos ni registros reales.

Los identificadores de los nuevos libros privados, las filas reales, los clientes y sus cifras no se incluyen en el repositorio público. El hecho de localizar un archivo no lo convierte automáticamente en fuente maestra única: hay que reconciliar libros y versiones, incluida la coexistencia de formatos nativo/Excel.

## Módulos de la web

1. Inicio y seguimiento de trabajo pendiente.
2. Solicitudes y llamada obligatoria de Azahara.
3. Presupuestos con cálculo aprobado, autorización y revisión exacta.
4. Contratos, documentos privados y firma verificada.
5. Agenda de eventos y coordinación.
6. Ficha económica de cada evento, vinculada al presupuesto y contrato.
7. Cobros, pagos y gastos reales, con fechas y justificantes.
8. Resúmenes económicos y balances según las definiciones del negocio.
9. Administración, permisos, historial de cambios y conciliación.
10. Área privada del cliente reutilizada cuando corresponda.

La interfaz unificada no fusiona privilegios: Nacho mantiene administración; Azahara mantiene comercial y coordinación. No se amplían permisos económicos por inferencia ni se exponen datos de otros clientes.

## Enlace de datos

La identidad interna del evento vinculará solicitud, número de presupuesto, clave y revisión aceptada, contrato y versión documental. Los movimientos económicos conservarán origen, referencia estable, concepto, importe exacto, moneda, fecha y estado comprobado.

El número de presupuesto del histórico es un candidato de enlace que debe comprobarse. No basta por sí solo si hay años, revisiones o filas repetidos. No se enlazarán automáticamente eventos por coincidencia aproximada de cliente, lugar o fecha. Los casos ambiguos se presentan para conciliación sin crear duplicados.

Se conservará el origen del dato y la evidencia del cambio. Reimportar un registro no puede duplicar ingresos/gastos. Una revisión de presupuesto no sustituye silenciosamente una versión aceptada ni cambia movimientos ya registrados.

## Información económica y balances

- Presupuestado no equivale a contratado.
- Contratado no equivale a cobrado.
- Gasto previsto no equivale a gasto real ni a pago realizado.
- Reserva, saldo, cobro total e impuestos no son ingresos independientes que deban sumarse de nuevo.
- La revisión aceptada no se mezcla con otras revisiones o presupuestos rechazados.
- Los datos ficticios permanecen separados de los reales y no entran en balances reales.
- La fecha del evento, la fecha de aceptación y la fecha de cobro/pago se conservan separadas.
- Los importes e impuestos de presupuesto no se recalculan al importarlos.
- Las fórmulas económicas y plantillas aprobadas se conservan.
- No se publica un indicador como beneficio o balance hasta verificar sus componentes y la definición que usa el negocio.

Falta inventariar fórmulas y relaciones del histórico completo, significado de cada columna y criterio de periodo de cada balance. No se introduce por cuenta propia una definición contable, un reparto de beneficios o una nueva regla fiscal.

## Orden de ejecución y condiciones de aceptación

1. Inventariar fuentes y conciliar el histórico: identificar libros/hojas vigentes, claves, fórmulas, duplicados y campos pendientes. Entrega: mapa de datos sin cambios en origen.
2. Definir y probar el enlace entre evento, presupuesto, contrato y economía usando datos ficticios. Entrega: importaciones repetibles y rechazos de ambigüedad sin escrituras parciales.
3. Unificar la gestión en la web, reutilizando paneles y servicios existentes. Entrega: recorrido usable para Nacho y Azahara, con permisos comprobados en servidor.
4. Incorporar seguimiento económico privado y balances conciliados con los libros de origen. Entrega: diferencias explicadas y ausencia de dobles cómputos.
5. Completar contratos, firma, reserva formal y automatizaciones pendientes dentro de la web. Entrega: pruebas integradas y decisiones comerciales resueltas.
6. Verificar web en escritorio y móvil, idiomas, recuperación, seguridad y documentación. Entrega: código desplegado y comportamiento verificado diferenciados.
7. Solo después: adaptación a app de la web verificada, reutilizando servidor y datos. No se mantendrá una segunda base económica independiente.

El primer paso se ha iniciado con la localización y lectura acotada de fuentes. No se ha completado todavía el enlace económico, la migración histórica ni la web unificada.

## Condiciones conservadas

Modo prueba hasta autorización expresa; sin clientes reales, correos comerciales, contratación de servicios o costes nuevos. Sincronización general desactivada hasta autorización. No se habilitan reservas ni firma por disponer de interfaz. Las decisiones de efectivo100, cancelación sin anticipo, reserva formal y proveedor de firma siguen pendientes.

## Entrada de gestión y Espacio cliente

La gestión se prepara para gestion.flamencoevents.net. Nacho activará manualmente el subdominio cuando la web esté terminada. Referencia: [dominio-gestion.md](dominio-gestion.md). No se modifica DNS desde este desarrollo.

Cuando el espacio privado esté verificado y se autorice el uso real, se incorporará el enlace «Espacio cliente» al menú de www.flamencoevents.net. Llevará al área de eventos del cliente, separada de administración/comercial. No se ha añadido el enlace en la web IONOS ni activado clientes.


## Registro de contratos de WhatsApp en cuentas 2027 · 6 noviembre 2026

Decisión vigente de Nacho: el destino operativo de los eventos de 2027 es «CUENTAS 27 FLAMENCO EVENTS», manteniendo la organización que utiliza actualmente. Los datos de contratos originados desde el grupo WhatsApp deben enlazarse con ese libro y con la ficha del mismo evento en la web. El libro 2025/2026 queda como histórico; no sustituye al destino indicado. Inicio previsto: enero de 2027, sin activación automática por fecha y siempre sujeto a autorización expresa de salida de MODO PRUEBA.

### Estructura comprobada, sin escritura

Se localizó el archivo original y se inspeccionó una copia descargada, sin modificar el origen. El archivo es XLSX, no Google Sheets nativo. Contiene cinco hojas. La hoja principal «Fechas cerradas 2027 por fecha » conserva un espacio final en su nombre; contiene diez fórmulas y cuatro hipervínculos. Las otras hojas incluyen seguimiento por cierre, IVA trimestral y gastos; su contenido no se replica por inferencia.

| Columna | Campo existente | Regla de integración pendiente de implementar |
| --- | --- | --- |
| A | MES | Mantener bloques mensuales según fecha del evento. |
| B | Nº | Conservar numeración existente; no asignar una nueva regla sin comprobarla. |
| C | nº presup | Conservar referencia textual e hipervínculo privado existente; resolver número, clave y revisión exactos en la trazabilidad. |
| D | FECHA | Fecha del evento; no deducir año del número del presupuesto. |
| E | HORARIO | Horario de la versión contractual comprobada. |
| F | LUGAR | Lugar de esa misma versión. |
| G | WEDDING/CLIENTE | Correspondencia exacta de los datos; sin enlaces aproximados por nombre. |
| H | PRESUPUESTO | Importe contractual conciliado, sin recalcular impuestos. |
| I | COBRADO RESERVA | Solo cobro acreditado; nunca copiar aquí la reserva prevista por generar un contrato. |
| J | IVA | Preservar valor y representación originales; una marca textual no prueba exención ni IVA cero. |
| K | FECHA RESERVA | No inventar fecha a partir de la generación o publicación del PDF; significado a conciliar antes de escribir. |
| L | Cobro pendiente | Respetar fórmulas y significado conciliado; no sumar como ingreso adicional. |
| M | ARTISTAS | Datos de coordinación comprobados, sin inventar asignaciones. |
| N | GASTOS ARTISTAS y DESPLAZAMIENTO | Separar previsión de gasto y movimiento real antes de incorporar. |
| O | GASTOS GRABACION DE VIDEO | Mismo control de previsión frente a gasto real. |
| P | COMISION WED. | Conservar criterio aprobado; no inferir comisión. |
| Q | COBRO TOTAL | Preservar fórmulas y cobros acreditados; no utilizar la columna R del libro histórico. |

### Controles requeridos

- Un PDF generado no acredita cierre comercial, firma, reserva o cobro. El alta en fechas cerradas exige las condiciones de cierre aprobadas y verificadas; mientras falten, se conserva como pendiente fuera del libro real.
- Identidad estable: evento, número original, clave y revisión aceptada, versión contractual, referencia privada del PDF, huella y referencia de archivo/hoja/fila. El número por sí solo no identifica una revisión.
- Conciliar primero las filas existentes; conservar referencias con ceros iniciales o sufijos. No normalizar números silenciosamente ni crear otra fila ante una coincidencia ambigua.
- Resolver la fila libre del bloque mensual correcto sin sobrescribir fórmulas, separadores, hipervínculos ni registros. No usar appendRow al final ni ordenar toda la hoja.
- Registrar operaciones repetibles con control de versión y conflictos. Un reintento no duplica filas ni cobros; un fallo no debe dejar escrituras parciales.
- Las pruebas ficticias se realizan en copias aisladas. No se insertan datos de ensayo en este libro real ni en balances.
- No convertir, sustituir ni cambiar permisos del XLSX original. Antes de escribir hay que implementar y verificar compatibilidad con ese formato o acordar una alternativa que conserve el registro existente.

### Estado verificable

Completado: localización y auditoría estructural de la fuente 2027; correspondencia de columnas documentada. Pendiente: conciliación semántica de fórmulas y registros, adaptador de escritura XLSX, pruebas en copia aislada y conexión de extremo a extremo WhatsApp → web → cuentas. No se ha implementado ni activado la escritura automática del libro. La sincronización general sigue apagada; esta actualización no despliega código funcional.


## Preparador de conciliación implementado · 6 noviembre 2026

Código: [tools/accounts_2027.py](../tools/accounts_2027.py). Pruebas: [tests/test_accounts_2027.py](../tests/test_accounts_2027.py). Es una herramienta local de solo lectura, sin red, credenciales, servicio HTTP ni operación de escritura. No está conectada todavía a la recepción WhatsApp o al panel.

Permite inspeccionar la estructura del XLSX y preparar una propuesta ficticia para una fila candidata. Comprueba la huella del libro, cabeceras, mes del evento, número textual, clave, revisión, importe entero en céntimos y correspondencia del contrato con el presupuesto y evento exactos. Rechaza referencias existentes o posibles equivalencias por ceros iniciales, filas ocupadas en cualquier columna, fórmulas con resultado vacío, enlaces, combinaciones, filas ocultas y objetos cuyo alcance no está auditado. Una relación de dibujo vacía no cuenta como objeto con contenido.

Solo propone C:H; no rellena cobros, IVA, fecha de reserva, gastos, comisiones o totales. Conserva importe en céntimos sin transformarlo en importe de celda Excel todavía. La propuesta incluye identidad y huellas, es determinista y siempre devuelve writable=false y pending_review. No es un recibo de escritura ni prueba de firma o cierre. Faltan el registro privado de operaciones, validación de servidor y escritura transaccional; un JSON aportado al comando no sustituye estas comprobaciones.

### Ejecución reproducible

Inspección estructural, sin mostrar filas privadas, importes, URLs ni fórmulas completas:

```sh
python3 tools/accounts_2027.py /ruta/privada/cuentas-2027.xlsx
python3 -m unittest discover -s tests -p 'test_accounts_2027.py' -v
```

La opción --request /ruta/privada/solicitud-ficticia.json permite simular una propuesta. El JSON debe incluir test_mode=true, workbook_sha256, currency=EUR, candidate_row, event (is_test=true, id, date ISO, schedule, place, client), quotation (number y key textuales, revision entera positiva, sha256 y total_cents entero), contract (los mismos identificadores/importes; su propia sha256; quotation_sha256, event_id y event_date coincidentes). Las huellas son hexadecimales SHA-256. No guardar entradas ni salidas privadas en el repositorio público. No existe opción apply.

### Evidencias y límites

- Trece pruebas locales con fixtures sintéticas superadas: versiones, fuente/documento/evento, año, céntimos, ceros iniciales, conflictos, mes, filas protegidas y lectura sin modificación.
- La misma batería pasó en GitHub Actions: https://github.com/flamencoevents/Flamenco-Events-app/actions/runs/42206658541 . Se repite cuando cambia la herramienta, su prueba o el workflow, sin usar cuentas de Google, Supabase o WhatsApp.
- Lectura local del original descargado y propuesta ficticia sobre una fila candidata: pending_review, writable=false. Comparación SHA-256 antes/después idéntica. No se creó una fila en el libro.
- La estructura actual no contiene marcador ENERO. El último bloque tampoco tiene un límite seguro inferible; se rechazan esos casos en lugar de añadir filas o afectar sumatorios.
- Hay fórmulas fuera de A:Q, hasta V. El control de ocupación examina toda la fila; no presume que esas columnas están vacías.
- Pendientes técnicos: conciliación de significados y fórmulas, revisión de estilos/separadores de cada fila, compatibilidad de escritura XLSX que conserve el archivo, ensayo de escritura en copia aislada, enlaces privados, registro de operaciones y conexión autenticada de extremo a extremo. No hay sincronización contable automática ni despliegue nuevo de Apps Script/Supabase en esta continuación.


## Ensayo de escritura y verificación independiente · 6 noviembre 2026

Nacho solicita encadenar tareas sin esperar confirmaciones rutinarias. Se continúa dentro del alcance autorizado: lecturas, código reversible, pruebas aisladas y documentación, conservando los bloqueos comerciales y de acceso personal imprescindibles. Esta indicación no activa sincronización general, uso real ni trabajos programados nuevos.

### Resultado del ensayo XLSX

Preparado [tools/accounts_2027_roundtrip.mjs](../tools/accounts_2027_roundtrip.mjs). Revalida la solicitud ficticia mediante el preparador Python, relee los bytes y su huella, exige un directorio nuevo y solo intenta escribir una copia local con C:H. No tiene red, credenciales ni operación para reemplazar el original. Una exportación, si se consigue, queda marcada como candidata no verificada.

El importador de hojas disponible no pudo completar la apertura del XLSX original descargado. Emitió avisos de sheetId ausente y terminó con «Sheet ... not found». No se confirma la causa interna; no se han cambiado los nombres originales para sortearlo. No se produjo una copia exportada válida, ni renderizado comprobable ni prueba de conservación tras escritura. El SHA-256 del original descargado se mantuvo idéntico.

La escritura sigue bloqueada por compatibilidad del importador; no por falta de autorización de Nacho. Se conserva el ensayo reproducible para poder verificar una solución sin convertir ni alterar el libro real.

### Verificador preparado sin depender del importador

[tools/accounts_2027_verify.py](../tools/accounts_2027_verify.py) inspecciona el contenido de una copia XLSX independientemente del escritor. Comprueba las seis celdas esperadas con fecha e importe tipados y referencia textual, y rechaza cambios en otros datos/fórmulas, estructura de hojas, estilos o partes protegidas del archivo. Conserva los valores privados fuera del informe. Es deliberadamente estricto: una reserialización no explicada puede bloquear una copia aunque parezca visualmente equivalente.

El verificador no acepta fórmulas sustituidas por valores ni céntimos o fechas distintos. Incluso si pasan sus comprobaciones, production_writable permanece false: siguen pendientes revisión visual, cálculo en Excel, autorización en servidor y registro atómico de operaciones. No comprueba por sí mismo firma, cierre comercial, cobro o permisos de usuario.

```sh
python3 -m unittest discover -s tests -p 'test_accounts_2027*.py' -v
python3 tools/accounts_2027_verify.py /ruta/privada/original.xlsx /ruta/privada/candidata.xlsx /ruta/privada/solicitud-ficticia.json
```

Para reproducir el ensayo MJS se requiere el runtime con @oai/artifact-tool. Ejecutar una copia del MJS desde un directorio temporal con node_modules enlazado al runtime; FE_ACCOUNTS_PLANNER debe apuntar al preparador Python guardado y FE_ACCOUNTS_PYTHON permite seleccionar su intérprete. Argumentos: XLSX de entrada, JSON ficticio, directorio de salida nuevo. Los archivos privados de entrada, salida y renderizado no se suben al repositorio.

### Evidencias nuevas y siguiente dependencia

- Veintiuna pruebas sintéticas locales superadas: trece del preparador y ocho de conservación. La sintaxis MJS también pasó.
- Automatización ampliada: https://github.com/flamencoevents/Flamenco-Events-app/actions/runs/42207740208 . Resultado success, sin dependencias de Google, Supabase, WhatsApp o datos privados.
- Comprobación adicional sobre una copia local idéntica al origen: rechazo esperado por faltar los seis datos ficticios propuestos, sin cambios ajenos detectados. No se confunde ese rechazo esperado con escritura satisfactoria.
- No se ha desplegado un escritor ni conectado cuentas a producción. Próxima dependencia técnica: resolver importación conservadora del XLSX y superar escritura, comparación y revisión visual en copia. La conexión de servidor y su registro de operaciones continúan pendientes. No se pide activar el libro real para superar la prueba.


## Continuación: registro local de operaciones · 6 noviembre 2026

Preparado `tools/accounts_2027_ledger.py` y 12 pruebas nuevas, todas superadas
localmente. Evita duplicados y conflictos y serializa ensayos del mismo libro;
completa una operación solo después de auditar la copia. No autentica usuarios,
no escribe XLSX ni llama a servicios. No está conectado al circuito remoto.
Evidencia, reproducción y límites: [circuito-whatsapp-cuentas.md](circuito-whatsapp-cuentas.md#registro-local-de-operaciones--6-noviembre-2026).
Modo prueba, libro real intacto y sincronización general apagada. No hay nuevo
despliegue Apps Script/Supabase ni cambio funcional en el panel.


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
