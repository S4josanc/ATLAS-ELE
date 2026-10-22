# ATLAS ELE — enlaces y calidad de datos (22-10-2026)

## Validaciones efectuadas
- Revisados `data/spain-part1.js` a `data/spain-part4.js` en `main`.
- Se extrajeron 179 identificadores con patrón `ES-######`; los 179 son únicos dentro de estos cuatro archivos. Esto **no** valida el resto de los registros.
- La rama experimental `fix/stable-shares-legacy-compatible-20261022` conserva la búsqueda de enlaces antiguos por `id`, pero las nuevas claves basadas en `name|city|country` **no son verdaderamente permanentes**: si cualquiera de esos campos cambia, cambia la clave.
- No sustituir identificadores antiguos ni publicar esta estrategia de claves como permanente sin un manifiesto persistente de equivalencias.

## Requisitos antes de publicar
1. Generar una tabla de correspondencias `legacy_id → canonical_id` para los registros ya publicados, conservándola entre versiones.
2. Auditar **todos** los archivos de datos y los centros FEDELE añadidos dinámicamente, no solo España parte 1–4.
3. Comprobar unicidad, colisiones, favoritos existentes (`atlasSaved`) y enlaces compartidos antiguos.
4. Probar en navegador las aperturas directas `?institution=...`, búsquedas, favoritos y exportaciones, en móvil y escritorio.
5. Mantener intactas las ramas `backup/ATLASELE-Back-up-14.10.26` y `backup/pre-atlas-2-20261020`.

Estado: auditoría parcial; sin aprobación de despliegue.
