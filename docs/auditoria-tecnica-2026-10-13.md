# ATLAS ELE — Auditoría técnica inicial (2026-10-13)

## Alcance y límites
Revisión estática del código y de cuatro fuentes: `data/pilot-city-points.json`, `data/master-europe-extra.js`, `data/global-seed.js` y `data/recovery-20261006.js`. No constituye verificación presencial, geocodificación ni prueba completa del mapa publicado.

## Hallazgos confirmados
- `pilot-city-points.json`: 200 instituciones frente a `meta.records: 25`; corregir metadatos después de validar la fuente.
- 81 registros clasificados `city`, 49 `address` y 70 `exact`.
- 144 de 200 registros sin campo `address`; 67 sin `web`.
- 63 registros `exact` carecen de dirección postal: su exactitud no está demostrada con la información almacenada.
- Los 200 registros tienen coordenadas numéricas dentro de los rangos de latitud/longitud.
- En el cruce de 669 registros de cuatro fuentes, se observaron 10 coincidencias normalizadas de nombre + ciudad + país, de las cuales 8 tienen coordenadas distintas. No equivalen automáticamente a 10 duplicados visibles: el código fusiona IDs repetidos y parte de los registros de recuperación.
- `app.js` fusiona por ID con preferencia por mayor etiqueta de precisión, pero esa etiqueta no implica verificación externa. El tratamiento de coincidencias por nombre no es uniforme entre fuentes.
- Las modificaciones del panel de administración denominadas `Save locally` no escriben en GitHub.
- La documentación indica 3.404 instituciones únicas, pero el número final cargado en el navegador todavía no ha sido reproducido de forma independiente.

## Riesgos y controles propuestos
1. **Conservación:** trabajar con commits revisables, sin borrar registros originales hasta verificar equivalencias.
2. **Identidad:** normalizar nombre, localidad, país, web y dirección; marcar candidatos duplicados para revisión humana.
3. **Ubicación:** separar `institution_verified` de `location_verified`; no elevar `precision` sin evidencia.
4. **Direcciones:** registrar fuente oficial y fecha de comprobación; nunca inferir una dirección a partir de coordenadas de ciudad.
5. **Calidad:** verificar validez de coordenadas, campos obligatorios, URLs, tipos y consistencia de identificadores.
6. **Carga:** comprobar todas las fuentes y el total final mediante pruebas del navegador, incluidos errores de descompresión de los paquetes.
7. **Privacidad:** mantener excluidos emails internos, contactos privados, notas y datos de profesores no inscritos voluntariamente.

## Siguiente fase
Auditar los paquetes restantes y ejecutar pruebas de carga; producir un listado de incidencias por prioridad antes de cambiar coordenadas o eliminar duplicados.

Este documento es un informe de auditoría, no una afirmación de que todas las instituciones o direcciones estén verificadas.
