# Prioridad vigente: web de gestión de Flamenco Events

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
