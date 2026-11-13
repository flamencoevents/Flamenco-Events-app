# Validación de navegación e integración — Desarrollo Comercial

## Organización definitiva sin departamento duplicado

**Desarrollo Comercial deja de existir como departamento independiente.** Sus tareas y pantallas se distribuyen entre los departamentos existentes:
- **Marketing (responsable: Administración):** investigación, directorios nacionales, fuentes contrastadas, categorización, puntuación, fichas de candidatos, campañas sectoriales en borrador y cualificación. Acceso: `marketing.html` → Prospección → `desarrollo-comercial.html?tab=venues`.
- **Comercial (responsable: Azahara):** bandeja de oportunidades traspasadas, contacto personalizado, llamadas, reuniones, propuestas, negociación y acuerdos. Acceso: `staff.html` → Oportunidades → `desarrollo-comercial.html?tab=pipeline`.
- **Punto de traspaso único:** Marketing marca cualificado y crea oportunidad. Comercial gestiona el seguimiento. No duplicar fichas ni clasificar prospectos directamente desde Comercial.
- **Navegación:** sin botón independiente Desarrollo Comercial. El mismo componente técnico ofrece vistas según perfil, mientras las tablas RLS deben asegurar permisos al desplegar.
- **Sin campañas activas:** no se realizan comunicaciones automáticas. CRM operativo pendiente de migraciones y test de RLS.


Estado: **rama de pruebas, pendiente de validación funcional.** No fusionar el PR #3 ni publicar CRM operativo hasta superar todas las comprobaciones.

## Integración realizada
- `departments-nav.js`: opción Desarrollo Comercial tras Comercial para perfiles `admin` y `sales`.
- `staff.html`: mismo enlace integrado en el menú propio de Comercial. Eliminado enlace provisional duplicado.
- `desarrollo-comercial.html`: añadido menú de departamentos con estilo responsivo y verificación de perfil mediante `departments-nav.js`.
- `departments-nav.css`: reutilizado sin cambios en la rama de pruebas.

## Criterios de aceptación
1. **Administración**: ve los departamentos originales (sin sección independiente de Desarrollo Comercial) y puede entrar a Desarrollo Comercial; se marca `aria-current=page` sobre Marketing en la vista de prospección.
2. **Comercial / Azahara**: ve Comercial y RR. HH.; accede a oportunidades desde Comercial; puede consultar oportunidades y hacer seguimiento pero no crear ni cualificar contactos de Marketing.
3. **Cliente**: no ve los departamentos ni puede leer las tablas de prospectos ni oportunidades.
4. **Sin sesión**: no se muestra el menú; se solicita acceso.
5. **Móvil**: menú de dos columnas, sin desbordamiento, todas las opciones accesibles mediante toque.
6. **Datos**: los prospectos de Marketing no aparecen como oportunidades hasta ser cualificados y traspasados.
7. **Campañas**: no debe existir ninguna ruta que envíe correo o WhatsApp sin intervención explícita.
8. **Regresión**: no cambian ni se duplican eventos, presupuestos, documentos, avisos, RR. HH. o facturación.

## Limitaciones pendientes
- Las tablas CRM propuestas aún no están instaladas en Supabase, por lo que **no se puede certificar funcionamiento de lectura/escritura ni RLS**.
- Se requiere proyecto aislado de pruebas, cuentas de los tres roles y revisión de scripts SQL como conjunto.
- La demostración pública sólo enseña un directorio de investigación sin contactos personales ni sesión de clientes. No es el CRM operativo.
- No está autorizada la activación de campañas ni la importación masiva a la base real.
