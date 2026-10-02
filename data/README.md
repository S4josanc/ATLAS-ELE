# ATLAS ELE public map data

This folder contains public-safe data derived from the private ATLAS ELE Master Database.

## Current cleaning status
- Master rows: 5,338 institutions
- High-confidence duplicate records removed: 1,934
- Current unique institutions: 3,404
- Categories: 3,124 schools; 175 language schools/ELE centres; 55 universities; 50 official institutions
- Coordinates: geocoding pending

## Privacy
Private/internal email fields, private contacts, internal notes and teacher data are never exported here.
Teachers are added only through voluntary registration.

## Data pipeline
Private Master DB → normalization → deduplication → public-safe export → geocoding → map clusters.
