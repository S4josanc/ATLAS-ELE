# Identificadores permanentes y enlaces directos (19 de octubre de 2026)

Base auditada: `6a97b83246f0647f8253da8c115d66198f695191`. Desde el commit que introdujo los enlaces (`d9194b7`), solamente cambió el parámetro de caché de app.js en index.html; los datos y el cargador son los mismos.

## Resultado y transición

Nueve bucles FEDELE generaban IDs con `data.length + 1`. Hay 131 filas de fuente: 48 crean fichas con IDs posicionales y las restantes enriquecen fichas existentes. El inventario completo de las 131 relaciones está en `tests/fixtures/fedele-identities.json`.

Se fija el ID actual como valor literal `institutionId` en cada fila de origen, incluso cuando esa fila completa una ficha de otra fuente. Los números antiguos pasan a ser etiquetas opacas e inmutables: **no se recalculan**. No hace falta un redireccionamiento ni cambiar URLs, favoritos, exportaciones o parámetros: todos conservan exactamente los mismos IDs. Los enlaces nuevos usan esos mismos identificadores permanentes.

El cargador une ahora cada fila FEDELE a su ID explícito. No vuelve a decidir su identidad por coincidencias parciales de nombre y ciudad. Esto también permite corregir nombres, webs o ubicaciones sin cambiar el enlace. No se han cambiado las reglas de enriquecimiento ni los datos de ubicación: el hash del conjunto completo de 2.391 fichas antes y después es idéntico, en el mismo orden, incluidos todos sus campos.

Los demás conjuntos cargan IDs literales (`a[0]` o `id` del JSON). La asociación `ES-FEDELE-001` ya era fija. Las solicitudes y perfiles de profesores usan marcas de tiempo, no posiciones de carga; su persistencia es otro asunto fuera de esta transición.

## Mantenimiento

- Conservar `institutionId` al mover una fila de archivo o grupo, editarla o actualizar sus datos. El formato conserva las columnas existentes: `Object.assign([...], {institutionId: 'ID permanente'})`.
- Para un centro nuevo, asignar una vez un UUID con prefijo `INST-` (por ejemplo, con `node -p "'INST-'+require('node:crypto').randomUUID()"`), guardarlo junto a la fila y comprobar que no exista en todo el catálogo. No derivarlo del nombre, URL, dirección, coordenadas ni índice.
- Si la fila corresponde a una institución ya existente, usar su ID actual revisado. Compartir ID entre filas solo significa enriquecer la misma institución, nunca dos centros distintos.
- Al importar una nueva edición de una fuente, conservar las identidades mediante la correspondencia revisada; no reemplazar las filas con arrays que pierdan esta propiedad. Una fila FEDELE sin identidad genera un error explícito.
- No reutilizar ni renumerar IDs. Si en el futuro se fusionan fichas con IDs públicos diferentes, añadir un mapa de alias explícito y probado antes de retirar uno. No hay tal fusión en esta propuesta.
- Ejecutar las pruebas y revisar cualquier cambio del inventario. No regenerar el inventario ni el hash de referencia automáticamente para hacer pasar una prueba fallida.

## Verificación

`node --test tests/institution-links.test.cjs` (Node 24, sin dependencias externas). CI repite estas pruebas en pull requests y main.

Se ejecuta la función real `loadPublicMapData`, con todos los scripts de datos locales en el orden de index.html. Solo se simulan DOM, red y mapa; se comprueba el objeto entregado a `show` y las coordenadas entregadas a `flyTo`.

Las pruebas cubren: igualdad de todas las fichas antes/después; unicidad de IDs; las 131 correspondencias; nuevas filas anteriores a FEDELE; reordenación y traslado entre fuentes; corrección de datos conservando ID; apertura de los 48 enlaces históricos posicionales; ID estable preexistente; URL desconocida; URL compartida y codificación; rechazo de filas sin ID; carga de una fuente empaquetada válida actualizada.

Límite descubierto: index.html carga las partes empaquetadas 1–7 pero no la 0. La descompresión falla y la aplicación continúa con 2.391 fichas. Se reproduce el mismo comportamiento en la referencia y en la propuesta, sin alterar ese problema previo. También se prueba una fuente empaquetada sintética válida para verificar que añadir esa fuente no desplace los IDs fijados. No se ha validado visualmente en navegador ni se afirma que haya enlaces rotos actuales. La garantía histórica cubre los datos versionados desde la introducción de los enlaces; no se pueden reconstruir estados locales no conservados.

## Las 48 fichas antes identificadas por posición

| ID conservado | Institución | Ciudad | País |
| --- | --- | --- | --- |
| ES-FEDELE-A-2344 | Enforex Málaga | Málaga | Spain |
| ES-FEDELE-A-2345 | Enforex Granada | Granada | Spain |
| ES-FEDELE-B-2346 | Escuela Hispalense | Cádiz | Spain |
| ES-FEDELE-B-2347 | Tenidiomas | Cádiz | Spain |
| ES-FEDELE-B-2348 | Linguaschools Granada | Granada | Spain |
| ES-FEDELE-B-2349 | Proyecto Español Granada | Granada | Spain |
| ES-FEDELE-B-2350 | Enforex Sevilla | Sevilla | Spain |
| ES-FEDELE-B-2351 | Idiomas Carlos V Sevilla | Sevilla | Spain |
| ES-FEDELE-BCN-2352 | BCN Lip | Barcelona | Spain |
| ES-FEDELE-BCN-2353 | don Quijote Barcelona | Barcelona | Spain |
| ES-FEDELE-BCN-2354 | Escuela Mediterráneo IH Barcelona | Barcelona | Spain |
| ES-FEDELE-BCN-2355 | Olé Languages Barcelona | Barcelona | Spain |
| ES-FEDELE-BCN-2356 | Speakeasy BCN | Barcelona | Spain |
| ES-FEDELE-CYL-2357 | DICE Salamanca | Salamanca | Spain |
| ES-FEDELE-CYL-2358 | don Quijote Salamanca | Salamanca | Spain |
| ES-FEDELE-MAD-2359 | VAMOS Madrid | Madrid | Spain |
| ES-FEDELE-CV-2360 | TLCdénia | Dénia | Spain |
| ES-FEDELE-CV-2361 | TOP School | Alicante | Spain |
| ES-FEDELE-CV-2362 | don Quijote Valencia | Valencia | Spain |
| ES-FEDELE-INT-2363 | Pamplona Spanish Institute | Pamplona | Spain |
| ES-FEDELE-INT-2364 | El Aula Azul | San Sebastián | Spain |
| ES-FEDELE-INT-2365 | Lacunza IH San Sebastián | San Sebastián | Spain |
| ES-FEDELE-INT-2366 | don Quijote Tenerife | Tenerife | Spain |
| ES-FEDELE-AUD-2367 | Academia AIFP | Málaga | Spain |
| ES-FEDELE-AUD-2368 | Enforex Marbella | Marbella | Spain |
| ES-FEDELE-AUD-2369 | III Language Schools | Málaga | Spain |
| ES-FEDELE-AUD-2370 | MaestroMío | Málaga | Spain |
| ES-FEDELE-AUD-2371 | Spanish Language Center Marbella | Marbella | Spain |
| ES-FEDELE-AUD-2372 | Centro de Estudios Plaza de las Flores | Málaga | Spain |
| ES-FEDELE-AUD-2373 | Academia Avenida al Español | Málaga | Spain |
| ES-FEDELE-AUD-2374 | Hablantis Centro Internacional de Idiomas | Málaga | Spain |
| FEDELE-INTL-2375 | Hispanic Horizons | Mumbai | India |
| FEDELE-INTL-2376 | Sin Fronteras | Almaty | Kazakhstan |
| FEDELE-INTL-2377 | Espoir Langues | Casablanca | Morocco |
| FEDELE-INTL-2378 | Instituto Alborz | Tehran | Iran |
| FEDELE-INTL-2379 | ESP Club Moscú | Moscow | Russia |
| FEDELE-INTL-2380 | Instituto Hispano Brasileiro | São Paulo | Brazil |
| FEDELE-INTL-2381 | Cultura Española | São Paulo | Brazil |
| FEDELE-INTL-2382 | Modern School of Languages | New Delhi | India |
| FEDELE-INTL-2383 | La Mancha | Warsaw | Poland |
| FEDELE-INTL-2384 | Diálogo | Warsaw | Poland |
| FEDELE-INTL-2385 | Academia de Español | New Delhi | India |
| FEDELE-INTL-2386 | La Española Taalinstituut | The Hague | Netherlands |
| FEDELE-INTL-2387 | Casa de España | Warsaw | Poland |
| FEDELE-INTL-2388 | Spanish & Arabic World Center | Manama | Bahrain |
| FEDELE-INTL-2389 | Centro de estudios hispánicos Maria Barbero | Athens | Greece |
| FEDELE-INTL-2390 | Picasso Academy | Casablanca | Morocco |
| FEDELE-INTL-2391 | I.T.E. Tecnico Economico A. De Viti De Marco | Triggiano | Italy |
