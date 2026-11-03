# Estado de desarrollo: panel comercial y seguridad — 2026-11-03

## Cambios aplicados
- `staff.html` es una interfaz estática de equipo con autenticación por email, comprobación del rol `sales/admin`, métricas, listas de solicitudes/eventos y lectura y envío de mensajes.
- `004_team_coordination_notifications.sql` habilita coordinación del equipo en eventos y tareas y crea `notifications` con RLS.
- `005_protect_commercial_and_notification_fields.sql` añade triggers de protección: ventas no puede modificar titular, estado contractual, enlaces contractuales ni campos comerciales protegidos; los avisos solo pueden cambiar el estado de lectura.
- Supabase registra siete migraciones y seis tablas con RLS.
- Se comprobaron por consulta las nuevas políticas. Las pruebas multiusuario y navegación end-to-end **no se han ejecutado**.
- Los cambios de frontend están en una rama; `main` sigue sin modificar.
- Repositorio separado de Apps Script **sin modificaciones**.

## Avisos de seguridad que permanecen
- `public.is_admin()` y `public.is_staff()` con `SECURITY DEFINER` aparecen en el asesor de seguridad.
- Protección de contraseñas filtradas está deshabilitada.
- No hay pruebas con dos cuentas cliente y un perfil sales. No habilitar clientes reales.
- No se ha comprobado entrega de correos mágicos ni la ruta de redirección hacia `staff.html`.
- La interfaz comercial no permite todavía gestionar completamente contratos, subida de documentos, asignación de roles ni eventos.
- Registrar una llamada desde el panel debe corresponder a una llamada efectivamente realizada; en este prototipo no hay prueba independiente del contacto telefónico.
- Las solicitudes comerciales existentes tienen solo una fecha de aprobación; faltan actor, historial y auditoría de transiciones antes de automatizar envíos.
- No se ha vinculado ninguna aplicación externa a estos flujos; no se han contratado servicios.

## Próximas pruebas
1. Prueba de sesión de admin y sales, incluida denegación a client.
2. Aislamiento de lectura entre clientes A y B para eventos, mensajes, documentos y notificaciones.
3. Intentos de modificación de `client_id`, `status` y `contract_url` por sales deben fallar.
4. Sales puede editar `repertoire`, `wardrobe`, `schedule_notes`, `onsite_contact` de un evento de prueba.
5. Auditoría del proceso comercial de aprobación real.
6. Pruebas en Safari iOS y Chrome Android.

## Estado
**Backend aplicado y estructuras verificadas; panel programado pero sin despliegue ni prueba de usuario. No listo para producción.**
