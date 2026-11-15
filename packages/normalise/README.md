# @access-tools/normalise

Offline-only, deterministic mapper for the App's open place records. No database,
network calls, geocoding, publishing, or automatic deduplication.

```ts
import { normalise, candidates } from "@access-tools/normalise";

const item = normalise({
  id: "synthetic:1",
  fields: {
    name: { value: "Example Place", source_id: "synthetic-fixture",
      licence: "OGL-Ontario", retrieved_at: "2026-11-15", tier: 1 },
  },
});
// { record: { name: ... }, silo: "open", warnings: [...], sameAsCandidate: "synthetic:1" }
```

Each field retains `{ value | "UNKNOWN", source_id, licence, retrieved_at,
tier, source_key?, raw?, derived? }`. The mapper accepts source aliases for
name, address, coordinates, and a few accessibility keys. Supply provenance per
field or through options; field metadata wins. Unrecognised licences (including
missing licences) are marked `UNKNOWN` and their values held `UNKNOWN`, not
assumed usable. Missing source or retrieval date also holds the value unknown.
The mapper never assigns tiers 2 or 3; request an independent evidence review.
Tier 0 is an unverified draft, not a published fact.

## Licence silo rule

ODbL-derived facts must not be blended into an OGL/CC-derived dataset. If any
input field is ODbL, the return is `silo: "odbl"` and **only ODbL fields** are
returned. Other fields are omitted with explicit warnings. To keep those
fields, independently normalise an open-only input and store its result in a
**separate** `open` chunk. The optional `sameAsCandidate` is the caller's source
record id for human reconciliation, never evidence that two entities are the
same. Do not merge the chunks or copy ODbL values to the open silo. ODbL
redistribution requires ODbL share-alike compliance and attribution:
**© OpenStreetMap contributors, ODbL** where OSM facts are displayed.
Also preserve source, licence, retrieved date, and tier on every displayed fact.

No coordinate is inferred from an address; missing or invalid coordinates
remain `UNKNOWN` or absent and yield a warning. `candidates` uses haversine
proximity (default 30 m) and name similarity, or an identical normalised
address and similar name when neither place has coordinates. It returns only
`{ a, b, reason, score }` for human verification. It never mutates, merges,
confirms accessibility, or changes a record. Unknown must display as
**Unknown / Inconnu**, not an accessibility denial. No ratings or accessibility
scores are produced.

Run package tests with `npm run test -w @access-tools/normalise` when the host
workspace provides Vitest. No extra runtime dependencies.
