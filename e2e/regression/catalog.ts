/**
 * Post-demo regression audit, master plan Day 28 (extended prompt 30).
 *
 * Each check is re-run on the build under test. A check owned by another
 * repository is listed with the reason it is not re-run here. Its earlier
 * evidence is not reused.
 */

export type Owner = "access-tools" | "access-maps" | "access-main";

export interface RegressionCheck {
  id: string;
  /** What passes, in plain words. */
  check: string;
  owner: Owner;
  /** Set only when the check is not run in this repository. */
  notRunReason?: string;
}

export const REGRESSION_CHECKS: readonly RegressionCheck[] = [
  {
    id: "R28-01",
    check: "Washroom finder lists records with transfer, change table, hoist, tier, and Unknown for gaps, and never says verified by surveyor.",
    owner: "access-tools",
  },
  {
    id: "R28-02",
    check: "Parking finder shows the privilege rule and does not claim a bay is free now.",
    owner: "access-tools",
  },
  {
    id: "R28-03",
    check: "Equipment profile saves, survives a reload, and is deleted only after confirmation.",
    owner: "access-tools",
  },
  {
    id: "R28-04",
    check: "Keyboard input: Pair Sequence finishes one round with Enter only, and no clock runs.",
    owner: "access-tools",
  },
  {
    id: "R28-05",
    check: "Single-tap input: Number Compare finishes one round with pointer taps only.",
    owner: "access-tools",
  },
  {
    id: "R28-06",
    check: "Switch input: Grid Recall finishes one round with Next and Choose only.",
    owner: "access-tools",
  },
  {
    id: "R28-07",
    check: "A game starts and finishes with the network disabled.",
    owner: "access-tools",
  },
  {
    id: "R28-08",
    check: "Directory says it is not eligibility advice, and Timing shows Call 911 with no washroom interval field.",
    owner: "access-tools",
  },
  {
    id: "R28-09",
    check: "Finders and games switch to French, set the page language, and pass axe.",
    owner: "access-tools",
  },
  {
    id: "R28-10",
    check: "The three demo journeys plan end to end.",
    owner: "access-maps",
    notRunReason: "The journey engine is in access-maps. Re-run it there on the same build.",
  },
  {
    id: "R28-11",
    check: "The outage reroute offers an alternative or an honest no-alternative statement.",
    owner: "access-maps",
    notRunReason: "Outage records and rerouting are in access-maps. Re-run it there on the same build.",
  },
  {
    id: "R28-12",
    check: "The offline place pack downloads, opens offline, and deletes.",
    owner: "access-main",
    notRunReason: "The offline pack is in the access-main shell. Re-run it there on the same build.",
  },
  {
    id: "R28-13",
    check: "The shell profile flows save, export, and delete.",
    owner: "access-main",
    notRunReason: "The shell profile is in access-main. This repository re-runs only the equipment profile (R28-03).",
  },
];

/** Every console error and page error seen during a check fails that check. */
export const CONSOLE_RULE = "A console error or an uncaught page error during a check fails the check.";
