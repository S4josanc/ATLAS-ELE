# UK address verification — batch 01 (Kent)

Checked: 2026-10-13. These records currently share the regional coordinate `51.2787, 0.5217` in `data/uk-master-seed.js`. No map coordinates have been changed.

| Record ID | Institution | Verified postal address | Evidence | Status |
|---|---|---|---|---|
| UK-MASTER-0002 | Astor Secondary School | Astor Avenue, Dover, Kent, CT17 0AS | [Official school contact](https://www.astorschool.com/6/contact-us); [UK government register](https://get-information-schools.service.gov.uk/Establishments/Establishment/Details/138167) | Postal address verified; precise coordinates pending; Spanish offering pending |
| UK-MASTER-0003 | Barton Court Grammar School | Longport, Canterbury, Kent, CT1 1PH | [UK government register](https://get-information-schools.service.gov.uk/Establishments/Establishment/Details/137474); [Kent council](https://webapps.kent.gov.uk/KCC.SchoolSearch.Web.Sites.Public/SchoolDetails.aspx?SchoolID=55) | Postal address verified; precise coordinates pending; Spanish offering pending |

## Findings
- These two schools are in **different towns** (Dover and Canterbury) despite sharing the same regional coordinate in the current seed data.
- The `city` field in the seed is `Kent` for both records. It is a county, not a town. A later data update should set city to Dover and Canterbury respectively, after checking downstream filters.
- Keep `precision: region` until independent geocoding validates exact positions.
- Do not interpret `verified: true` as confirmation of a street-level location or active Spanish teaching.
- Before including either as a verified ELE/MFL Spanish institution, check the current curriculum on official school sources.

## Next steps
1. Confirm Spanish language provision at each school.
2. Verify geocoded point against the official address.
3. Apply any changes only on this branch, review the map and filters, then merge deliberately.
