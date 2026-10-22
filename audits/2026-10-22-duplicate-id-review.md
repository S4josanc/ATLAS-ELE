# ATLAS ELE — auditoría de identificadores (22 octubre 2026)

## Alcance ejecutado
Se inspeccionaron 15 archivos de datos JS de `main` mediante un análisis de las filas con formato `[id, nombre, tipo, ...]`.
Resultados: **2.021 filas reconocidas**, **2.013 IDs distintos** y **8 IDs con dos apariciones**. Es un análisis parcial: quedan fuentes adicionales (incluidos siete archivos codificados), el piloto JSON y los registros FEDELE generados durante la ejecución.

## Ocho IDs repetidos (revisión de contenido)
Todos aparecen en `data/global-seed.js` y `data/cervantes-2025.js` y conservan ciudad, país y coordenadas:
- `CN-IC-002`: Shanghái, China; nombres ligeramente distintos, segundo registro con web.
- `EG-IC-002`: Alejandría, Egipto; «Instituto» vs «Antena», segundo registro con web.
- `MA-IC-003`: Tánger, Marruecos; mismo centro, segundo registro con web.
- `BR-IC-002`: Río de Janeiro, Brasil; mismo centro, segundo registro con web.
- `BR-IC-003`: Brasilia, Brasil; mismo centro, segundo registro con web.
- `IT-IC-002`: Milán, Italia; mismo centro, segundo registro con web.
- `IT-IC-003`: Nápoles, Italia; mismo centro, segundo registro con web.
- `FR-IC-002`: Lyon, Francia; nombres ligeramente distintos, segundo registro con web.

**Interpretación:** parecen fuentes de enriquecimiento de una misma entidad, no ocho instituciones adicionales. No borrar automáticamente. `app.js` combina por ID y mantiene o complementa campos según el caso. Los cambios de nombre («Antena» vs «Instituto») requieren comprobación externa antes de normalizar.

## Limitaciones y siguientes pasos
- No se ha ejecutado la aplicación en navegador ni se ha completado su carga real.
- No se han ejecutado los siete paquetes comprimidos ni todos los registros FEDELE.
- Se requiere auditoría de todos los IDs efectivos tras `mergeRecord` y `data.push`.
- No utilizar claves derivadas de nombre/ciudad/país como identificadores permanentes.
- No modificar las ramas `backup/ATLASELE-Back-up-14.10.26` y `backup/pre-atlas-2-20261020`.

Estado: **auditoría parcial verificada; cambios en datos: ninguno**.
