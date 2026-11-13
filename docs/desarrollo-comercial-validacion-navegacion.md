# Validación de navegación e integración — Desarrollo Comercial

Estado: **rama de pruebas, pendiente de validación funcional.** No fusionar el PR #3 ni publicar CRM operativo hasta superar todas las comprobaciones.

## Integración realizada
- `departments-nav.js`: opción Desarrollo Comercial tras Comercial para perfiles `admin` y `sales`.
- `staff.html`: mismo enlace integrado en el menú propio de Comercial. Eliminado enlace provisional duplicado.
- `desarrollo-comercial.html`: añadido menú de departamentos con estilo responsivo y verificación de perfil mediante `departments-nav.js`.
- `departments-nav.css`: reutilizado sin cambios en la rama de pruebas.

## Criterios de aceptación
1. **Administración**: ve cinco departamentos y puede entrar a Desarrollo Comercial; se marca `aria-current=page`.
2. **Comercial / Azahara**: ve Comercial, Marketing, RR. HH. y Desarrollo Comercial; puede consultar oportunidades y hacer seguimiento pero no crear ni cualificar contactos de Marketing.
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
