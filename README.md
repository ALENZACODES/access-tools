# access-tools

Libraries for the unbranded Ontario accessibility app (“the App”). It is spinal-cord-injury first. This repository does not claim endorsement by Spinal Cord Injury Ontario, a hospital, a ministry, or any other organization.

## Directory, timing, and games

- `packages/navigator` — benefits, funding, equipment, employment, housing, and services directory. Records use `directory-record-1.0.0` with `verificationTier: "administrator_page"`, the same version and field access-main validates on main (`packages/shared/src/directory.ts`). That field maps to canonical tier `E`. This is not `directory-record-1.1.0`. Every included page was read on 13 November 2026. Pages that were not read, including Providence Care and the March of Dimes application page, are omitted. Call 911 stays on the timing screen. Search and category filters are included. Every record says this is not eligibility advice. No home, workplace, or building is given an accessibility measurement. The same package has a separate links-only paratransit list. Each entry's `retrievedOn` is a UTC calendar date (`YYYY-MM-DD`): the date the official page was read in UTC, not a local clock time. The screen keeps the desk-check tier and also says the entry is unverified by the App. OC Transpo Para Transpo is omitted. A retry of https://www.octranspo.com/en/para-transpo/ on 14 November 2026 UTC returned HTTP 403, so that phone and booking link were not recorded.
- `packages/timing` — emergency links only: Call 911 (`tel:911`), Call 9-8-8 (`tel:988`), Text 9-8-8 (`sms:988`), Call ConnexOntario (`tel:+18665312600`), and Text CONNEX to 247247 (`sms:247247?&body=CONNEX`). The same links are on the directory cards. No questions first. Health-aware timing is not in this package.
- `packages/games` — the ten scope-lock games: Grid Recall, Pair Sequence, Route Planner, Pattern Rules, Word Roots Builder, Number Compare, Focus Flankers, Switch Rules, Shape Assembly, and Order Keeper. They work with a keyboard, a single tap, and manual switch controls (Next, then Choose). Play is untimed. The hub shows a daily set of three, practice with no score, and a streak that allows two missed days. Scores stay in the Games database.

French interface copy is included. It should be reviewed by a French-language editor before a public launch. Program rules change. Directory figures are dated 13 November 2026 and should be checked again against the official page.

## Place pages, search, and finders

- `packages/place` — place pages. Every core field from the field catalogue is shown with its value or **Unknown**, plus source, source date, record date, licence, and verification tier. Photograph slots, a correction form, and a report-a-change form are included. Corrections stay on the device as pending and do not change the record.
- `packages/search` — offline full-text and filter search over a place pack. Filters cover transfer side, adult change tables, hoists, Type A bays, charging records, an explicit step-free entrance, and supply category. Unknown does not match a filter. There is no accessibility ranking.
- `packages/finders` — washroom and adult change-table register, accessible parking, wheelchair charging, and repair and supply directory.

Real place records come from **access-maps**. This repository ships **labelled fixtures** only. A fixture is not a real place and not a verified visit. A null field stays unknown.

### Honesty rules in the place, search, and finder code

- Dataset status `labelled-fixture` or `prototype-seed` never renders “Verified by surveyor”.
- A step-free filter matches only an explicit yes.
- A washroom, charging point, or repair listing in the fixture pack is labelled “call ahead” and is not a recommendation.
- Parking privilege text requires a municipality, a bylaw, a statement, and a check date. The list does not claim a bay is free.
- A charging range note uses only a number the user typed. It does not say a route is within range.
- Repair and supply lists publish only the services or categories on the record. They do not recommend a product, a repair, or funding, and they do not give medical advice.

## Master-plan acceptance tests

`packages/acceptance/test/days-1-6.test.tsx` holds one test per Day 1 to 6 pass sentence that this repository can check (D01-6, D03-1 to D03-6, D06-2, D06-3). Each title starts with its check id from the access-help day catalogue. The records are labelled fixtures, so D03-1 stands in for the seeded Toronto data that access-maps provides.

The saved chair type is a flag, not a filter. A power wheelchair adds a note to a place whose entrance is not recorded as step-free. The record stays visible. Every profile note and every hidden reason starts with the profile setting it comes from.

## Checks

```bash
npm install
npm test
npm run typecheck
npm run lint
npm run build
npm run test:e2e
```

Demos, from a package directory:

```bash
npm run demo -w @access-tools/place
npm run demo -w @access-tools/search
npm run demo -w @access-tools/finders
```

Each place, search, and finder demo binds Vite's default port. The interface is in English and French.

## Third-party notices

Runtime libraries include React (MIT), Ajv (MIT), and idb (ISC). Tests use Vitest (MIT), Testing Library (MIT), Playwright, and axe-core (MPL-2.0). axe-core is linked, not modified. No organisation named in the master plan endorses this repository.
