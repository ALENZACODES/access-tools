# Access auditor and venue-owner rules — English

This is a **demonstration only**, not a legal opinion, service agreement, certified audit or ownership verification. The App does not operate a real auditor cohort, authenticate owners or run a correction service. Everything described here happens on the device, and the sample records are labelled fixtures.

## Audit record

An audit of a place is a set of field observations. Each observation holds a measured value in millimetres or **Unknown**, the observer's role, a local observer identifier, the observation date, an optional photo reference, and its source, licence and record date. A photo reference is a local identifier, a file name, a description and a date. **No image leaves the device.** Unknown is never read as zero.

## Verification tiers

The tiers are the canonical ones in `packages/place/src/types.ts`: 0 (not independently checked), 1 (reported), 2 (corroborated), 3 (documented field survey), 4 (expiring live status) and E (official-page desk check). This package does not define a second list. A field audit can reach tiers 0 to 3 under these rules (`src/observations.ts`):

- Unknown, or no observation, is tier 0.
- One observation on its own is tier 1 at most, whoever made it.
- Tier 2 needs measurements from two different observers that agree within the configured tolerance (default 10 mm). Two entries from the venue operator do not corroborate each other.
- Tier 3 needs a trained auditor's measurement with a photo reference, a method and a protocol version, accepted in review by a different person. An unreviewed observation never reaches tier 3. An observation rejected in review is not used.
- A later observation that disagrees does not replace the value. The field is marked contested and needs a re-check.

Every record in this package keeps the label `PROTOTYPE-UNVERIFIED`, whatever tier the rules give it. Training ticked on the device is self-declared, and no independent review happens on the device, so an entry made here cannot reach tier 3.

## Freshness decay

The windows are the ones in `packages/place/src/staleness.ts`: 180 days for tier 1, 180 days for tier 2 (90 days for washroom fields) and 365 days for tier 3. After 75% of its window a field is marked as ageing. After the window, the observation stops supporting that tier: the field drops tier, the last value stays visible and is marked stale, and a re-check is needed. Only a new observation restores a tier. Nothing is promoted because time passes.

## Auditor programme

Six self-declared training steps must be ticked before a task can be taken. The task queue lists re-checks first, then ageing or stale fields, then first audits, oldest first. A task closes only with an observation by the person who took it, and Unknown is a valid result. Progress is shown as counts of completed tasks and fields recorded. There are no points, ranks or standings; Unknown counts the same as a measurement; repeating an entry adds nothing; rejected entries and sample records are not counted. No training cohort or partner organisation is assumed.

## Venue responses

A venue sees the barrier reports for its own place and can acknowledge a report, say it is fixed (with the date), or dispute it (with a reason). A response never changes an observation or a tier. "Fixed" and "dispute" create a pending re-check task; the record changes only when a re-check observation is recorded. Claiming a venue in this demonstration does not prove ownership.

## Correction workflow and service levels

1. Every correction or report is **received** with a time stamp and keeps a full history of state, actor and time.
2. It is **triaged**, then sent to **re-check** with a re-check task, then **resolved** or **declined**. Declining needs a reason. Resolving needs the observations from the re-check.
3. **Proposed targets**, held as configuration (`DEFAULT_SERVICE_LEVELS`): 5 calendar days to triage, 10 to start the re-check, 30 to close. These are design targets, not a service commitment.
4. Due dates and overdue flags are computed from the history and the targets.
5. The summary is computed only from reports entered on the device. It counts missed targets and overdue reports and never hides them. With no reports it says "No data yet" and shows no figures. Sample records are never counted.

Browser storage is demonstration-only and can be cleared. Do not enter personal medical details.
