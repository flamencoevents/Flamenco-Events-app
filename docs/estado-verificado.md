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

## Continuación · integración y coordinación

- Correo de Azahara confirmado por Nacho: `azahara88molero@gmail.com`; invitación creada y pendiente de verificación en la última consulta. No se han concedido aún permisos comerciales.
- Aviso horario configurado para comunicar a Nacho cuando se verifique el correo y exista un primer acceso.
- Añadida edición de repertorio, vestuario, horarios y contacto en el panel del equipo. Pruebas SQL confirman que comercial puede coordinar y sigue sin poder modificar campos comerciales protegidos.
- Preparado `AppBridge.js` en el repositorio privado de Apps Script, con firma HMAC y autorización manual. Desactivado por defecto; pendiente de secreto compartido, activación controlada, despliegue de Apps Script y prueba entre servicios. No se han conectado disparadores automáticos ni modificado cálculos.
- Receptor `ingest-accepted-quote` v2 desplegado: exige solicitudes `admin_test` y `is_test=true` en modo prueba, rechaza JSON nulo y falla si no puede verificar la configuración.
- Ocho pruebas del adaptador Apps Script y ocho del receptor pasan con servicios simulados; las cuatro pruebas previas del portal también pasan. Estas pruebas no demuestran una conexión real entre Google Apps Script y Supabase.
- Pruebas SQL ampliadas ejecutadas con éxito, con ROLLBACK; sin comunicaciones a clientes ni datos de prueba persistidos.

## Activación del perfil comercial de Azahara

- Verificados directamente `email_confirmed_at` y `last_sign_in_at` para `azahara88molero@gmail.com`.
- Perfil cambiado de `client` a `sales` mediante `assign_sales_role_atomic`, con la autorización de Nacho en este chat y un registro en `role_change_audit`. La cuenta de Nacho conserva `admin`.
- Prueba SQL bajo `authenticated` con el UUID real de Azahara: `is_staff()=true`, `is_admin()=false`, consultas de solicitudes, eventos y avisos permitidas; bloqueados la escalada a administrador, los cambios en `app_runtime` y la invocación del RPC de asignación de roles. Prueba revertida con ROLLBACK.
- `app_runtime.test_mode` sigue activo. No se enviaron correos ni se crearon solicitudes o eventos.
- Volvieron a pasar las 12 pruebas del portal y del receptor. No se ha comprobado visualmente el panel con la sesión personal de Azahara.
- Las anotaciones anteriores sobre su identidad pendiente o su rol `client` describen un estado anterior y quedan sustituidas por esta verificación.

## Transferencia real de prueba desde Apps Script verificada

El 3 de noviembre se ejecutó remotamente el presupuesto ficticio 9999926 v1 desde Google Apps Script contra el receptor firmado de Supabase. Primer envío `recorded`, segundo idéntico `already_recorded`. La consulta posterior confirma un único registro, total 1000 € y reserva 300 €, con origen `appscript` y solicitud `admin_test` identificada como PRUEBA INTEGRACIÓN APP. No se crearon eventos ni se activó la sincronización general. El editor de Apps Script se restauró y el despliegue temporal de prueba se retiró. Se conserva el dato ficticio para revisión. La base mantiene modo prueba.

Evidencia de ejecución y limpieza: https://github.com/flamencoevents/flamenco-events-appscript/actions/runs/41671668881

Esto sustituye la anotación anterior de ausencia de prueba entre servicios. Sigue pendiente conectar la lectura del presupuesto y su versión exactos desde Sheets, además de las verificaciones restantes del flujo comercial completo.

## Lectura exacta desde Sheets verificada

Prueba remota del 3 noviembre: Apps Script leyó FE_Cola, clave X26-P000004-v1, y transfirió sus importes sin recalcular: total 520 €, reserva 0 €, modalidad no_vat_quote. Primera respuesta recorded y repetición already_recorded; consulta directa confirma un único registro y external_reference con libro, pestaña y clave exactos.

Receptor v4 desplegado y conservado en GitHub: acepta referencias explícitas de prueba y valida el origen. El lector exige copia FE3 generada, coincidencia de número/revisión/clave y autorización expresa; no presupone aceptación comercial. No se modificó Google Sheets ni las fórmulas. Se conserva la solicitud técnica admin_test, sin eventos. El ejecutor temporal se retiró y el editor se restauró.

Evidencia: https://github.com/flamencoevents/flamenco-events-appscript/actions/runs/41673007792

Todo sigue en modo prueba. No hay disparadores de importación ni se ha activado la sincronización general. La modalidad efectivo100 queda pendiente de correspondencia en la facturación de la app; se bloquea en vez de inferir una modalidad incorrecta.
