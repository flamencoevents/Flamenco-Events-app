# Revisión del 3 de noviembre de 2026

## Implementado en esta revisión

- Entrada directa al panel según rol, con error explícito si no puede consultarse el perfil.
- Identificación visual de modo prueba en los tres espacios autenticados.
- Alta administrativa de solicitudes ficticias, sin correo ni presupuesto automático.
- Edición comercial de servicio, lugar, fecha y notas de revisión.
- Aviso interno a administración y comerciales al registrar una solicitud.
- Secuencia de llamada, autorización, envío y aceptación protegida también frente a saltos administrativos y fechas modificadas fuera de su paso.
- Bloqueo de invitaciones a clientes en la función del servidor y de confirmaciones de reserva en la base de datos.
- Recuperación de las 32 migraciones anteriores y cuatro funciones desplegadas; nueva migración 20261103084939.

## Pruebas superadas

Cuatro comprobaciones Node: redirección de administrador, comercial y cliente; sintaxis de scripts y búsqueda acotada de claves privadas conocidas. Esta búsqueda no sustituye una auditoría completa de secretos o dependencias.

Pruebas SQL bajo `authenticated`, simulando administrador, comercial y dos clientes: visibilidad de solicitudes para comercial; bloqueo de escalada de rol; bloqueo de saltos del proceso para administrador y comercial; progresión válida; aislamiento de eventos y metadatos de documentos; invisibilidad de contratos en borrador; bloqueo de mensajes en evento ajeno; bloqueo de confirmación formal; generación de avisos internos. Los datos de prueba se revirtieron. Estado posterior: un usuario, cero solicitudes y cero eventos.

Almacén `event-documents`: privado, solo PDF, límite 10 MB. Se revisaron sus políticas; no se ha probado una descarga real de archivo con dos sesiones de cliente.

## Límites y trabajo pendiente

- La sesión del navegador disponible está cerrada: se ha visto el formulario de acceso, sin realizar un nuevo envío SMTP ni una prueba visual autenticada.
- Los asesores de seguridad no detectan tablas sin RLS. Mantienen el aviso de protección contra contraseñas filtradas desactivada; configuración no modificada. Referencia: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
- La demostración pública conserva datos solo en el navegador. Falta un endpoint de captación pública con protección contra abuso y consentimiento; no está conectado a solicitudes reales.
- La función `ingest-accepted-quote` comprueba firma HMAC y aceptación comercial. El código revisado en el repositorio Apps Script no la invoca. No se confirma que el secreto compartido esté configurado en los dos servicios ni que exista una sincronización operativa.
- No se han alterado fórmulas económicas, archivos de Sheets, diseños Canva ni plantillas de contratos.
- Hay varias direcciones de correo asociadas a Azahara. No se ha escogido una por suposición, creado una cuenta ni enviado una invitación.
- La interfaz de reserva ya existente exige contrato firmado y revisión administrativa. Los requisitos finales del negocio aún deben documentarse antes de habilitar reservas reales; en pruebas permanece bloqueada.
- No se ha probado reconstruir una base vacía con las migraciones recuperadas. Se preserva el historial aplicado; la herramienta Supabase CLI no está instalada en este entorno.
