# Essentials finder (the App)

A local, read-only specialist glance at wheelchair washrooms, accessible parking,
adult change tables, hoists, washrooms open without a purchase, fuel-station staff
refueling and charging. No competitor venue data or third-party map tiles are used.
Community and operator values arrive via **I9 export** and **J1 sci-fields**; this
package neither collects nor uploads contributions. OSM write-back, if needed, is
an export submitted manually by a person, not an API action.

`findEssentials(records, { registry, filters, origin?, radiusKm? })` accepts a list,
synchronous iterator or async iterator. `EssentialsFinder` is a keyboard-accessible
React 18/19 list with English and French text; the host supplies already-loaded
regional records. Nothing here is included in service-worker precache.

The source registry must explicitly confirm the source licence. Unconfirmed,
held or missing-licence records are excluded. Only ODbL, OGL-Ontario,
OGL-Canada, CC-BY and CC0 are accepted. **ODbL is share-alike**: keep its
source records/chunks in an independent silo from OGL/CC data, including exports.
Never combine the underlying datasets into a relicensed derivative. This finder
may present results together without changing their provenance.

Missing fields, tier-0 unverified drafts, or facts with missing/unconfirmed
provenance remain Unknown; Unknown does not pass a must-have yes/no filter.
A zero-match result only says no **known** match in the selected radius. Facts
shown in the list carry source, licence, fetched date and tier. Tier 2 or 3
must come from upstream evidence and is never conferred here. Distances are
calculated locally from source coordinates and do not imply current conditions.

Integration verification: run Vitest with the host toolchain, and run the host
Playwright + axe-core accessibility suite at viewport widths 320 and 1280.
This isolated package does not assert a passing audit without running it.
