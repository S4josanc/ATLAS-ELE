# ATLAS ELE 2.0 — Integration smoke-test checklist

Date: 2026-10-14. Scope: audit branch only. This is a **static inspection**, not a completed browser test.

## Static checks completed
- `index.html` references 31 external/local scripts.
- `data/verification-evidence.js` appears before `app.js`.
- The required DOM IDs `map`, `panel`, `detail`, `advancedFilters`, `adminSearch`, `adminType` exist.
- `app.js` contains `show`, `render`, `toggleSaved` and `loadPublicMapData`.
- The evidence registry includes UK-MASTER-0011, UK-MASTER-0013 and UK-MASTER-0014.

## Browser tests still required
- [ ] All local scripts return HTTP 200.
- [ ] No syntax/runtime errors in browser console.
- [ ] The missing `master-pack-0.js` is accounted for; loaded record count matches a reproducible expected count.
- [ ] 2D map loads and cluster markers render.
- [ ] 3D globe loads and switches correctly.
- [ ] Search by country, city and institution works.
- [ ] Institution profile displays escaped text and safe links.
- [ ] Evidence links open the intended official pages.
- [ ] Save/remove in My Atlas persists across reloads.
- [ ] Mobile layout works at 320, 375 and 768 px.
- [ ] Keyboard focus and contrast are usable.
- [ ] No private contacts or unconsented teacher data leak into public files.

## Release decision
**BLOCKED pending browser testing and packed master data investigation.** Do not merge this branch into main based only on static checks.
