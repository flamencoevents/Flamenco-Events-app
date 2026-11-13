# Navegación común — plataforma de gestión

## Ámbito
Este módulo utiliza **un solo menú superior** en las ocho páginas de gestión: `admin.html`, `staff.html`, `marketing.html`, `rrhh.html`, `marketing-venues.html`, `marketing-planners.html`, `marketing-task.html`, `desarrollo-comercial.html`.

No se altera el portal privado de clientes `portal.html` ni la web comercial pública.

## Comportamiento
- Cabecera superior sticky, con el departamento activo resaltado.
- En pantallas pequeñas, botón **Menú** con panel desplegable y enlace siempre accesible.
- Submenú contextual: Marketing (plan, prospección, espacios, wedding planners y directorios) o Comercial (oportunidades por sector).
- Administración ve Administración, Marketing, Comercial y RR. HH.; perfil Comercial ve únicamente Comercial y RR. HH., más sus oportunidades.
- No hay departamento independiente «Desarrollo Comercial»: la prospección pertenece a Marketing y el seguimiento a Comercial.
- Sin usuario autenticado ni rol autorizado, menú oculto; los permisos reales de datos deben validarse con RLS.

## Implementación
- Código compartido: `departments-nav.js`.
- Estilo responsivo: `departments-nav.css`.
- Menú anterior específico de `staff.html`: ya no se invoca para evitar duplicación.
- Versionado de recursos: `?v=20261114-unified`.

## Validaciones estáticas efectuadas
- Ocho páginas contienen contenedor y exactamente un enlace al JS y al CSS común.
- El número de etiquetas script coincide con el número de cierres en las ocho páginas.
- JavaScript embebido y compartido compila sin errores sintácticos.

## Pruebas pendientes antes de publicar en principal
- Comprobar visualmente en iPhone (Safari) y escritorio, especialmente el sticky y el menú expandido.
- Validar interacción con las hojas de estilo de Administración y Comercial.
- Navegación de ida y vuelta con sesión de Administración y Comercial.
- Sesiones expiradas, usuario cliente, ausencia de sesión y permisos de base de datos.
- Confirmar que las funciones de presupuestos, eventos, RR. HH. y tareas no han sufrido regresiones.

Rama de pruebas. No hay campañas enviadas ni migraciones aplicadas en Supabase activo.
