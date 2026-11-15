# Test fixtures

## wikidata-p2846-ontario.sample.json

- Source: Wikidata Query Service, https://query.wikidata.org/ (SPARQL JSON, `application/sparql-results+json`).
- Content: seven real bindings from the query in `src/query.ts`, committed unchanged.
- Licence: CC0 1.0. Attribution is optional. Source recorded as "Wikidata". An attribution line is not an endorsement.
- Retrieved: 2026-11-15.

## demo-wikidata-edge.json

DEMONSTRATION DATA, not real. Synthetic bindings with fake Q-ids and fake names ("Demo Place 1" to "Demo Place 4"). They exercise an unmapped value, conflicting values for one item, malformed WKT and a missing FR label. They say nothing about any real place.
