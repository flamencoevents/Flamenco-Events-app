# Integración WhatsApp → web de gestión

Objetivo de Nacho: todos los datos del circuito de presupuestos y contratos iniciado en WhatsApp deben quedar vinculados a su lugar correspondiente en la web. Modo prueba; esta continuación no activa la sincronización general ni crea clientes automáticamente.

## Destino de cada dato

| Dato de origen | Destino previsto | Estado comprobado |
| --- | --- | --- |
| Número, clave, revisión y estado de presupuesto | Bandeja interna Origen WhatsApp | Nueva consulta paginada preparada; revisar despliegue al final. |
| Cliente, fecha, lugar e importe guardado | Resumen interno de origen | Se muestran como metadatos de origen, no como evento ya contratado. En prueba solo registros ficticios. |
| Revisión comercialmente aceptada e impuestos | Condiciones aceptadas vinculadas al evento | Circuito existente de lectura firmada, revisión y autorización explícita; no se recalcula. |
| Estado del contrato de esa clave/revisión | Bandeja de origen y seguimiento contractual | Nueva consulta exacta; múltiples contratos se señalan, no se elige uno automáticamente. |
| PDF de presupuesto/contrato | Documentos privados del evento | Circuito existente de incorporación administrativa exacta. La bandeja solo informa disponibilidad; no entrega URLs Drive ni bytes. |
| Firma y reserva formal | Estado comprobado del contrato/evento | No se deducen de GENERADO ni de publicación. Proveedor/condiciones pendientes. |
| Componentes completos del cálculo, gastos previstos y documentos auxiliares | Ficha económica y trazabilidad privada | Pendiente de ampliar el enlace estructurado; el catálogo no equivale a importar toda la instantánea. |
| Cobros y gastos reales, histórico, balances | Seguimiento económico conciliado | Pendiente. No se convierten previsiones en hechos contables. |
| Mensajes del grupo WhatsApp | Fuente de interpretación y seguimiento permitido | No se copian indiscriminadamente conversaciones, credenciales o datos ajenos a cada expediente. |

## Bandeja Origen WhatsApp

Disponible para administración y comercial dentro de Presupuestos y eventos, a petición del usuario. Permite consultar FE_Cola o la fuente técnica aislada, paginar bloques de 20 filas y seleccionar una referencia generada. La selección rellena número, clave, revisión y fuente; limpia la solicitud seleccionada y exige elegir su solicitud aceptada. No aprueba ni importa por pulsar Usar referencia.

Los registros aún no aceptados pueden consultarse internamente. La importación sigue exigiendo llamada, autorización, envío registrado y aceptación de la solicitud. No se crea una cuenta o evento por existir una fila WhatsApp.

Se comprueba si una revisión ya está incorporada comparando número, revisión y referencia de origen exacta. Un presupuesto de otra revisión o fuente no aparece como ya integrado.

## Protección y alcance

- Endpoint Apps Script privado por HMAC; petición/respuesta firmadas, identificador de operación y límite de lecturas existentes.
- Edge valida Auth real y perfil admin/sales antes de leer origen. Cliente y público no pueden consultar el catálogo.
- Modo prueba coincidente entre servicios; solo instantáneas modoPrueba=true. Referencias y revisiones inconsistentes se omiten y la futura importación mantiene sus controles exactos.
- Lista cerrada de campos. Sin instantánea completa, documento de identidad, cuenta bancaria, PDF, secretos o enlaces Drive en el catálogo.
- Sin escrituras de negocio, correos, nuevos accesos, documentos ni transiciones por consultar. Se mantiene el contador técnico de cuota existente.
- Duplicados de clave en una página rechazan la respuesta. Contratos múltiples se señalan sin elegir el último.
- Resultados tardíos no se dibujan tras cambiar cuenta o invalidar el montaje del panel.
- Listado orientativo del origen, no una instantánea transaccional de toda la hoja durante varias páginas. La revisión autorizable siempre se vuelve a leer y comprobar.
- Hasta 5.000 filas de contrato por lectura; si se excede, la consulta se bloquea para ampliar paginación. No se informa falsamente que no hay contrato.

## Verificación de esta continuación

52 pruebas Node de app superadas y 23 del puente Apps Script, más las baterías de solicitudes, historial, PDF, formularios y contratos. Nuevos casos con dobles: catálogo sin escrituras, separación de roles, firma alterada, modos incompatibles, páginas y claves alteradas, filtros ficticios, revisión exacta de contrato, protección de URLs/datos privados, escape HTML, etiquetas ES/EN y descarte tras cambiar de cuenta. No son una nueva prueba Auth/HTTP real de extremo a extremo.

## Dominio y acceso cliente

El nombre vigente es gestion.flamencoevents.net. Nacho realizará manualmente su activación cuando la web esté terminada; no se solicita acceso IONOS ni se modifican DNS, CNAME, certificado o callbacks. Se desarrolla en la URL GitHub existente. El enlace Espacio cliente se publicará después, según la condición aprobada.

## Publicación verificada del inventario WhatsApp

- Apps Script **v53** publicado (commit b597c314c2f60bf6d2c9042b5f0597cb51c0beae, workflow 42123431351). Subida y actualización de implementación comprobadas por logs @53; credenciales del ejecutor retiradas.
- quote-bridge **v3 ACTIVE** en Supabase; se comprobó el bundle desplegado con catálogo y validación staff anteriores conservados.
- Web publicada desde commit 7aa9e2853da2ca6087d79fbf997dd4acbda9a4ec, con funcionalidad incorporada en 60fa8a81fa899e29af3c0a503f89f032076b27f1. GitHub Pages 42123653296: build y deploy success. La bandeja está dentro de Presupuestos y eventos, tanto en administración como comercial.
- 52 pruebas Node app y 23 puente con dobles; cinco baterías Apps Script y sintaxis correctas. No se ha realizado una nueva consulta del catálogo por HTTP con sesión Auth real ni revisión visual autenticada; el despliegue no sustituye esa prueba.
- Drive conserva las carpetas y originales del circuito WhatsApp. La bandeja informa referencia PDF guardada, no disponibilidad comprobada. La revisión/importación privada existente comprueba el PDF exacto antes de incorporarlo; no se mueve ni regenera el original ni se expone su enlace.
- Pendiente: integración estructurada completa de datos operativos/económicos, conciliación del histórico, balances, circuito contractual desde plantillas y firma. No se ha declarado terminada toda la integración. Modo prueba y sincronización general apagada; sin nuevos usuarios, correos, WhatsApp, documentos, cambios DNS o costes contratados.

## Detalle operativo y económico del origen WhatsApp

Revisión: 6 noviembre 2026. MODO PRUEBA.

### Entrega de esta continuación

Consulta protegida source_detail de un presupuesto generado con número, clave, revisión y fuente exactos. Se abre desde Origen WhatsApp → Consultar detalle guardado en administración y comercial. Es una consulta del origen actual, no una incorporación contable ni una certificación de cobros/gastos reales.

- Textos aprobados de servicios y descripciones, fecha, lugar y cliente ficticio en prueba.
- Tipo de cliente y modalidad fiscal; total, reserva y saldo guardados al presupuestar.
- Base, base facturada, IVA, retención IRPF y conciliación fiscal guardadas.
- SHA-256 del JSON exacto de origen para identificar su contenido.
- Para administración: líneas internas, costes previstos, asignaciones de venta/administración/anuales, logística prevista y parámetros congelados disponibles.
- Los datos ausentes permanecen ausentes; se conservan cero y ajustes negativos. No se recalcula un presupuesto, suma de costes, margen o balance.
- Se copian solo campos permitidos. No se transfieren el JSON completo, DNI/datos contractuales, tarifas completas, mensajes de WhatsApp, secretos, URLs Drive o PDFs.

### Permisos y efectos

La función Edge comprueba sesión y perfil en servidor. Cliente y público no acceden a source_detail. Comercial recibe servicios e importes fiscales; los costes internos se reservan a administración en la respuesta del servidor, aunque el navegador solicite include_costs=true. Apps Script recibe ese permiso dentro de la petición HMAC, nunca directamente de la entrada del navegador.

Es solo lectura: no crea solicitudes, condiciones aceptadas, eventos, documentos, clientes, cobros ni gastos, ni cambia estados. La consulta previa a una aceptación no evita la llamada ni la revisión comercial exigidas para importar. No se activa sincronización general ni se altera la organización Drive.

Los resultados tardíos se descartan tras cambiar de cuenta, invalidar el montaje o pasar a otra página del inventario. Se conserva la validación HMAC y el reintento de lectura limitado existente.

### Significado de las cifras

El campo histórico calculo.real se presenta como **Neto previsto según cálculo**, no como efectivo recibido o beneficio realizado. Los importes calculo.venta/admin/anuales se presentan como asignaciones previstas de línea, no como movimientos reales.

Los subtotales de logística y sus componentes están en distintos niveles. No se suman entre sí para crear un gasto global nuevo. Los balances siguen pendientes de conciliación con los libros de cuentas, registro de cobros/pagos reales y definiciones del negocio.

La huella identifica el origen consultado ahora. No acredita por sí sola que todo ese desglose se incorporó o aceptó con anterioridad. Falta persistir una versión estructurada aprobada por evento y comparar sus cambios en futuras revisiones; no se reconstruye retroactivamente una aceptación económica.

### Validación

56 tests Node de la web y 25 del puente Apps Script superados con dobles. Pasan también sintaxis y las baterías de solicitudes, historial, PDF, formulario y contratos.

Nuevos casos: hash del JSON exacto, inmutabilidad, importe fiscal/retención/reserva, coste/logística guardados, cero y ausencia, descuento negativo, duplicados, revisión errónea, borrador, modo incorrecto, escalada de costes desde comercial, anonimato/cliente denegados, campos extra privados eliminados, escape de textos y respuesta tardía de otra página.

No es una nueva prueba HTTP real con sesiones Auth ni una revisión visual autenticada. La publicación se registrará al verificar las versiones resultantes. No se generaron documentos ni se escribieron registros económicos reales.

### Próximos pasos

1. Incorporación persistente y versionada del detalle aprobado a la ficha económica del evento, con permisos y auditoría.
2. Enlace conciliado con el histórico y distinción de movimientos previstos/realizados.
3. Balances verificados contra las fuentes, sin contar dos veces reservas, saldos, subtotales o revisiones.
4. Prueba Auth real y revisión de interfaz con los roles autorizados.

El subdominio gestion.flamencoevents.net se activará manualmente por Nacho al finalizar la web. No se cambian DNS, CNAME, callbacks ni el sitio público de IONOS.

### Publicación del detalle · 6 noviembre 2026

- Apps Script **v54** publicado, commit 2d80f0b87349934cdc8b00843362ff703b3deff6, workflow 42129074849; logs confirman @54 y retirada de credenciales del ejecutor.
- quote-bridge **v4 ACTIVE** en Supabase. Se conserva autenticación propia, permisos y CORS anteriores. El detalle se valida desde el módulo compartido existente source-catalog.ts; no se requiere otro endpoint privilegiado.
- Interfaz guardada en commit e52350a0865b555fb0f94bfc6c152f0a388cff1a, publicación Pages pendiente de comprobar al cerrar.
- Las operaciones create/update-ref de GitHub fallaron; se comprobó el estado antes de continuar y se guardaron los archivos existentes mediante Contents API. No se forzó ni sobrescribió trabajo ajeno. El documento del detalle queda aquí, sin depender de un archivo nuevo que no pudo crearse.
