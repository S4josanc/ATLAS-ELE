# ATLAS ELE 2.0 — Integration test fixture

This file is **only a test fixture** for institution profile development. It is not imported by the live map.

Source: `data/pilot-city-points.json` in this repository, record `FR-PAR-FGL`. Fields are transcribed from that source, not newly verified with an external authority.

```json
{
  "id": "FR-PAR-FGL",
  "name": "Colegio Español Federico García Lorca",
  "type": "school",
  "country": "France",
  "city": "Paris",
  "address": "53 rue de la Pompe, 75116 Paris",
  "website": null,
  "location": {
    "lat": 48.8651,
    "lng": 2.2777,
    "precision": "address",
    "status": "unreviewed",
    "source_url": null,
    "checked_at": null
  },
  "verification": {
    "institution": "unreviewed",
    "spanish_program": "unreviewed",
    "institution_source_url": null,
    "spanish_program_source_url": null,
    "checked_at": null
  },
  "programs": ["Spanish state school · Primary"]
}
```

## Integration acceptance tests
1. Render the institution's name, city, category, postal address and program as source-reported values.
2. Clearly show that source claims are not independently verified.
3. Omit missing website rather than generating a guessed link.
4. Keep public contact details subject to a privacy/publication review.
5. Do not present the source's `address` precision as an independently verified exact point.
6. Do not modify the public map or seed records when viewing the fixture.
7. Check mobile layout, long names, empty fields and keyboard navigation.
