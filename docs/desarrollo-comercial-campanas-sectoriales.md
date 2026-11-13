# Desarrollo Comercial — Organización y campañas (PRUEBAS)

## Regla de activación
**Prohibido ejecutar campañas hasta que el conjunto de clientes potenciales haya sido diseñado, deduplicado, contrastado y aprobado por Administración.** La autorización se da por sector y por campaña, no globalmente. Ninguna función existente envía correos o WhatsApp desde este módulo.

## Sectores
1. **Bodas y agencias:** fincas, haciendas, wedding planners, organizadores MICE y eventos corporativos. Propuesta: Suite Flamenca, Son del Alma, guitarra solista y experiencias corporativas.
2. **Hostelería de alto standing:** hoteles cinco estrellas, resorts, hoteles boutique, beach clubs, restaurantes gastronómicos y clubes privados. Propuesta: actuaciones semanales o de temporada, experiencias privadas, cenas VIP y música ambiental.
3. **Alianzas de lujo:** firmas de moda flamenca, joyería, complementos y alta costura. Propuesta: desfiles con música en directo, presentaciones de colección, editoriales, activaciones de marca y eventos VIP. Distinguir patrocinio, contratación pagada e intercambio; documentar uso de imagen, entregables y derechos.
4. **Agencias y eventos corporativos:** organizadores de congresos, agencias internacionales, hoteles de congresos y eventos de marca. Se gestiona como categoría específica de prospección, diferenciada de las fincas de bodas.

## Distribución de responsabilidades (RACI)
- **Marketing, bajo supervisión de Administración:** investigar sectores, registrar fuentes y fechas de contraste, completar web y contacto profesional, deduplicar, clasificar, valorar encaje, preparar dossier ES/EN y borradores de mensajes, determinar público objetivo.
- **Comercial — Azahara:** revisar contactos cualificados, localizar al interlocutor correcto, realizar llamadas y reuniones, personalizar propuesta, negociar honorarios/comisiones/condiciones, acordar seguimiento, registrar respuesta y cerrar acuerdo.
- **Administración — Nacho:** validar base y estrategia, autorizar campañas y envíos, revisar obligaciones legales, controlar calidad, presupuestos y resultados. Solo Administración activa campañas reales.
- **Sistema:** ninguna comunicación no solicitada por defecto. Mantener trazabilidad de fuente y estado, duplicados, no contacto/oposición, fecha del último contacto, permisos y seguimiento.

## Flujo de trabajo
Investigación > Verificación > Cualificación > Aprobación de campaña > Traspaso a Comercial > Contacto personalizado > Reunión > Propuesta > Negociación > Acuerdo > Seguimiento / Recontratación.

## Comprobaciones obligatorias previas al lanzamiento
1. Identidad de cada empresa y dominio verificados; contacto profesional, fuente y fecha de verificación.
2. Comprobación de duplicados entre categorías, exclusión de quienes ya tienen acuerdos o han solicitado no recibir mensajes.
3. Evaluación de licitud de comunicaciones comerciales conforme a la LSSI y RGPD: no asumir que publicar un correo equivale a permiso para marketing. Revisión específica del fundamento jurídico, canal y contenido; siempre identificación y mecanismo de oposición cuando aplique.
4. Dossier sectorial aprobado por Administración; mensaje adaptado al establecimiento, sin falsas referencias ni promesas.
5. Lote piloto limitado, revisado manualmente, sin envíos desde la plataforma hasta autorización explícita.
6. Revisar tasa de respuestas, reuniones, presupuestos y acuerdos. Suspender o corregir campañas con quejas.

## Métricas por sector
- Prospectos verificados / totales
- Prospectos cualificados / verificados
- Tasa de respuesta y reuniones
- Propuestas enviadas y acuerdos cerrados
- Ingresos y margen atribuibles a cada relación
- Recontratación, ciclos de venta, solicitudes de exclusión

## Seguridad y entorno actual
Estas migraciones SQL se han preparado en rama `feature/desarrollo-comercial-20261113` y **no se han ejecutado sobre el proyecto en producción**.
La pantalla `desarrollo-comercial.html` es una vista de pruebas; antes de enlazar desde el panel operativo debe desplegarse en una rama de entorno de pruebas, migrar esquema con revisión de RLS y añadir acciones de edición/traspaso con auditoría. El usuario no ha autorizado campañas automáticas ni importaciones masivas.
