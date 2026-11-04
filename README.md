# Flamenco Events App

App estática en GitHub Pages, con Supabase Auth, datos bajo RLS y documentos privados. **MODO PRUEBA**: sin clientes reales, envío automático ni reservas confirmadas.

- `index.html`: solicitud ficticia conectada al servidor, consentimiento, control de abuso e idempotencia; solo crea solicitud y avisos internos.
- `portal.html`: acceso por correo para cuentas existentes, navegación por rol y documentos del evento propio.
- `staff.html`: solicitudes, llamada, validación/autorización, registro de envío y aceptación, coordinación, tareas y avisos.
- `admin.html`: gestión independiente de eventos propios; prepara evento desde una versión aceptada y controla acceso/documentos. Invitaciones cliente y reserva formal bloqueadas en prueba.
- `workflow.js`: selección exacta de presupuesto/revisión/clave, revisión de importes y autorización explícita. El puente Apps Script v44 está publicado y la transferencia ficticia de efectivo está verificada; ver evidencias y límites en [docs/estado-verificado.md](docs/estado-verificado.md).

Importes e impuestos se conservan desde la copia aprobada. `individual_full_invoice` representa el particular efectivo100 con IVA guardado y reserva cero; no se equipara a empresa ni presupone exención.

## Servidor

`supabase/migrations/` es el historial aplicable. No ejecutar otra vez migraciones ya aplicadas. `supabase/schema.sql` y `supabase/legacy/` son referencias históricas. Las funciones privilegiadas validan JWT y rol en servidor; el receptor entre servicios valida HMAC. Las claves privadas solo existen en los servicios.

La sincronización general sigue desactivada. GENERADO no equivale a aceptado, y aceptar no confirma reserva. El criterio comercial final de confirmación sigue pendiente.

## Verificación

```
node --test tests/bridge-receiver.test.cjs tests/edge-workflow.test.cjs tests/portal.test.cjs tests/workflow-ui.test.cjs
```

25 pruebas locales con dobles para Edge/UI; `supabase/tests/continuation-rollback.sql` prueba permisos y secuencia en la base real mediante identidades ficticias y ROLLBACK. `supabase/tests/security-rollback.sql` conserva la batería anterior. Evidencias reales, límites y siguiente acción en [docs/estado-verificado.md](docs/estado-verificado.md).
