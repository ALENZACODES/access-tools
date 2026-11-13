# access-tools

Libraries for the unbranded Ontario accessibility app (“the App”). This repository does not claim endorsement by Spinal Cord Injury Ontario, a hospital, a ministry, or any other organization.

Lane 6 owns three packages:

- `packages/navigator` — benefits, funding, equipment, employment, housing, and services directory. Records link to official pages retrieved on 13 November 2026. Search and category filters are included. Every record says this is not eligibility advice. No home, workplace, or building is given an accessibility measurement.
- `packages/timing` — optional timing notes the person types (minutes between washroom stops, continuous travel, a rest preference). Washroom stops are supplied by the caller. The package does not look up places, set a clinical default, or offer pressure-relief, catheter, medication, or symptom reminders. Call 911, 9-8-8, and ConnexOntario are shown with no questions first. A nurse advice line number is omitted because it was not re-verified for this build.
- `packages/games` — ten optional activities (memory, attention, flexibility, language, numbers, puzzles, and a quiet count). They work with a keyboard, a single tap, and manual switch controls (Next, then Choose). Relaxed mode has no timer. Scores stay in the Games database and are not health or travel data.

`packages/place`, search, and finders belong to another lane and are not in this branch. The root workspace uses `packages/*`, so those packages can be added later without changing the workspace glob.

French interface copy is included. It should be reviewed by a French-language editor before a public launch. Program rules change. Directory figures are dated 13 November 2026 and should be checked again against the official page.

## Checks

```bash
npm test
npm run typecheck
npm run test:e2e
```
