# Circuito WhatsApp → contrato → cuentas · 6 noviembre 2026

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

1. Resolver conservación XLSX sin alterar nombres, formato, fórmulas ni enlaces;
   no reducir controles para aprobar una reserialización no explicada.
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
