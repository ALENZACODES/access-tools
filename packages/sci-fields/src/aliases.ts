/**
 * Alias -> canonical catalog id. Extends existing place-contract names rather than forking them.
 * `door_clear_width` is the existing place-contract name; it resolves to `door_clear_width_mm`
 * (same field, unit made explicit). Reconcile with packages/place when both are on one branch.
 */
export const ALIASES: Record<string, string> = {
  door_clear_width: "door_clear_width_mm",
  door_width_mm: "door_clear_width_mm",
  change_table: "adult_change_table",
  ceiling_hoist: "hoist",
  snowbank: "curb_snowbank",
  powerchair_charging: "charging_powerchair",
  washroom_no_purchase: "open_without_purchase",
};
