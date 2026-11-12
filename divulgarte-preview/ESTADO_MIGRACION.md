# Divulgarte Flamenco — estado de migración
Fecha de verificación: 12 de noviembre de 2026.

## Verificado
- 11 páginas públicas recuperadas y accesibles en entorno aislado `divulgarte-preview/`.
- Importación de 61 imágenes distintas desde el sitio público; cada imagen tiene archivo local permanente en `assets/`.
- Portada (23 imágenes locales), cursos (9) y galería (20 referencias locales) verificados en la URL de staging tras el despliegue.
- GitHub Pages: compilación y despliegue completados satisfactoriamente.
- Dominio y hosting de la web original: intactos.
- Web provisional marcada `noindex,nofollow`; sin pagos ni formularios activos.

## Pendiente para clonar completamente
- 10 recursos multimedia extra del proveedor original respondieron 403; revisar/exportar desde panel del propietario o copia local.
- No se ha exportado contenido privado (alumnos, lecciones, pedidos, cursos, credenciales); la web pública no permite recuperarlo.
- Formularios y newsletter necesitan backend independiente y revisión de protección de datos.
- Cursos de pago: elegir alojamiento y sistema comercial apropiados; GitHub Pages por sí solo no sustituye plataforma de ventas o LMS.
- Reproducción gráfica exacta del diseño original: aún no validada; la versión actual es una recreación estática con texto e imágenes originales.
- Generación de un repositorio GitHub independiente y gestión DNS: pendientes. La conexión disponible permite trabajar en el repositorio existente, pero no crear repositorios nuevos.
- El aviso legal del origen contiene campos de plantilla sin rellenar: revisión y corrección obligatorias antes del lanzamiento.
- La copia usa rutas `.html`; planificar redirecciones de las URLs anteriores al cambiar el dominio para proteger SEO.
- Validar enlaces internos y externos y accesibilidad en dispositivos antes del corte.

## Enlaces
- [Staging](https://flamencoevents.github.io/Flamenco-Events-app/divulgarte-preview/)
- [Repositorio de trabajo](https://github.com/flamencoevents/Flamenco-Events-app/tree/main/divulgarte-preview)
- [Web original](https://www.divulgarteflamenco.es/)

Este documento no afirma una migración completa de la operación educativa ni del comercio electrónico.
