## Integración de contratos generados · 6 noviembre 2026

Se ha conectado el contrato generado a una previsión de prueba en el libro CUENTAS 25/26 y a la bandeja administrativa generated_contract_intake. El año procede de la fecha del evento, nunca del prefijo del número. X26-P000007-v1 consta con fecha 2026-11-30, total 1400, reserva prevista 420 y saldo previsto 980. Cuenta: pestaña PRUEBA contratos 2026, fila 2 (gid 1665368309). Confirmado por lectura del diario FE_Integracion_Contratos y SQL.

El generador anterior no ejecutaba ninguna escritura en cuentas o eventos. La sincronización de solicitudes era distinta, estaba deshabilitada y además exigía prefijo PRUEBA en el nombre. No se ha activado esa sincronización ni se han saltado sus controles.

La nueva recepción admite solamente contratos de prueba, usa HMAC y timestamp, valida cantidades/fecha/origen, limita los campos y rechaza cambios en una referencia ya incorporada. Solo administración lee la bandeja mediante RLS; ningún cliente, comercial o anónimo. No contiene DNI, dirección, claves ni identidad contractual completa. Los documentos conservan el acceso privado de Drive. No se han marcado llamadas, aceptación, firma, cobro ni reserva. No se crean events ni accepted_quote_terms sin su recorrido comercial acreditado.

Apps Script reintenta cada cinco minutos mediante feContratosIntegrarPendientes, con exclusión mutua. El diario solo marca INTEGRADO tras leer la fila de cuentas y confirmar la recepción firmada. Se ha corregido el contraste de fechas Date de Sheets frente a ISO y preservado la zona horaria del libro. Una prueba local reproduce caída tras escritura, recuperación sin duplicado, fecha convertida y llamadas firmadas/idempotentes/conflictos.

Límites explícitos: solo 2026; 2027 continúa pendiente de su escritor XLSX y aparece PENDIENTE en el diario. Modo real y balances reales no se habilitan. Una pestaña auxiliar PRUEBA contratos 2027 creada durante la primera comprobación se conserva como evidencia del ensayo, sin incorporación al receptor ni a balances; el enrutado final ya bloquea esa escritura. El catálogo histórico no se modifica ni se etiqueta como sincronizado. Generar PDF no acredita cierre comercial. La bandeja se muestra en admin.html como Contratos generados, con selector de año.


## Relectura del diario dentro del lote · 7 noviembre 2026

Reproducido con dos filas contractuales de idéntica referencia y sin diario previo: el coordinador anterior enviaba dos veces y creaba dos entradas porque consultaba una copia del diario capturada antes del bucle. La prueba falla antes del cambio (integrados=2 frente a 1 esperado). Ahora relee el diario al iniciar cada operación, dentro del bloqueo de script existente. El mismo lote produce integrados=1, existentes=1, un envío y una única entrada. No se cambia la validación de revisión, modo, firma, importes ni destino. Se conserva el bloqueo por referencias ya duplicadas.

Validación local: node --test tests/contract-integration*.test.cjs, nueve pruebas superadas. Servicios externos simulados; sin abrir ni escribir cuentas, sin peticiones HTTP ni nuevas solicitudes reales. Código y prueba guardados en GitHub. No desplegado a Apps Script en esta continuación; la versión remota no se considera actualizada por este commit. La vinculación automática de bandeja a solicitud comercial tampoco se declara desplegada ni comprobada. CUENTAS 27 y sincronización general sin cambios.
