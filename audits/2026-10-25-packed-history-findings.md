# ATLAS ELE — búsqueda histórica de la base comprimida (25-10-2026)

Se consultó el historial de commits de `S4josanc/ATLAS-ELE` buscando `master-pack`, `compress` y `master data`.

Hallazgos verificados:
- Los commits `aa0ee2179`, `63b23fc51`, `462533e49`, `60dfb9cc6`, `b15499eb9`, `f6d56fe4e` y `045f75796` añaden las partes numeradas del 1 al 7; no se ha localizado `data/master-pack-0.js` en las revisiones comprobadas.
- `data/master-loader.js` existe en `main` con `window.ATLAS_MASTER_COMPRESSED='eJwDAAAAAAE='`; parece un placeholder y no constituye la base original.
- `data/master-pack-6a.js` existe en `main` y define `window.ATLAS_INDEPENDENT_PACKS[0]`, una serie distinta de `ATLAS_PACKED_PARTS`.
- `app.js` no referencia `ATLAS_INDEPENDENT_PACKS` ni `ATLAS_MASTER_COMPRESSED`, por lo que no se debe mezclar ese paquete independiente con los fragmentos 1–7 ni afirmar que restaura su índice 0.

**Conclusión:** la reconstrucción de la base comprimida principal permanece pendiente. Antes de usar paquetes históricos adicionales, inspeccionar sus estructuras y procedencia, confirmar IDs originales y ejecutar pruebas de duplicados contra los registros actuales. No modificar datos de producción ni los dos backups protegidos.
