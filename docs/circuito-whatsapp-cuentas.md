# Circuito WhatsApp → contrato → cuentas · 6 noviembre 2026

> **Bloqueo de conservación resuelto en copia aislada.** El empaquetado nuevo
> conserva el origen y traslada solo las seis celdas creadas por Artifact Tool.
> La misma auditoría independiente pasa sin diferencias no autorizadas.
> 40 pruebas sintéticas locales superadas. El rechazo descrito más abajo es
> evidencia del ensayo anterior, conservada como historial.

## Solución de conservación · continuación del 6 noviembre

`tools/accounts_2027_package.py` utiliza el exportado de Artifact Tool únicamente
como fuente de los valores de C:H. No reconstruye fórmulas, estilos ni valores
del resto del libro. Reutiliza todos los componentes del paquete original y sus
metadatos ZIP; en la hoja de destino sustituye solamente los seis elementos de
celda preexistentes, reteniendo sus estilos y atributos. El resto del XML se
conserva byte por byte. No calcula valores por otra vía ni utiliza otra
biblioteca de hojas de cálculo para generarlos.

El empaquetado publica una copia local nueva solo si pasa el verificador
independiente existente. Rechaza el archivo origen como destino, destinos ya
existentes, celdas sin preformato, fórmulas aportadas en vez de valores, importes
incorrectos y fuentes cambiadas. Un fallo borra el temporal y no publica copia.
No se ha debilitado ni modificado `accounts_2027_verify.py`.

`accounts_2027_roundtrip.mjs` encadena ahora exportación Artifact → empaquetado
conservador → auditoría de `preserved.candidate.xlsx`. Mantiene el exportado
completo como diagnóstico privado, sin usarlo para sustituir el libro. La salida
del ensayo completo es `copy_audited_requires_review`, preservation_verified=true
y production_writable=false.

Comprobaciones nuevas:

- 40 pruebas sintéticas: las 32 anteriores y ocho de conservación, conflictos,
  XML, datos incorrectos, prefijos y atributos, caracteres Unicode y enlaces
  locales que intentan sobrescribir el origen.
- Ensayo completo con entrada contractual ficticia y copia local del libro:
  las seis celdas coinciden; auditoría sin diferencias; huella del origen intacta.
- Vista de A9:Q13 de la copia preservada comprobada: fecha, hora, lugar, cliente,
  céntimos y formato de moneda legibles, sin modificar la fila existente.
- Apertura y recálculo en LibreOffice de dos copias separadas (origen y resultado):
  110 fórmulas en ambos, mismos textos y resultados almacenados. Cuatro errores
  aparecen en las mismas celdas y con los mismos códigos en ambas copias; no se
  introducen errores nuevos en esta comprobación. No se confirma si se deben al
  libro original o a compatibilidad de LibreOffice. No se corrigen por inferencia.
- El guardado de LibreOffice se usa solo para comprobar el recálculo, no como
  copia final ni sustituto del paquete preservado. Microsoft Excel no se ha
  probado. Los ficheros privados e imágenes no se publican.

Resuelto: conservar la copia XLSX de este ensayo sin alterar estructura,
fórmulas, enlaces, estilos ni componentes ajenos a C:H. Pendiente: conexión
autenticada a servidor/Drive/WhatsApp, registro de operaciones y escritura
remota con control de versión, reglas de cierre, enero y último bloque. No hay
escritor contable desplegado ni alta automática de contratos en el libro real.

MODO PRUEBA. Este avance prepara un ensayo local; no activa sincronización,
firma, reservas, clientes ni escritura en CUENTAS 27.

## Componente nuevo

`tools/accounts_2027_contract.py` consume las estructuras existentes de
FE_Cola/FE_App_Pruebas y FE_Contratos, un evento ficticio explícito y bytes PDF.
Comprueba estado GENERADO en ambas filas, número textual, clave y revisión,
igualdad íntegra entre FE3 y la copia embebida en el contrato, fecha completa,
referencia privada Drive y SHA-256 de los bytes aportados. No descarga archivos
ni verifica su procedencia remota: `remote_origin_verified=false`.

El adaptador prepara el mismo objeto utilizado por `accounts_2027.py` y delega
los controles de mes, fila, ocupación, fórmulas, duplicados e identidad. Solo
propone C:H. Conserva el cálculo guardado en el informe privado, sin recalcular
impuestos ni trasladar reserva prevista a COBRADO RESERVA. Las condiciones Bizum
del contrato se conservan aparte; no sustituyen el cálculo del presupuesto.
No acepta efectivo100 mientras no exista cláusula aprobada.

El horario debe existir explícitamente en el evento ficticio: el esquema FE3
no exige ese dato. Nunca se infiere de duración o pases. El informe no acredita
que el horario esté aprobado contractualmente.

Los indicadores de firma, cobro y cierre comercial permanecen falsos. La
generación de PDF no permite pasar a fechas cerradas ni a balances reales.
Una entrada JSON no sustituye autenticación, lectura firmada, llamada,
autorización comercial, aceptación o revisión administrativa.

## Ensayo XLSX actualizado

`accounts_2027_roundtrip.mjs` utiliza un ArrayBuffer exacto de los bytes cuya
huella ha comprobado y renderiza por índice de hoja conservando el nombre
original. La apertura y el renderizado/exportación ya se completan. Esto
actualiza el bloqueo anterior; no identifica con certeza la causa interna del
importador/renderizador.

La fecha se exporta como número de serie Excel, sin cambiar el formato heredado.
Tras exportar, el escritor ejecuta automáticamente `accounts_2027_verify.py`.
Guarda audit.json privado y devuelve código 2 si la copia es rechazada. Incluso
si pasa la auditoría, `production_writable=false`: faltan revisión visual,
cálculo en Excel, autorización de servidor y registro atómico de operaciones.
No tiene subida a Drive ni capacidad de sustituir el original.

## Evidencia de esta continuación

- 32 pruebas sintéticas locales superadas: 21 anteriores y 11 del nuevo enlace.
- Sintaxis del escritor MJS verificada.
- Ensayo integrado: filas ficticias en formato de las colas → adaptación →
  propuesta mensual → exportación de copia aislada del libro descargado →
  auditoría independiente. No fue una petición real desde WhatsApp.
- Los seis valores C:H esperados pasan la comprobación de contenido, incluida
  la fecha y los céntimos. Sin embargo, la auditoría detecta cambios en 17
  partes protegidas del paquete y en la estructura de sus cinco hojas. **Copia
  rechazada**, salida 2, sin sustituir el origen ni relajar el verificador.
- El SHA-256 de la copia de origen es idéntico antes y después.
- No se entregan las copias experimentales ni sus imágenes: contienen datos
  privados del libro y no han superado conservación. No se suben a GitHub.
- El workflow existente accounts-2027.yml ya incluye las rutas de estos nuevos
  archivos y ejecuta `test_accounts_2027*.py`; no requiere Google ni secretos.

## Ejecución reproducible

```sh
python3 -m unittest discover -s tests -p 'test_accounts_2027*.py' -v
node --check tools/accounts_2027_roundtrip.mjs
python3 tools/accounts_2027_contract.py /ruta/privada/origen.xlsx /ruta/privada/entrada-ficticia.json /ruta/privada/contrato-ficticio.pdf
```

La entrada incluye test_mode=true, source_system=whatsapp,
source_sheet=FE_App_Pruebas (o FE_Cola), quote_row y contract_row con sus formas
existentes, expected_pdf_sha256, candidate_row y event (id, is_test=true, date
ISO, schedule, quote_number, source_key, version). `planner_request` permite
continuar el ensayo MJS documentado en web-gestion-empresa.md. El informe
incluye cálculo privado: redirigir a una ubicación privada, nunca al repositorio.
Los bytes PDF y su huella se comprueban por integridad, no por validez jurídica.

## Pendientes para el circuito operativo

1. Conservación resuelta en copia local según la evidencia inicial de este documento;
   sigue pendiente la comprobación en Microsoft Excel y la integración remota.
2. Lectura autenticada de las colas y PDF exactos hacia el adaptador, con
   comprobación de permisos y secuencia comercial en servidor.
3. Conciliar significado de IVA/fecha de reserva/gastos y condiciones de cierre;
   resolver enero y límite del último bloque antes de escribir esos casos.
4. Registro privado de operaciones, exclusión mutua, control de versión, relectura
   antes de guardar, recuperación y prevención de duplicados entre reintentos.
5. Completar generación desde plantillas aprobadas, PDF, Drive, ficha web y
   cuentas con servicios reales de prueba; revisión visual y cálculo en Excel.

No hay escritor contable desplegado, conexión automática al libro ni nueva
función en el panel. El código nuevo es un componente local preparado y probado.

## Comprobación en GitHub

El commit `815e5704844de24e7613b0661b9598bbc5807d85` quedó guardado en main.
El workflow de las pruebas sintéticas y sintaxis terminó con `success`:
https://github.com/flamencoevents/Flamenco-Events-app/actions/runs/42215139509 .
No implica despliegue de un escritor ni verificación del recorrido remoto.

### Verificación de la corrección en GitHub

Commit `d1dddf0224685c1fe001814ca349dac9f1d0052f` guardado en main.
Las 40 pruebas y la comprobación de sintaxis finalizaron con `success`:
https://github.com/flamencoevents/Flamenco-Events-app/actions/runs/42216066265 .
La conservación se verificó localmente sobre una copia privada; CI usa solamente
fixtures sintéticas, sin libro ni credenciales corporativas.

## Registro local de operaciones · 6 noviembre 2026

Implementado `tools/accounts_2027_ledger.py`, ensayo local SQLite con datos
ficticios. Recalcula la propuesta, conserva solo huellas y estados y utiliza
transacciones `BEGIN IMMEDIATE` y restricciones únicas. Los reintentos exactos
devuelven la misma operación; otra revisión, importe o fila del mismo evento
requiere conciliación. Solo puede existir un ensayo reservado por libro lógico.
Las claves de libro y propietario son identificadores opacos suministrados por
el llamador: **no autentican ni autorizan usuarios**.

Estados: `reserved`, `copy_verified`, `failed`. Una copia solo alcanza
`copy_verified` ejecutando el verificador independiente sobre los archivos, no
aportando un JSON de auditoría. Un fallo conserva la reserva; su propietario
local puede marcarla fallida para liberar el libro. Un reinicio no vence ni
roba reservas. El estado fallido no puede reactivarse automáticamente. Una
operación verificada no puede marcarse fallida. No existe estado de escritura
remota: `remote_committed=false` y `production_writable=false` siempre.

Doce pruebas nuevas superadas localmente: persistencia, repetición, conflicto
de revisión/importe/fila, exclusión entre conexiones concurrentes, propietario,
auditoría rechazada, copia preservada, liberación, rollback, datos no ficticios
y modificación de solicitud. Las 40 pruebas anteriores también pasaron con la
primera versión del nuevo módulo (49 en esa ejecución); se añadieron después
tres casos más, y pasaron los 12 del módulo. Las 52 pruebas y la sintaxis MJS pasaron también conjuntamente en GitHub Actions.
Las fixtures, bases y copias temporales se eliminan con TemporaryDirectory,
incluso ante fallos. No se crearon usuarios, asignaciones ni sesiones externas.

Reproducción sin dependencias nuevas ni servicios:

```sh
python3 -m unittest discover -s tests -p 'test_accounts_2027_ledger.py' -v
python3 -m unittest discover -s tests -p 'test_accounts_2027*.py' -v
```

Preparado y probado localmente; **no desplegado ni integrado** al MJS, al panel,
a Supabase o a Drive. El diario debe almacenarse en una ubicación privada;
no contiene clientes, horarios, importes, URLs ni PDF. No protege contra un
usuario con acceso directo a esa base local. No prueba autenticación, lectura
remota, reemplazo condicional Drive ni recuperación de una escritura remota
incierta. La exclusión solo coordina llamadores que compartan la misma base y
clave estable del libro. Liberar un ensayo no demuestra actualización del
origen; el futuro servidor debe releer la versión y volver a conciliar antes de
guardar. La sincronización general sigue apagada y CUENTAS 27 intacto.

### Registro de operaciones: verificación en GitHub

Código guardado en main: `c4997f90de167d4c4aff5e261d8a9d530f80583a`.
Workflow https://github.com/flamencoevents/Flamenco-Events-app/actions/runs/42221012428 :
job synthetic-tests success; logs confirman 52 tests, OK, y sintaxis MJS correcta.
No se repitieron ensayos Auth/HTTP ni se desplegó un escritor remoto. El siguiente
paso técnico es integrar este protocolo con lectura autenticada y versión remota;
no reutilizar el diario local como prueba de autorización o escritura en Drive.
