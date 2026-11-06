# ATLAS ELE public map data

This directory contains the public map datasets. Do not use the old master database count as the current live-map count.

## Inventory status (audit reviewed 2026-11-06)
- Last successful browser inventory (2026-11-04): **9,136 map records / markers**; **9,136 distinct record IDs**. This is a marker count, **not a certified count of unique physical institutions**.
- The 18 `spain-verified-*.js` batches contain **6,414 source rows**, all with distinct official-style IDs, a postal address with five-digit postcode, a syntactically valid HTTP(S) website, and numeric coordinates within Spain.
- Distribution of those 6,414 source rows: Catalonia 2,441; Valencian Community 1,622; Madrid 1,532; Castilla y León 733; Aragón 86.
- Exact duplicate IDs, normalized name + city, normalized address + city, exact website URL, or exact coordinate pairs **within those 6,414 rows**: none found in the 2026-11-06 source-data inspection.
- These checks **do not independently establish** that the school websites are live, that coordinates land on the actual campus, that there are no fuzzy duplicates or that the 6,414 records are all separate physical institutions.
- The browser audit has flagged **56 possible same-name/city/country groups among historical records** for human review; these are not 56 confirmed duplicates.
- The prior 3,404-institution count (5,338 master rows minus 1,934 high-confidence duplicates) is historical and must not be presented as the current live-map total.

## Verification rules
Use official centre IDs where available. Preserve existing IDs and backup files. For each campus verify the exact postal address, location of that physical site and official website. Shared educational domains and rural-school-group websites must not be treated as proof of duplicate campuses. Do not automatically merge or delete homonymous schools or primary/secondary schools at nearby addresses.

## Reproducible inventory
Run `node audits/capture-effective-inventory.mjs` from the repository root in an environment with Playwright and Chrome installed. This captures the **browser-effective** count, possible duplicate groups and coordinate/address matches, and writes `audits/effective-inventory.json`. See the GitHub Actions inventory check for the last successful run. Source-row counts alone are not a substitute for this browser test.

## Privacy
Private/internal email fields, private contacts, internal notes and teacher data are never exported here. Teachers are added only through voluntary registration.
