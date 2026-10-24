# ATLAS ELE — inventario de fuentes y límites de auditoría (22-10-2026)

## Inventario verificado
La página principal carga 25 archivos JavaScript bajo `data/`:
- 4 archivos `spain-part*.js`
- 2 archivos `central-europe-part*.js`
- `global-seed.js`, `cervantes-2025.js`, `cervantes-accredited.js`
- 6 archivos `uk-master-seed*.js`
- `master-europe-extra.js` y `fedele-2026.js`
- 7 archivos `master-pack-*.js` con datos codificados/comprimidos
- `recovery-20261006.js`

Todos estos archivos se pudieron consultar en GitHub. Los siete archivos `master-pack` contienen fragmentos codificados y no son auditables con una expresión regular simple sobre el texto fuente.

## Comprobaciones parciales
- 179 identificadores extraídos de `spain-part1.js` a `spain-part4.js`: sin repetición dentro de ese conjunto.
- Los demás archivos tienen patrones diferentes de IDs. Los conteos por regex de candidatos **no** equivalen a cantidades definitivas de instituciones y no prueban ausencia de duplicados.
- `app.js` contiene 9 referencias a `data.length+1` al generar algunos IDs FEDELE. Esos IDs deben migrarse con una tabla de equivalencias persistente, nunca reemplazarse directamente.
- La estrategia experimental `key(name|city|country)` en la rama de pruebas no soporta cambios de nombre, ciudad o país; **no está aprobada para publicación**.

## Siguientes pruebas obligatorias
1. Cargar y decodificar todas las fuentes utilizando la misma lógica de `app.js` en un entorno de pruebas aislado.
2. Extraer IDs efectivos tras la fase de mezcla y enriquecimiento FEDELE.
3. Identificar IDs repetidos, entidades homónimas y conflictos de coordenadas sin borrar registros automáticamente.
4. Exportar correspondencias históricas inmutables de identificador público a identificador canónico antes de cambiar los enlaces.
5. Comprobar enlaces antiguos, favoritos, formularios, filtros y exportaciones en navegador.

Estado: **inventario completado, auditoría de datos parcial**. No modificar los backups.
