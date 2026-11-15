# @access-tools/sci-fields

Catalog of spinal-cord-injury-first place fields (measured and observed) that other packages import.
Every field is **UNKNOWN** by default and renders as Unknown / Inconnu. There are no scores, ratings or stars.

## Field ids

`transfer_side`, `transfer_space_mm`, `turning_space_mm`, `adult_change_table`, `hoist`,
`door_clear_width_mm`, `counter_height_mm`, `lighting`, `noise`, `staff_will_help`,
`open_without_purchase`, `staff_refuel`, `approach_step_free`, `approach_surface`,
`approach_notes`, `curb_snowbank`, `charging_powerchair`.

Each entry has EN/FR labels, unit (where measured), allowed values, a profile-need key, an expiry class
(`durable`, `annual`, `visit`, `short`; for J8 to consume later) and a "how this is observed" note that is not advice.
Existing place-contract names are kept as aliases in `src/aliases.ts` (for example `door_clear_width` resolves to
`door_clear_width_mm`); do not add a second name for the same field.

## Facts

`SciFieldFact` uses the standard shape `{ value | "UNKNOWN", source_id, licence, retrieved_at, tier, source_key?, raw?, derived? }`
(plus `field`). Schemas are JSON Schema draft 2020-12, validated with Ajv. This package only creates tier 0 or 1 facts and
never assigns tier 2 or 3. Tier 0 unverified drafts are never shown as facts. Licences: ODbL, OGL-Ontario, OGL-Canada, CC-BY, CC0.

## Where values come from

Community or operator values enter only through the export flow (I9 / J4 / J9). Nothing here infers a value,
and nothing uploads anything.

## Profile (on device only)

Optional: chair width (mm), max slope (%), transfer side, break interval (minutes). No injury level, no clinical
labels, no default break interval. A break reminder reads "every N minutes (set by you)". Tests reject advice or
eligibility wording and catheter / pressure-relief instructions.

## Helpers

`label(id, lang)`, `formatFact(fact, lang)` (source, licence, date, tier; ODbL facts add
"� OpenStreetMap contributors, ODbL"), `unknownFact(id)`, `makeFact(fact)`.

## Tests

`npm test -w @access-tools/sci-fields` (Vitest). No UI is shipped, so there is no Playwright or axe test in this package.
