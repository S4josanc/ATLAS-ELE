# ATLAS ELE — cruce ampliado de fuentes (22-10-2026)

Se inspeccionaron 18 fuentes: 17 archivos JS sin comprimir y `data/pilot-city-points.json`, con un extractor de filas `[id,name,type,city,country,lat,lng]` y objetos del piloto.

## Resultado
- 2.369 registros identificados por el extractor.
- 2.346 IDs distintos.
- 20 identificadores aparecen más de una vez, generando 23 apariciones adicionales sobre el total de IDs únicos.
- 70 grupos repiten nombre + ciudad + país (no son 70 duplicados confirmados).
- 0 filas detectadas con nombre/ciudad/país/ID ausente, coordenadas fuera de rango o ambas coordenadas cero, dentro de las filas reconocidas.

## IDs repetidos
`ES-000001`, `ES-000002`, `ES-000003`, `ES-000004`, `ES-000005`, `ES-000006`, `ES-000007`, `DE-000001`, `DE-000002`, `AT-000001`, `SK-000001`, `HU-000001`, `CN-IC-002`, `EG-IC-002`, `MA-IC-003`, `BR-IC-002`, `BR-IC-003`, `IT-IC-002`, `IT-IC-003`, `FR-IC-002`.

Los ID repetidos pueden ser enriquecimiento legítimo de las mismas instituciones. Ejemplos: `DE-000002` tiene denominaciones más y menos extensas en distintas fuentes. **No borrar ni reasignar sin inspección manual.**

## Alcance no cubierto
- Siete partes codificadas `master-pack` (pendiente descomprimir y comprobar registros efectivos).
- Enriquecimiento y altas FEDELE que `app.js` crea dinámicamente.
- La reconciliación exacta de `mergeRecord` en ejecución de navegador.
- Tests E2E y despliegue.

## Próximo paso
Descomprimir los paquetes, inventariar los IDs reales, identificar las colisiones conflictivas (nombre y lugar distintos para el mismo ID) y construir una tabla canónica de equivalencias preservando enlaces antiguos. Mantener copias backup intactas.
