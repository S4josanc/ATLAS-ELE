# ATLAS ELE — auditoría postal y espacial (2026-11-06)

## Alcance y método
Se han leído 6.414 fichas de 18 archivos `spain-verified-*.js`. Para cada ficha se comparó el prefijo provincial de su código oficial con el del código postal de la dirección y con las provincias de su comunidad autónoma. Para cada combinación municipio normalizado + código postal con tres o más fichas se calculó la mediana de latitud y longitud y la distancia aproximada de cada sede a esa mediana. Se señalaron desviaciones superiores a 5 km.

## Resultados reproducidos
- Fichas: **6.414**; coincidencia de prefijo provincial entre código oficial y postal: **6.414/6.414**; discordancias provinciales: **0**.
- Grupos municipio + código postal: **1.999**.
- Alertas espaciales a más de 5 km en grupos con al menos tres fichas: **24**. Son alertas, no 24 errores confirmados.
- Casos prioritarios:
  - `ES-CT-08067016` Escola Ernest Lluch, L'Hospitalet de Llobregat: 42.37002, 2.119867, dirección `ptge. Colom, 19, 08903`; desviación ~110,7 km respecto al grupo postal 08903.
  - `ES-AR-22003252` Colegio Santa Ana, Monzón: 41.8041648, -0.0217436, dirección `Avenida del Pilar, 6, 22400`; desviación ~20,9 km respecto al grupo postal 22400.
  - `ES-CT-08075670` Institut Escola Trinitat Nova: dirección `c. Pedrosa, 16, 08001 Barcelona`, coordenadas 41.4487, 2.184567; desviación ~7,6 km. **Posible código postal incorrecto**, comprobar en registro oficial.
  - `ES-CT-08075657` Institut Escola Antaviana: dirección `c. Nou Barris, 12, 08001 Barcelona`, coordenadas 41.44835, 2.177835; desviación ~7,4 km. **Posible código postal incorrecto**.
  - `ES-CT-08072292` Institut Escola Turó de Roquetes: dirección `c. Alcàntara, 22, 08001 Barcelona`, coordenadas 41.44627, 2.172814; desviación ~7,2 km. **Posible código postal incorrecto**.
  - `ES-VC-03015208` PUÇOL: dirección `PD. PUSOL, 8, 03296 Puçol`; código 03 y coordenadas 38.212933, -0.73269 indican Alicante, mientras la ciudad indicada es Puçol (Valencia). **Posible confusión Pusol/Elche con Puçol/Valencia**. Esta anomalía se detectó en la auditoría municipal anterior y no necesariamente aparece en la agrupación postal.
- Otros casos distantes (p.ej. colegios rurales, urbanizaciones, municipios extensos) pueden ser sedes perfectamente válidas: no corregir solo por distancia.

## Acciones seguras
No se han cambiado registros ni identificadores. Verificar en el directorio educativo original el municipio y CP de PUÇOL, la ubicación de Escola Ernest Lluch y Colegio Santa Ana de Monzón, y los códigos postales de las tres escuelas de Nou Barris antes de modificar el mapa. Repetir auditoría del navegador tras cualquier corrección. Los datos actuales NO certifican todas las ubicaciones físicas.
