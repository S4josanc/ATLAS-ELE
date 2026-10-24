# Revisión piloto — 24 octubre 2026

Origen: Directorio oficial Instituto Cervantes (https://cervantes.org/es/centros-ensenanza).

Se evaluaron diez candidatos mediante `node audits/check-pilot-candidates.mjs` en GitHub Actions run 40074064877. La comprobación de candidatos pasó.

Los diez dieron `possible_existing` por coincidencia de nombre o URL:
- Instituto Cervantes de Los Ángeles
- Aula Cervantes de Seattle
- Instituto Cervantes de Leeds
- Instituto Cervantes de Dakar
- Aula Cervantes de Hanói
- Aula Cervantes de Seúl
- Aula Cervantes de Zagreb
- Aula Cervantes de Liubliana
- Instituto Cervantes de Curitiba
- Instituto Cervantes de Porto Alegre

Decisión: **no incorporar ninguno** sin inspección manual. El cotejo no cubre los datos comprimidos ni registros añadidos dinámicamente por FEDELE, y coincidencia potencial no equivale a confirmación de identidad.

El análisis de la base antigua sigue fallando por el bloque comprimido (índice 0 ausente). No se han tocado instituciones de producción ni backups.
