# Flamenco Events App — estado técnico verificado (2026-11-03)

## Hecho y verificado
- Proyecto Supabase: activo en eu-west-1.
- 22 migraciones aplicadas (hasta `fix_anonymous_catalogue_policy`).
- 11 tablas de negocio con RLS, incluida tabla pública `services` con 15 servicios sin precios inventados.
- Roles `client`, `sales`, `admin` protegidos por funciones de autorización fuera del esquema de API.
- Restricción: un evento nuevo requiere solicitud comercial aceptada, con llamada, aprobación y envío registrados.
- `staff.html`: panel comercial, notificaciones, mensajes, tareas, solicitudes de modificación y documentos privados.
- `admin.html`: panel administrativo, creación de eventos aceptados, carga privada de PDF y borradores/publicación de contratos.
- `portal.html`: portal cliente, documentos temporales, propuestas y notificaciones.
- `servicios.html`: catálogo público bilingüe conectado a Supabase.
- `supabase/functions/invite-accepted-client/index.ts`: función preparada, protegida por rol y verificación de presupuesto aceptado; **no desplegada** y sin invitaciones enviadas.
- Automatización de GitHub: validación de páginas y comprobación TypeScript de Edge Function.
- Regresión SQL ejecutada y satisfactoria en `tests/rls-isolation.sql`, `tests/commercial-workflow.sql`, `tests/contract-visibility.sql` y `tests/public-catalogue.sql`. Todas las pruebas ficticias reversibles; no se ha persistido información de prueba.
- Catálogo anónimo permite únicamente SELECT de `services`; privados sin acceso anónimo.
- Dos advertencias por funciones SECURITY DEFINER públicas corregidas; queda una advertencia de protección de contraseñas filtradas.

## Estados correctos
- Backend: **desplegado**, RLS probado mediante roles simulados y transacciones reversibles.
- Frontend nuevo: **programado y validado estáticamente** en rama; **no desplegado**.
- Edge Function de invitaciones: **programada y verificada por CI**, **no desplegada**.
- Firma electrónica: **no integrada**. Solo estados y metadatos de contratos.
- Clientes reales: **no activados**.
- Repositorio Apps Script: **inspeccionado en lectura, no modificado**.

## Riesgos y bloqueos
1. Falta verificar una identidad administradora auténtica y dar de alta el perfil autorizado sin conceder privilegios a una identidad sin verificar.
2. No se han probado enlaces de acceso, correos, sesiones multiusuario y navegación en Safari iOS / Chrome Android.
3. Habilitar en Auth la protección de contraseñas filtradas según disponibilidad del plan.
4. Confirmar lista de URLs permitidas para redirección a `portal.html`, `staff.html` y `admin.html`.
5. La función de invitación no debe activarse hasta comprobarla con identidad administrativa y correo de prueba.
6. El sistema de presupuestos Apps Script es independiente. Su manifiesto permite acceso web anónimo, posiblemente necesario para el webhook; confirmar que el controlador autentica las peticiones. **No tocar sin pruebas de compatibilidad**.
7. Contratación: falta proveedor de firma electrónica y validación fiscal/contractual.
8. Cumplimiento de protección de datos, conservación y copias de seguridad: pendiente.
9. Los uploads de PDF requieren pruebas reales de almacenamiento y recuperación de incidencias. Si Storage sube un PDF pero falla la inserción de metadatos, puede quedar un archivo huérfano accesible solo por personal autorizado.

## Coste
No se han contratado planes ni servicios adicionales. El uso futuro de infraestructura puede generar consumo según el plan vigente.

## Código
- Rama: `feature/staff-console-20261103`.
- PR: https://github.com/flamencoevents/Flamenco-Events-app/pull/2
- La rama pública principal no ha sido alterada por estos cambios.
