# @access-tools/directory-links

Official link-out directory for the App: benefits and 211 pages, an on-device passenger-assistance profile, and plain links to wheelchair-accessible vehicle and help-line pages. Directory and linking only.

- **Catalog** (`src/catalog.ts`, schema in `src/catalog.schema.json`): each record is `{ id, titleEn, titleFr, url, status, publisher, retrieved_at, licence: "link-out", notesEn, notesFr }`. Any address not confirmed is `url: null` with `status: "needs-verification"` and is never rendered as an anchor (tests enforce this). `retrieved_at` is `null` until a person records a check; the UI shows "not recorded".
- **Profile**: the person types name, mobility notes, attendant yes/no and transfer notes. Nothing leaves the device except files the person exports (JSON or text sheet) or prints. No account, no server.
- **WAV / help lines**: availability is Unknown unless the host passes a sourced `wavFact` (tier 1 or higher; tier 0 is never shown). The package never claims a vehicle is available.
- **211 data is not redistributed here.** A licensed snapshot would be a later importer, and only once a confirmed licence is in the source registry.
- No booking, dispatch, eligibility logic or medical wording. Not affiliated with, endorsed by or partnered with any linked organisation.

## Tests

`vitest run` covers catalog status, link rendering, export shape and copy rules. `test/e2e/axe.spec.ts` runs axe at 320 and 1280 px against the page named in `DIRECTORY_LINKS_URL` and is skipped when that is unset. Later, needs backend: anything involving live 211 data, bookings or payments.
