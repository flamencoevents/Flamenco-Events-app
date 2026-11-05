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
