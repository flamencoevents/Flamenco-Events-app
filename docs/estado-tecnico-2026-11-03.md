# Estado técnico verificado — 2026-11-03

## Comprobado contra Supabase
- Proyecto `vulbpjayunvlpftgfzyf`: activo, región eu-west-1.
- Cinco tablas de negocio con RLS: `profiles`, `events`, `event_messages`, `event_tasks`, `enquiries`.
- Migraciones presentes: esquema inicial, aprobación comercial obligatoria, revocación de helper anónimo, separación admin/sales/client y almacenamiento documental privado.
- `event-documents`: bucket no público, PDFs de hasta 10 MiB, objeto bajo prefijo `<event-id>/`.
- Lectura documental: propietario del evento o equipo. Subida y sustitución: solo admin; no se ha habilitado DELETE para la API de usuario.
- Los datos de negocio estaban vacíos al inspeccionarlos. No se han creado cuentas ni datos reales de prueba.

## Restricciones y advertencias abiertas
1. El asesor de seguridad marca `public.is_admin()` y `public.is_staff()` como funciones SECURITY DEFINER ejecutables por usuarios autenticados. Se utilizan en RLS; revisar estrategia de esquema privado antes de retirarlas, para no romper el acceso.
2. Protección frente a contraseñas filtradas deshabilitada en Supabase Auth: revisar ajustes de Auth.
3. Aún no se han probado dos sesiones de usuario para verificar que cliente A no consulta documentos/eventos de cliente B. **No activar clientes reales**.
4. No existe todavía panel comercial para Azahara ni un flujo seguro de alta/aprobación/invitación. No asignar roles a usuarios sin verificar su identidad.
5. La configuración publicada de `portal-config.js` usa una clave *publishable*, apta para navegador, y no debe sustituirse por una secret/service role.
6. La documentación README del repositorio principal contiene estado desactualizado. Reconciliarla al incorporar la interfaz.
7. `quotation_url` y `contract_url` siguen en la tabla `events`; no dar por seguros enlaces externos arbitrarios. Preferir rutas privadas y URLs firmadas de corta duración.
8. El sistema Apps Script debe mantenerse aislado y sin mutaciones hasta tener pruebas de compatibilidad.

## Pruebas de aceptación pendientes
- Entrar con admin, sales y dos clientes de prueba; verificar RLS en tablas y Storage.
- Cliente A: leer únicamente evento A y documentos A; no puede editar roles ni crear eventos.
- Cliente B: intentos de lectura/escritura de evento A denegados.
- Sales: listar solicitudes y eventos, no administrar perfiles ni subir contratos.
- Admin: subir un PDF ficticio a su evento y generar acceso controlado.
- Enquiries: impedir `sent` sin fecha de llamada, autorización y fecha de envío.
- Verificar flujo completo de enlace mágico, recuperación de acceso y expiración de sesión.
- Probar Safari/iPhone, Chrome/Android, idiomas y fallos de red.
- Validar RGPD, política de conservación y procedimiento de borrado antes de producción.

## Criterio de estado
La migración documental está **aplicada** en base de datos y las políticas fueron verificadas en el catálogo PostgreSQL. **No está probada extremo a extremo ni operativa para clientes reales**.
