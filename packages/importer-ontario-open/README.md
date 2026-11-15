# Ontario open-data importer (J12)

Offline, local-file importer for **the App**. No fetching, scheduler, server, accounts,
network submission, or automatic publishing. Candidate catalogues for a **future
manual** source review: [Ontario Data Catalogue](https://data.ontario.ca/),
[Ontario GeoHub](https://geohub.lio.gov.on.ca/),
[Canada Open Government](https://open.canada.ca/), and
[OpenAddresses](https://openaddresses.io/). Names on this list are **not**
licence approvals. ServiceOntario sites, facility lists, parks and trails must each
be individually reviewed, and existing D/H-lane and access-maps #1 datasets
must not be re-imported. GeoNames and business-licence lists may supply only
place/address seeds; never use them as accessibility evidence. No data or
licence is supplied by these links.

## Gate and output

A source needs its **own** recorded open licence (ODbL, OGL-Ontario,
OGL-Canada, CC-BY or CC0), confirmation, provenance origin, and an actual
retrieved ISO date. An unconfirmed/non-open licence is held; zero records are
written. Never assume that an entire catalogue shares a licence. ODbL records
are in separate `odbl` partitions with `share_alike: true`; other approved
licences use `open`. Keep partitions separate when distributing data.
Publisher-provided numbers are retained as `raw_publisher_score`, not
converted to access values. Facility, address and business-licence rows do
not assert access; unmentioned values remain **UNKNOWN** (Unknown / Inconnu).
Only explicit adult-change and hoist columns in a **confirmed-open** register
produce tier-1 publisher claims. Unknown columns are tier 0 and cannot be
presented as verified facts. No source receives tier 2 or 3 here.

Local usage (workspace provides TypeScript/tsx and Vitest tooling):

```sh
npx tsx packages/importer-ontario-open/src/cli.ts facility \
  packages/importer-ontario-open/test/fixtures/facility.csv OGL-Ontario \
  confirmed synthetic-fixtures 2026-11-15T12:00:00Z /tmp/ontario-import
```

CLI accepts `facility`, `address`, `adult-change-held`, `adult-change-open`,
followed by local CSV/GeoJSON, licence, `confirmed|unconfirmed`, source ID,
retrieved ISO date, and an output prefix. It writes `PREFIX.SILO.CELL.ndjson`
and prints a JSON run report to stderr. Only provide `confirmed` after
source-specific licence verification; for real runs record the actual retrieved
date and local input origin in each record's provenance. The fixtures are
fictional, **not** assertions about actual Ontario facilities.

Project Sidewalk or Mapillary labels collected outside Ontario must not be
imported as Ontario facts. Never guess coordinates, hoists, step-free access,
or adult-change availability from a name, score or place category.
