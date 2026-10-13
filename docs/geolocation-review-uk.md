# ATLAS ELE — Geolocation quality checks

This branch is for auditing locations before merging changes into the published map.

## Confirmed baseline
- The six UK master seed files contain 1,285 entries with only 58 distinct coordinate pairs.
- The most frequent shared pair is 52.4862, -1.8904 (55 records labeled Birmingham / West Midlands).
- Shared coordinates are **candidates for review**, not evidence that individual institutions are at the same address.
- The UK seed rows do not contain street addresses; `verified: true` must not be interpreted as proof of exact coordinates.
- The public map currently assigns `precision: 'region'` to UK master records.

## Validation rules
1. Keep the original record ID and preserve existing data until independently validated.
2. Check each institution's official website for the current postal address and whether Spanish is offered.
3. Geocode the verified address; compare the coordinates with an independent map source.
4. Mark precision as `exact` only when building-level location is supported by evidence.
5. Store source URL, date checked, and a clear location verification status.
6. Flag potential duplicates by normalized name + city + country + website, but do not delete automatically.
7. Test markers, filters, counts, and mobile layout on a non-production branch before merge.

## High-priority coordinate clusters
| Approximate location | Entries sharing pair |
|---|---:|
| Birmingham / West Midlands (52.4862, -1.8904) | 55 |
| Leicestershire (52.6369, -1.1398) | 37 |
| London (51.5074, -0.1278) | 35 |
| Kent (51.2787, 0.5217) | 30 |
| Hertfordshire (51.8098, -0.2377) | 30 |
| Surrey (51.3148, -0.56) | 30 |
| Hampshire (51.0577, -1.3081) | 30 |
| Essex (51.7343, 0.4691) | 30 |
| Lancashire (53.7632, -2.7044) | 30 |
| Norfolk (52.6139, 0.8864) | 30 |

## Not yet verified
No institution-level addresses or new coordinates have been confirmed in this branch. The missing packed master fragment remains unresolved.
