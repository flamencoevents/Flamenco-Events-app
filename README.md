# Flamenco Events App

Aplicación estática publicada mediante GitHub Pages con Supabase para autenticación, datos y documentos privados.

## Estado verificado · 3 noviembre 2026

- `portal.html`: entrada por enlace de correo para cuentas existentes; dirige administradores a `admin.html`, comerciales a `staff.html` y mantiene clientes en su portal.
- `admin.html`: solicitudes ficticias, usuarios, eventos aceptados, documentos, contratos y seguimiento de pagos. Las invitaciones a clientes y la confirmación formal están desactivadas durante las pruebas.
- `staff.html`: seguimiento comercial secuencial, revisión de datos de la solicitud, eventos, documentos, tareas, mensajes, propuestas y avisos internos.
- `index.html`: demostración con almacenamiento local. Su formulario NO registra solicitudes en Supabase.
- `servicios.html`: catálogo público.
- `portal-config.js`: exclusivamente URL, clave pública y redirección. No contiene credenciales privadas.

## Modo prueba

`public.app_runtime.test_mode = true` es el bloqueo del servidor. Las sesiones normales solo pueden leerlo. La función `invite-accepted-client` rechaza invitaciones mientras esté activo; la base de datos rechaza reservas confirmadas o completadas. No desactivarlo sin instrucción expresa del propietario. La invitación de equipo permanece disponible para una dirección previamente verificada por administración; no se ha enviado ninguna durante este trabajo.

La aceptación comercial y la reserva formal son estados distintos. El flujo obligatorio es nueva solicitud → llamada → autorización → envío registrado → aceptación comprobada. Registrar un envío NO envía un correo ni un presupuesto.

## Base de datos y funciones

`supabase/migrations/` conserva las 33 migraciones aplicadas, con sus versiones reales recuperadas de Supabase. Los dos scripts preparatorios anteriores están conservados en `supabase/legacy/`; `supabase/schema.sql` es una referencia histórica y NO representa por sí sola el esquema actual. No volver a ejecutar las migraciones ya aplicadas sobre la misma base.

`supabase/functions/` contiene las cuatro funciones desplegadas, recuperadas del proyecto. Solo `invite-accepted-client` se ha actualizado en esta revisión. Los secretos permanecen en el servidor y no están incluidos.

## Comprobaciones

- `node --test tests/portal.test.cjs tests/bridge-receiver.test.cjs`: navegación de los tres roles y sintaxis de scripts públicos.
- `supabase/tests/security-rollback.sql`: pruebas de permisos reales con clientes y comercial ficticios, dentro de una transacción que termina con ROLLBACK. Ejecutar únicamente en el entorno de pruebas identificado. Incluye el UUID del administrador actual para simular sus políticas; no proporciona credenciales ni acceso por sí mismo.
- Seguridad: revisar también `docs/estado-verificado.md`.

## Pendiente

Captación pública protegida contra abuso; conexión completa de Apps Script con la app; definición final de requisitos de reserva; identidad de correo de Azahara; comprobación visual con sesiones de los tres roles. No activar clientes reales hasta completar la validación.
