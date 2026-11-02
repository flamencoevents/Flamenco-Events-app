# Hoja de ruta y pruebas de Flamenco Events App

## Flujo obligatorio
1. El interesado llega desde Google, portales de boda, redes, web o WhatsApp.
2. Solicita una propuesta y deja sus datos.
3. Azahara contacta por teléfono y valida los requisitos.
4. El equipo revisa, aprueba y envía el presupuesto.
5. Tras aceptar el presupuesto, se invita al cliente a Mi evento.
6. Cliente y equipo coordinan contrato, repertorio, vestuario, horario y contactos.
7. La reserva solo se considera formalmente confirmada cuando se cumplen las condiciones pactadas.

## Reglas
- Sin llamada y aprobación no se envía presupuesto.
- La solicitud no activa automáticamente el acceso privado.
- La cuenta de cada cliente solo permite consultar su evento.
- Los cambios solicitados por el cliente son propuestas hasta validación del equipo.
- No guardar PDFs privados ni datos reales en GitHub Pages.
- Mantener el proyecto de presupuestos existente separado y estable.

## Pruebas antes de producción
- Probar con dos usuarios que uno no ve el evento del otro.
- Confirmar que no se pueden autoasignar permisos de personal.
- Verificar que el presupuesto no pasa a enviado sin llamada y aprobación.
- Probar mensajes, cierre de sesión y enlaces de autenticación.
- Comprobar acceso desde Safari iPhone y Chrome Android en español e inglés.
- Verificar almacenamiento privado de contratos y cumplimiento RGPD.

## Pendiente
Crear Supabase de empresa; aplicar schema.sql y migración 001; configurar Auth y almacenamiento privado; construir panel de equipo; integrar el motor de presupuestos solo después de validar la seguridad.
