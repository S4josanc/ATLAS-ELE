# ATLAS ELE — diagnóstico del bloque comprimido (25 octubre 2026)

Se verificó la existencia de `data/master-pack-0.js` en `main` y en las ramas de respaldo `backup/ATLASELE-Back-up-14.10.26` y `backup/pre-atlas-2-20261020`: **no existe en ninguna de las tres**. En ambos backups sí existe `data/master-pack-1.js`, con el mismo inicio del fragmento 1 de `main`.

`app.js` reconstruye `ATLAS_PACKED_PARTS.join('')` y descomprime con `DecompressionStream('deflate')`. Los archivos disponibles aportan índices 1–7; la auditoría automatizada devuelve `Missing fragment index 0`. Los intentos anteriores de descomprimir esos siete fragmentos con zlib, raw deflate y gzip no dieron resultado.

**Conclusión:** el bloque comprimido no se puede recuperar íntegramente solo con las fuentes encontradas. No inventar un fragmento 0 ni declarar completa la base.

**Acciones seguras:** buscar el origen no versionado del dataset o commits históricos donde se generó el paquete; reconstruir desde una fuente original verificable; conservar los IDs antiguos y probar colisiones antes de activar nuevas altas.

No se han editado ramas backup ni datos públicos.
