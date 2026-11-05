# Integración del dominio de gestión

Solicitud: 5 noviembre 2026. Host solicitado literalmente por Nacho: `gesion.flamencoevents.net` (sin t). No se ha sustituido por `gestion` ni configurado un segundo host.

## Preparado en código

- admin.html es la entrada de gestión, con navegación a solicitudes/coordinación, presupuestos/eventos, contratos, publicación privada, cobros, usuarios e integración económica.
- Los perfiles sales y client se redirigen a staff.html y portal.html respectivamente, después de comprobar sesión y perfil. Un perfil desconocido o un error no concede acceso.
- La raíz HTTPS del host solicitado apunta a admin.html. En otros hosts, incluido el GitHub Pages actual y la web pública, no se aplica esta redirección.
- El formulario público ficticio sigue disponible con index.html?view=public.
- Los balances históricos siguen pendientes de conciliación; la navegación nueva no implica integración económica terminada.
- 47 pruebas Node con dobles superadas, incluidas entrada por rol, respuestas tardías, host exacto y enlaces de navegación. No sustituyen prueba Auth real del dominio.

## Activación pendiente

No se ha añadido CNAME al repositorio ni guardado un dominio personalizado en GitHub Pages: el cambio podría redirigir los accesos existentes antes de disponer de DNS/HTTPS. La inspección de Pages confirmó main/root como origen y la URL GitHub actual como activa. La sesión GitHub permite ver esa configuración. IONOS presenta login y no se ha verificado quién administra actualmente los DNS.

Configuración DNS requerida si se conserva GitHub Pages:

| Tipo | Nombre relativo | Destino |
| --- | --- | --- |
| CNAME | gesion | flamencoevents.github.io |

No se incluye /Flamenco-Events-app ni /admin.html en el destino DNS. Antes de crear el registro, asociar/verificar el host en GitHub Pages según su procedimiento; completar el DNS en la misma operación de activación. Mantener correo y web pública con sus registros actuales.

Después: esperar validación de DNS y certificado, exigir HTTPS, añadir a la lista de redirecciones de Supabase la URL exacta https://gesion.flamencoevents.net/portal.html, conservar el acceso GitHub mientras se verifica, y ajustar la configuración cliente de callback para el host autorizado. Ninguno de estos cambios de Auth está hecho todavía; portal-config.js sigue usando el callback GitHub existente.

Comprobar al terminar: raíz→acceso gestión; Nacho→administración; Azahara→comercial; cliente→solo sus eventos; ausencia de permisos cruzados; descarga privada; modo prueba; web pública y correo conservados. Las sesiones de distintos orígenes no se dan por compartidas.

Fuentes oficiales:
- https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site
- https://supabase.com/docs/guides/auth/redirect-urls

## Espacio cliente en la web pública

Nacho indica que, cuando esté listo, aparecerá un enlace **Espacio cliente** en el menú de www.flamencoevents.net. Debe dirigir al portal privado del dominio activado, no al panel administrativo. Cada cliente accede únicamente a sus eventos contratados y documentos autorizados.

No se ha añadido ese enlace en IONOS ni se activan clientes reales. Condiciones previas: portal verificado, aislamiento y acceso comprobados, documentos privados, requisitos contractuales resueltos y autorización de Nacho para finalizar modo prueba. No se interpreta este requisito futuro como permiso para publicar documentos privados ni activar comunicaciones.
