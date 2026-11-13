# access-tools

Libraries for the unbranded Ontario accessibility app (“the App”). This repository does not claim endorsement by Spinal Cord Injury Ontario, a hospital, a ministry, or any other organization.

Lane 6 owns three packages:

- `packages/navigator` — benefits, funding, equipment, employment, housing, and services directory. Records use `directory-record-1.0.0` with `verificationTier: "administrator_page"`, the same version and field access-main validates on main (`packages/shared/src/directory.ts`). That field maps to canonical tier `E`. This is not `directory-record-1.1.0`. Every included page was read on 13 November 2026. Pages that were not read, including Providence Care and the March of Dimes application page, are omitted. Call 911 stays on the timing screen. Search and category filters are included. Every record says this is not eligibility advice. No home, workplace, or building is given an accessibility measurement.
- `packages/timing` — emergency links only: Call 911, call and text 9-8-8, and ConnexOntario call plus text CONNEX to 247247. No questions first. Health-aware timing (washroom intervals, continuous-travel limits, reminders, and their storage) is not in this package.
- `packages/games` — the ten scope-lock games: Grid Recall, Pair Sequence, Route Planner, Pattern Rules, Word Roots Builder, Number Compare, Focus Flankers, Switch Rules, Shape Assembly, and Order Keeper. They work with a keyboard, a single tap, and manual switch controls (Next, then Choose). Play is untimed. The hub shows a daily set of three, practice with no score, and a streak that allows two missed days. Scores stay in the Games database.

`packages/place`, search, and finders belong to another lane and are not in this branch. The root workspace uses `packages/*`, so those packages can be added later without changing the workspace glob.

French interface copy is included. It should be reviewed by a French-language editor before a public launch. Program rules change. Directory figures are dated 13 November 2026 and should be checked again against the official page.

## Checks

```bash
npm test
npm run typecheck
npm run lint
npm run test:e2e
```
