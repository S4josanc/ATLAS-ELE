# ATLAS ELE — segundo lote europeo, revisión ampliada (24 octubre 2026)

Se ejecutó la comprobación de candidatos con comparación por institución matriz, ciudad y país (GitHub Actions 40075479842). La etapa de candidatos pasó; la auditoría integral sigue fallando por ausencia de `ATLAS_PACKED_PARTS[0]`.

| Candidato | Resultado contra datos no comprimidos | Decisión |
| --- | --- | --- |
| University of Malta, Department of Spanish and Latin American Studies | Coincide con `MT-UNI-001` (Spanish & Latin American Studies) | No crear nuevo centro; revisar enriquecimiento |
| Ġ. F. Abela Junior College — Spanish | Sin coincidencia nominal detectada | Pendiente de cotejo integral y geolocalización |
| Azerbaijan University of Languages — Spanish Language Centre | Coincide con `AZ-UNI-001` (Spanish Language Center) | No crear nuevo centro; revisar enriquecimiento |
| Western Caspian University — School of Philology and Translation | Sin coincidencia nominal detectada | Pendiente de cotejo integral y geolocalización |

Advertencia: sin coincidencia no significa ausencia confirmada. El análisis no cubre los paquetes codificados ni todos los enriquecimientos dinámicos FEDELE. No generar IDs/latitudes/longitudes de forma especulativa.

Resultado práctico: 2 candidatos probablemente ya existentes, 2 pendientes; 0 altas aprobadas en producción.
