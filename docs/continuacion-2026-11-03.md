# Continuación técnica — 3 de noviembre de 2026

## Ejecutado en esta sesión
- Migración `006_guard_enquiry_progress.sql` aplicada en Supabase: protege transición de `new → called → approved` para ventas, impide saltos de etapas y modificaciones directas de campos protegidos.
- Migración `007_revoke_unsafe_api_privileges.sql` aplicada: revoca TRUNCATE, TRIGGER y REFERENCES sobre tablas públicas para `anon` y `authenticated`. Consulta posterior no devolvió esos privilegios.
- `staff.html` ampliado para mostrar tareas, marcar tareas completas, consultar notificaciones y marcar avisos como leídos.
- Se verificó existencia del trigger `guard_enquiry_progress`.
- El repositorio de presupuestos Apps Script permanece sin cambios.
- No se han creado ni expuesto clientes reales.

## Límites y riesgos
- El frontend permanece solo en rama, no desplegado.
- No se ha comprobado un login real de administrador, ventas o cliente ni aislamiento multiusuario.
- La interfaz aún no registra prueba externa de que se realizó la llamada; el campo es una declaración del comercial.
- Las políticas de avisos y tareas deben someterse a pruebas de manipulación con cuentas diferentes.
- Siguen 3 advertencias del asesor Supabase: dos SECURITY DEFINER y contraseñas filtradas.
- Pendientes contrato/firma, clientes, integración presupuestos y controles de auditoría completos.

## Interpretación del estado
Migraciones: **aplicadas y verificadas por catálogo**.
Interfaz: **programada**, no desplegada ni probada con sesiones reales.
Producción con clientes: **NO autorizada** hasta pruebas de seguridad y privacidad.
