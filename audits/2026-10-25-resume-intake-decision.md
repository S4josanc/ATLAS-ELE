# Decisión operativa — reanudar la incorporación de instituciones (25-10-2026)

## Situación técnica comprobada
- `main/app.js` omite deliberadamente la carga de `ATLAS_PACKED_PARTS` cuando falta el índice 0. Por tanto, el paquete incompleto **no forma parte del conjunto cargado por ese código**. Esto no prueba que los registros históricos hayan sido recuperados ni que no haya registros equivalentes en otras fuentes.
- El fragmento 0 no se encontró en `main`, los dos backups examinados ni en los commits históricos muestreados. Recuperarlo sigue pendiente y no se debe fabricar.
- El validador existente todavía bloquea todos los lotes no vacíos mediante `BASELINE_INCOMPLETE`. No debe presentarse como una vía de publicación lista.

## Decisión
Cerrar el incidente como **datos históricos no recuperados**, no como «base íntegramente validada». Congelar esos siete fragmentos para preservarlos. La expansión podrá prepararse usando el conjunto **efectivamente cargado** por la aplicación más una lista de entidades históricas conocidas y una revisión manual; publicación únicamente cuando se demuestre que el lote no presenta conflictos con los registros accesibles ni con el histórico recuperado disponible.

## Control previo a la primera publicación
1. Exportar el conjunto de IDs y nombres efectivos después de la mezcla FEDELE y guardar manifiesto con hash y fecha.
2. Rechazar IDs existentes, nombres normalizados idénticos, instituciones matrices equivalentes, URLs coincidentes y coordenadas inválidas.
3. Mantener una reserva estable de IDs para las altas, sin `data.length+1`.
4. Probar el lote en una rama de desarrollo y verificar las fichas y enlaces antiguos en navegador.
5. Conservar ambas ramas `backup/ATLASELE-Back-up-14.10.26` y `backup/pre-atlas-2-20261020` sin cambios.

## Primer lote en revisión
- University of Malta / Spanish: ya aparece como `MT-UNI-001`; no crear nuevo.
- Azerbaijan University of Languages / Spanish: ya aparece como `AZ-UNI-001`; no crear nuevo.
- Ġ. F. Abela Junior College: pendiente de comprobación contra conjunto efectivo completo y geocodificación documentada.
- Western Caspian University: pendiente de comprobación contra conjunto efectivo completo y geocodificación documentada.

**No hay centros autorizados para publicar en este momento.**
