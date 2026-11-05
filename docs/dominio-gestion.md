# Dominio de la web de gestión

Nombre vigente: gestion.flamencoevents.net, con t. Sustituye la escritura anterior gesion.

**Nacho realizará manualmente la activación cuando la web esté terminada y verificada.** Durante el desarrollo no se solicitará acceso IONOS, cambiará DNS, añadirá CNAME o activará el dominio en GitHub. La URL actual GitHub Pages sigue siendo la de pruebas.

## Código preparado

La raíz HTTPS del host previsto abre admin.html. Tras comprobar sesión y perfil, administración permanece en gestión, comercial abre staff.html y cliente portal.html. Un perfil desconocido o una lectura fallida no concede permisos. Los controles de servidor y RLS se conservan.

El formulario público ficticio conserva index.html?view=public. El resto de hosts, incluida la web pública IONOS, no recibe esta redirección.

## Instrucciones que se entregarán para la activación manual

1. Verificar titularidad del subdominio y asociarlo a GitHub Pages, conservando la web pública y el correo.
2. En el proveedor DNS autorizado, crear CNAME con nombre gestion y destino flamencoevents.github.io. No añadir rutas de repositorio ni páginas al valor DNS.
3. Esperar validación/certificado y exigir HTTPS.
4. Añadir https://gestion.flamencoevents.net/portal.html como redirección exacta autorizada en Supabase y ajustar el callback del cliente cuando corresponda. La configuración actual sigue usando GitHub.
5. Comprobar acceso de cada rol, documentos privados, permisos y modo de funcionamiento. No se da por compartida la sesión entre distintos orígenes.
6. Publicar «Espacio cliente» en www.flamencoevents.net solo después de las comprobaciones y autorización de uso real.

No se ha realizado ninguna de estas operaciones externas. La gestión económica histórica/balances y las funciones contractuales pendientes no se consideran terminadas por disponer de dominio o menú.

Fuentes:
- https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site
- https://supabase.com/docs/guides/auth/redirect-urls
