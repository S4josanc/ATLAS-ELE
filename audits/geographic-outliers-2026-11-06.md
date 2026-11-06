# ATLAS ELE — auditoría geográfica de sedes (2026-11-06)

## Alcance
Revisión de las 6.414 filas en los 18 archivos `data/spain-verified-*.js`. Para cada municipio con al menos cinco registros se calculó la mediana de latitud y longitud y la distancia haversine de cada ficha a ese punto. Se marcaron desviaciones superiores a 25 km. Esta comprobación no sustituye la geocodificación independiente y puede generar falsos positivos.

## Alertas detectadas: 2

1. **ES-VC-03015208 — PUÇOL**. Ciudad registrada: Puçol. Dirección almacenada: `PD. PUSOL, 8, 03296 Puçol, Comunitat Valenciana, España`. Coordenadas: 38.212933, -0.73269. Distancia a la mediana de Puçol: ~160 km. El código postal 03296 y el topónimo Pusol sugieren una confusión entre Pusol (zona de Elche) y Puçol (Valencia). **Pendiente de contrastar con el código oficial del centro y su sede; no modificar automáticamente.**
2. **ES-CT-08067016 — Escola Ernest Lluch**. Ciudad registrada: L'Hospitalet de Llobregat. Dirección: `ptge. Colom, 19, 08903 L'Hospitalet de Llobregat, Catalunya, España`. Coordenadas: 42.37002, 2.119867. Distancia a la mediana de L'Hospitalet: ~112 km. **Pendiente de contrastar coordenadas con el registro de centros de Cataluña; no modificar automáticamente.**

## Resultado
- Fichas analizadas: **6.414**
- Municipios normalizados: **1.595**
- Alertas >25 km en municipios con cinco o más fichas: **2**
- Correcciones automáticas: **0**
- Centros eliminados: **0**
- IDs modificados: **0**

## Limitaciones y próximos pasos
- Los municipios con menos de cinco fichas no entraron en la prueba; no se puede inferir que sus coordenadas sean correctas.
- Los municipios extensos pueden dar falsos positivos; un error menor de 25 km puede pasar inadvertido.
- Contrastar ambos casos con sus directorios educativos originales y las webs de centro, incluida la posible confusión Puçol/Pusol.
- Añadir controles de consistencia municipio/código postal y contrastes espaciales por fuente oficial antes de publicar más lotes.
- No confundir las 6.414 filas con 6.414 sedes físicamente verificadas ni los 9.136 marcadores históricos con instituciones únicas certificadas.
