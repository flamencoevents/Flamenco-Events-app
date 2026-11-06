# Listado compartido de eventos desde Cuentas 2027

## Presentación clara · 6 noviembre 2026

Petición de Nacho: fondo blanco, letras negras, logo de la web pública y
columnas bien espaciadas. Se aplica management-theme.css a administración,
comercial y balances, conservando estructura, datos y permisos. El logo PNG se
recuperó de la web oficial y se guarda sin modificar como recurso del proyecto;
no depende del enlace temporal firmado de IONOS.

La tabla tiene anchuras mínimas, encabezados y fechas sin cortes, celdas con
espacio suficiente y enlaces agrupados en la columna Presupuesto. En pantallas
estrechas se desplaza horizontalmente para conservar legibilidad. El panel usa
el ancho disponible hasta 1440px. La fecha de lectura y la limitación de
actualización de Drive quedan en líneas separadas.

Verificación visual en navegador con datos ficticios: fondo blanco, logo,
encabezados completos, fechas en una línea y documentos separados. Las 66
pruebas web existentes pasan tras el cambio. No equivale a revisión con sesión
real de ambos perfiles ni a prueba en iPhone real.

Petición de Nacho del 6 noviembre 2026: listado al entrar en administración y
comercial, con Fecha, Horario, Lugar, Wedding/Cliente y Presupuesto. Los enlaces
a presupuesto, contrato y ficha económica se muestran dentro de Presupuesto;
el acceso al libro anual está encima del listado. No hay una sexta columna.

## Flujo objetivo confirmado por Nacho

1. Formulario WhatsApp de solicitud de presupuesto → presupuesto generado →
   archivo en su carpeta de Drive.
2. Formulario WhatsApp de contrato vinculado al presupuesto aceptado → contrato
   generado → archivo en su carpeta de Drive.
3. Datos de ambos documentos → CUENTAS 27 FLAMENCO EVENTS, respetando sus campos,
   importes y revisiones. El presupuesto solo no equivale a fecha cerrada,
   contrato firmado o reserva cobrada.
4. Cuentas 2027 → tabla privada de cinco columnas de la web. El libro es la
   fuente, no una tabla paralela de eventos inventados desde la web. Enlaces
   separados a ambos documentos y al libro anual.

La sincronización de los pasos 1–3 continúa pendiente: el escritor XLSX de copia
verificada no está conectado a una operación remota autorizada y transaccional.
Esta entrega implementa una lectura inicial del paso 4. No se presenta como
flujo completo operativo.

## Implementado

- `accounts-events.js` y CSS compartidos al principio de admin.html y staff.html.
  Las páginas conservan sus funciones y permisos previos. El comercial sigue
  entrando por staff.html, no obtiene funciones administrativas.
- Proyección privada de ocho filas fechadas de 2027, leídas del XLSX confirmado
  en la cuenta corporativa. El original no cambia. No se añaden estas filas a
  events, accepted_quote_terms, pagos, contratos operativos ni balances.
- Filtro por año, buscador de cliente/lugar/referencia, documentos separados,
  ficha con los campos originales A:Q y acceso al libro anual.
- Importación inicial con SHA-256 y fecha del origen. La vista indica la fecha
  de incorporación y que no existe sincronización automática de Drive. El botón
  Actualizar listado relee la proyección disponible, no el archivo corporativo.
- Enlaces a tres PDF de presupuesto localizados en Drive y tres contratos
  históricos localizados en Canva. Los contratos se contrastaron por referencia,
  fecha, lugar e importe; no son PDF Drive ni prueba de firma. No se exportaron,
  publicaron ni compartieron archivos adicionales. Los enlaces pendientes se
  muestran como pendientes y no se inventan para filas sin referencia.
- Un PDF de presupuesto histórico tiene fecha distinta al libro y su contrato;
  se señala para revisar versión. Otro PDF contiene varias opciones. No se
  sustituyen importes o fechas del libro ni se declaran aceptadas esas versiones.
- Las cuatro referencias antiguas de Canva del propio libro se conservan como
  «Documento del libro», sin reclasificarlas por inferencia.

## Permisos y privacidad

La petición explícita de Nacho permite a ambos perfiles ver la ficha económica
completa y acceder al libro anual desde esta consulta. Es una lectura interna
del histórico. No modifica los permisos de costes previstos de presupuestos ni
los privilegios de administración, firma, pagos o gestión de usuarios.

`supabase/accounts-catalog.sql` crea accounts_year_catalog y
accounts_event_catalog. RLS permite SELECT solo a perfiles admin/sales mediante
la función is_staff existente. No se concede INSERT/UPDATE/DELETE al navegador.
Anon carece de privilegios y el cliente no ve filas ni enlaces. La proyección
contiene datos privados solo en base de datos: ningún registro, cifra personal,
identificador de archivo corporativo o enlace privado se incluye en GitHub.

Los enlaces externos usan los permisos existentes de Drive/Canva; no se cambian
comparticiones. No se verifica aquí que Azahara tenga acceso externo a cada
archivo. Cerrar sesión invalida y borra el listado, y una respuesta tardía no se
incorpora tras cambiar de usuario.

El modo prueba continúa para los procesos operativos. El aviso de los paneles
se precisa como «Consulta interna · Sin reservas ni envíos reales» para no
presentar registros del libro como datos ficticios. No hay clientes activados,
comunicaciones, cobros ni escritura automática del libro.

## Evidencias y límites

- 66 pruebas Node superadas localmente (56 anteriores, seis del listado y
  cuatro del acceso a balances).
- 40 pruebas Python de cuentas siguen pasando.
- `supabase/tests/accounts-catalog-rollback.sql` ejecutado con éxito en la base:
  lectura con roles SQL simulados admin/sales; ningún acceso no-staff; escritura
  autenticada y lectura anónima rechazadas. Finaliza ROLLBACK, sin crear usuarios.
- RLS y grants activos en las dos tablas; asesores sin advertencias nuevas de
  seguridad. Persisten las advertencias anteriores, ajenas a esta entrega.
- Ocho filas incorporadas, tres enlaces a presupuesto y tres a contrato.
  Falta sesión visual real de ambos perfiles y comprobación externa de enlaces.
- La proyección inicial es una instantánea. Falta actualizarla desde el libro
  automáticamente tras cada escritura exacta y comprobar el circuito completo.

La vista de cinco columnas, el buscador y la apertura de ficha se han comprobado
en navegador con datos ficticios. Esto no sustituye la comprobación visual con
sesiones reales de Nacho y Azahara ni la apertura externa de documentos.

## Balances económicos: página reservada a administración

Petición adicional de Nacho: crear «Balances económicos», organizada por años,
para configurar después. Se añade balances.html/balances.js y el enlace desde
administración. Incluye ejercicio 2027 y estado «Pendiente de configuración».
No consulta cuentas ni calcula totales. Comprueba sesión y perfil admin antes
de mostrar el espacio de configuración; comercial/cliente quedan denegados.
El panel comercial no incorpora el enlace. Al cambiar de sesión se oculta el
contenido. Las pruebas comprueban los tres roles y la ausencia de cifras
inventadas. La configuración de nuevos ejercicios y fórmulas queda pendiente.

`tools/accounts_2027_catalog.py` es un lector local sin red ni escrituras. Su
salida contiene datos privados y nunca se guarda en el repositorio público.
Reconoce encabezados repetidos, fechas Excel y referencias numéricas sin añadir
«.0»; conserva referencias textuales, incluidas las que tengan ceros iniciales.

## Publicación comprobada

Commit `1243c4ca6c39ead09e151b8e57597a28bf59d3a0` guardado en main.
Pruebas web, 66 casos: https://github.com/flamencoevents/Flamenco-Events-app/actions/runs/42218224772 (success).
Pruebas Python de cuentas: https://github.com/flamencoevents/Flamenco-Events-app/actions/runs/42218224712 (success).
GitHub Pages: https://github.com/flamencoevents/Flamenco-Events-app/actions/runs/42218223433 (success).
Consulta REST real sin sesión del catálogo: HTTP 401 / 42501, sin registros.
Estado final consultado: test_mode=true, ocho filas en catálogo y cero eventos confirmados.
No se crearon identidades de prueba ni se modificó el libro original.


## Adaptación móvil · 6 noviembre 2026

A 760 px o menos, el listado de cinco columnas se presenta como tarjetas por
evento: fecha, horario, lugar, cliente/wedding y presupuesto. Conserva el mismo
DOM, origen, filtro y manejador de documentos/ficha; no duplica registros ni
consultas. Encabezados y roles de tabla se conservan para accesibilidad.

Los paneles de administración, comercial y balances comparten márgenes móviles,
formularios de ancho completo, navegación en dos columnas, botones táctiles y
fichas económicas en una columna. Las hojas de estilo y el módulo del listado
llevan versión de recurso para actualizar la caché habitual.

Verificación: 66 pruebas Node superadas. Vista de 320 y 390 px inspeccionada en
navegador con datos ficticios y apertura de ficha a 320 px comprobada; vista de
768 px conserva tabla con desplazamiento horizontal. No se ha probado en un
iPhone físico ni con una sesión real. No cambia permisos, libro, datos ni modo
prueba. Balances continúa pendiente de configuración.
