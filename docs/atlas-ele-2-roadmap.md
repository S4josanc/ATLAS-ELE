# ATLAS ELE 2.0 — Product architecture proposal

Status: **proposal only**. No live website or institution records changed.

## Vision
ATLAS ELE is both (1) a worldwide directory of institutions teaching Spanish and (2) a voluntary professional network for teachers and organizations. The globe/map remains the primary landing experience.

## Product pillars
### Discover
- 2D/3D map with responsive mobile-first search and filters by country, city, institution type, and location verification status.
- Rich institution pages: official name, postal address, public website, Spanish provision evidence, educational levels, program details, optional approved photo, source URL and last verification date.
- Distinguish `institution_verified`, `spanish_program_verified`, and `location_verified`. A verified institution is **not** necessarily geocoded exactly.
- Country-level coverage statistics must be described as ATLAS directory coverage, not a census.

### Connect
- **Profesores Corazón:** voluntary teacher profiles, granular visibility (country/city/institution), explicit consent and self-service deletion.
- **Claim this institution:** authorized representative requests ownership, with human review and audit log.
- **ATLAS Connect:** optional institutional collaboration listings (Erasmus+, eTwinning, exchanges, joint projects) with moderation and expiry dates.
- **ATLAS Events:** submissions for ELE conferences and training, verified organizer and source, date-based expiry.
- **ATLAS Observatory:** aggregate statistics and quality metrics, not identifiable teacher data.

## Data model (conceptual)
- Institution: stable ID, normalized name, aliases, type, country, region, city, street, postal code, website, program details, public contact fields, source and timestamps.
- Location: lat, lng, precision (`country|region|city|address|exact`), location source, verification date, review status.
- ProgramEvidence: institution ID, Spanish provision type, official URL, date checked, review status.
- TeacherProfile: voluntary user ID, public display name, visibility preferences, consent date, deletion controls.
- Claim: institution ID, applicant, proof, approval state, audit trail.
- Collaboration: institution ID, project type, public description, contacts via protected channel, expiry.
- Event: organizer, venue or online, dates, official URL, moderation state.

## Quality gates before import or publication
1. No destructive rewrite of existing master data; preserve Git history and export snapshot.
2. Validate schema and allowed categories, country/city fields, coordinates in bounds, URLs and encoding.
3. Detect duplicates using stable IDs plus normalized name, city, country, address and website; flag ambiguous pairs for review.
4. No `exact` coordinate unless address and point are corroborated by trustworthy sources.
5. Do not expose private master database contacts, internal notes, or unconsented teacher records.
6. Count unique loaded institutions in a browser test; report mismatches with the README.
7. Verify map, clustering, search, filters, institution detail, desktop and mobile performance before merge.

## Implementation order
**Phase 0 — stabilize**: recover or isolate missing compressed pack part 0; reconcile live count; complete geolocation audit; add automated quality reports.

**Phase 1 — directory experience**: responsive search, institution pages, source and verification badges, correction submission.

**Phase 2 — trusted community**: account system, teacher consent and privacy, claim institution and moderated collaboration board.

**Phase 3 — events and observatory**: curated events, transparent statistics and coverage maps.

## Technical recommendation
The existing GitHub Pages static site can remain the public directory during Phase 0/1. Features requiring accounts, moderation, durable edits, and protected contacts need a secure backend and database. Do **not** put personal teacher records or private API credentials in a public GitHub repository.

## Acceptance criteria for first release
- No regression in current 2D/3D map and filters.
- Data counts reproducible and traceable.
- No approximate coordinates labeled exact.
- Institution corrections do not silently overwrite verified data.
- Mobile search and detail views usable on narrow screens.
- All teacher profiles opt-in with visible privacy and deletion controls.
