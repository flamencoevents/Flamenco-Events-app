# Flamenco Events App

Aplicación de coordinación privada de eventos y captación pública.

## Componentes
- `index.html`: página pública; no almacenar datos privados de eventos aquí.
- `portal.html`: acceso de clientes, mensajes, documentos privados y propuestas.
- `staff.html`: gestión comercial, tareas, avisos y revisión de solicitudes.
- `admin.html`: panel administrativo de lectura protegido por rol.
- `portal-config.js`: únicamente URL y clave pública Supabase.
- `supabase/migrations/`: migraciones incrementales.

## Flujos protegidos
El presupuesto requiere llamada comercial y aprobación de Azahara. Aceptación de presupuesto y reserva formal son estados distintos. Los perfiles se asignan únicamente mediante administración verificada.

## Estado de despliegue
El entorno público sigue sirviendo la rama principal. Los nuevos paneles están en rama de desarrollo y **no están validados para clientes reales**. Las migraciones hasta `documents_and_change_requests` se aplicaron al proyecto Supabase.

## Antes de producción
1. Confirmar administrador y comercial con identidades verificadas.
2. Comprobar aislamiento RLS con dos usuarios de prueba en sesiones diferentes.
3. Verificar sesiones, enlaces mágicos y acceso documental.
4. Revisar advertencias de Supabase Auth, RGPD y conservación de datos.
5. Pasar pruebas móvil, navegación, accesibilidad y errores.
6. Integrar Apps Script sin modificar el motor de presupuestos sin reversión.

No usar documentos reales hasta completar los controles.
