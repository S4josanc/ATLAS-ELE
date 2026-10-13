# Institution profile — migration guide (v1)

The proposed schema is in `schemas/public-institution-v1.schema.json`. This is a **future public record format**, not a replacement for the live source arrays.

## Safe migration
1. Read existing arrays without rewriting them.
2. Map `id,name,type,city,country,lat,lng,web` to the new format.
3. Preserve `verified: true` as a **legacy flag only**; do not automatically mark institution, Spanish program, or location as verified.
4. Preserve legacy `precision` as the claimed precision but set `location.status: unreviewed` until checked.
5. Set absent postal addresses, URLs and evidence links to null. Never guess.
6. Resolve duplicate candidates manually, retaining IDs and provenance.
7. Generate a validation report before exporting a public dataset.
8. Keep teacher profiles and private/internal contact fields entirely outside the public dataset.

## Example — illustrative only, not a verified institution
```json
{
  "id": "EXAMPLE-001",
  "name": "Example Spanish Learning Centre",
  "type": "language",
  "country": "Example Country",
  "city": "Example City",
  "address": null,
  "postal_code": null,
  "website": null,
  "location": {
    "lat": null,
    "lng": null,
    "precision": "unknown",
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
  }
}
```

## Release gate
Do not replace the current map loader until a sample export validates, all current categories map correctly, and the public map passes desktop/mobile regression tests.
