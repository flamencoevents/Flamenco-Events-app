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
