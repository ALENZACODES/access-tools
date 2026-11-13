/**
 * Prototype scope lock, master plan Part 5.
 * The prototype does not include a health profile, a bladder or bowel schedule,
 * or health-aware timing. Those limits stay out until a clinical review.
 *
 * This flag is off. The prototype UI does not render washroom-interval,
 * continuous-travel, or rest-break fields, and it does not call the planner.
 * Do not turn the flag on in the prototype.
 */
export const HEALTH_AWARE_TIMING_ENABLED = false as const;
