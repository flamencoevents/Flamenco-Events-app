# Flamenco Events App

## Estado actual
- `index.html`: demo pública con datos ficticios guardados en el navegador.
- `portal.html`: espacio cliente bilingüe preparado para autenticación Supabase; deshabilitado hasta configurarlo.
- `portal-config.js`: configuración vacía deliberadamente, sin secretos.
- `supabase/schema.sql`: base de datos y políticas de acceso por cliente/equipo.

## Pendiente antes de usar con clientes
1. Crear proyecto Supabase gestionado por Flamenco Events.
2. Revisar y ejecutar el SQL, habilitar acceso por email y configurar redirecciones.
3. Añadir solo URL y clave *pública* del proyecto en portal-config.js; jamás claves secretas.
4. Dar de alta a Azahara como staff desde una operación administrativa segura.
5. Probar con dos cuentas que ningún cliente puede leer eventos o mensajes de otro.
6. Implementar panel administrativo protegido para activar clientes tras aceptar presupuesto.
7. Incorporar documentos PDF exclusivamente en almacenamiento privado con enlaces temporales.
8. Incorporar endpoint de solicitud con límites anti-spam, protección y consentimiento.
9. Verificar RGPD, cláusulas, encargados de tratamiento y política de conservación.
10. Nunca conectar la demo local al entorno real de clientes.

La aceptación comercial no equivale por sí sola a reserva confirmada; pueden faltar contrato y señal.
