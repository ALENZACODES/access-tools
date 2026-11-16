# access-tools

Libraries for the unbranded Ontario accessibility app (“the App”). It is spinal-cord-injury first. This repository does not claim endorsement by any hospital, ministry, or other organization.

## Directory, timing, and games

- `packages/navigator` — benefits, funding, equipment, employment, housing, and services directory. Records use `directory-record-1.0.0` with `verificationTier: "administrator_page"`, the same version and field access-main validates on main (`packages/shared/src/directory.ts`). That field maps to canonical tier `E`. This is not `directory-record-1.1.0`. Every included page was read on 13 November 2026. Pages that were not read, including Providence Care and the March of Dimes application page, are omitted. Call 911 stays on the timing screen. Search and category filters are included. Every record says this is not eligibility advice. No home, workplace, or building is given an accessibility measurement. The same package has a separate links-only paratransit list. Each entry's `retrievedOn` is a UTC calendar date (`YYYY-MM-DD`): the date the official page was read in UTC, not a local clock time. The screen keeps the desk-check tier and also says the entry is unverified by the App. Six entries were read on 14 November 2026 UTC. Para Transpo (Ottawa), MobilityPLUS (Grand River Transit) and GOVA Plus (Greater Sudbury) were read on 16 November 2026 UTC and carry that date. Where a page does not describe a service area, the entry says so. Kingston Access Bus is omitted because the page read gives no booking phone for it.
- `packages/timing` — emergency links only: Call 911 (`tel:911`), Call 9-8-8 (`tel:988`), Text 9-8-8 (`sms:988`), Call ConnexOntario (`tel:+18665312600`), and Text CONNEX to 247247 (`sms:247247?&body=CONNEX`). The same links are on the directory cards. No questions first. Health-aware timing is not in this package.
- `packages/games` — twenty-five games. The first ten are the scope-lock games: Grid Recall, Pair Sequence, Route Planner, Pattern Rules, Word Roots Builder, Number Compare, Focus Flankers, Switch Rules, Shape Assembly, and Order Keeper. The second batch adds nine: Odd One Out, Trail Recall, Mirror Moves, Scale Sense, Jug Measure, Sentence Gap, Letter Mix, Sum Check, and Number Steps. The third batch adds six: Tally Row, Day Hop, Compass Steps, Grid Gap, Group Finder, and Clock Hop. `GAME_LIBRARY` in `packages/games/src/library.ts` is the full list; the hub list, search, filters, Surprise me, and the daily set all read it. The games work with a keyboard, a single tap, manual switch controls (Next, then Choose), and dwell select when it is turned on in the games settings. With dwell select on, resting on a button chooses it, a list moves to its next choice, the search box gets the cursor, and the control that the switch bar's Next has highlighted is chosen after the hold time. A hold starts only after the pointer has moved, so a screen that changes under a still pointer chooses nothing. Play is untimed. Focus Flankers alone has an optional clock that is off by default, counts up, has no limit, and is not saved. The hub shows a daily set of three, practice with no score, and a streak that allows two missed days. The daily set moves three places each date through all twenty-five games, so eight dates in a row show twenty-four games, a ninth reaches the last one, and any twenty-five dates in a row show every game three times. Reduced motion is on by default and the device's own reduced-motion setting is also followed. Focus has a 3px ring in both themes. `healthClaimHits` scans every English and French games string, in the first catalogue, in the second batch's catalogue (which also holds the dwell select strings), and in the third batch's catalogue, for health, therapy, brain-training, and commercial-product wording. Scores stay in the Games database on the device.

French interface copy is included. It should be reviewed by a French-language editor before a public launch. Program rules change. Directory figures are dated 13 November 2026 and should be checked again against the official page.

## Shell adapters

`packages/navigator/src/shell.ts` and `packages/games/src/shell.ts` return results in the shape of access-main's `ModuleResult` (contract 1.1.0), for the `/navigator` and `/games` routes.

- `navigatorShellModule.list(ctx)` returns the directory records unchanged, filtered by `ctx.query` when it is set. `asOf` is the UTC date the pages were read. Live status is `unavailable`.
- `gamesShellModule.list()` returns the ten scope-lock games as activities with `clinicalClaim: false`, `seizureRiskFlash: false`, and `keyboardOperable: true`.

Neither adapter adds a record or a value. The output was checked with access-main's `checkModuleResult` on 14 November 2026.

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

`npm run test:e2e` runs the harness specs in `e2e/` and, as separate Playwright projects with their own demo servers, the browser specs of `packages/employment` (port 4179), `packages/housing` (port 4178), and `packages/auditors` (port 4189). The harness uses port 5173. Each of those packages can still run alone with `npm run test:e2e -w <package>`.

## Post-demo regression audit

`npm run test:e2e` also runs `e2e/regression.spec.ts`, the Day 28 post-demo regression audit for this repository. Each test title carries a check id from `e2e/regression/catalog.ts`. The reporter writes `test-results/regression-audit.md` and `.json`: one row per check, the build identifier, pass or fail, and the reason for any check that is not run here.

- The build identifier is `REGRESSION_BUILD_ID` when it is set, otherwise the git commit of the checkout, marked when there are uncommitted changes.
- A console error or an uncaught page error during a check fails that check.
- A check that was expected here but has no result is listed as not run and blocks the result.
- Demo journeys, the outage reroute, the offline place pack, and the shell profile belong to access-maps and access-main. They are listed as not run here. Earlier evidence is not reused.
- "No regression found here" covers only the checks in this repository. It is not a result for the whole App.

## Third-party notices

Runtime libraries include React (MIT), Ajv (MIT), and idb (ISC). Tests use Vitest (MIT), Testing Library (MIT), Playwright, and axe-core (MPL-2.0). axe-core is linked, not modified. No organisation named in the master plan endorses this repository.
