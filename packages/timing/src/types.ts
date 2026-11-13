export type Language = "en" | "fr";

export interface TimingDocument {
  schemaVersion: "timing-constraints-1.0.0";
  maxTimeBetweenWashroomsMin: number | null;
  maxContinuousTravelMin: number | null;
  restBreakEveryMin: number | null;
  reminderLeadMin: number | null;
  updatedAt: string | null;
}

/** A leg duration supplied by the caller. The label is not a verified place. */
export interface SuppliedLeg {
  id: string;
  label: string;
  durationMin: number;
}

/** A washroom opportunity supplied by the caller. This package does not verify it. */
export interface SuppliedWaypoint {
  id: string;
  label: string;
  minutesFromStart: number;
}

export interface EmergencyPathway {
  id: "call-911" | "suicide-crisis-helpline-988" | "connexontario";
  name: Record<Language, string>;
  action: Record<Language, string>;
  href: string;
  detail: Record<Language, string>;
  sourceUrl: string | null;
  retrievedOn: string | null;
}

export type ReminderKind =
  | "washroom_user_limit"
  | "continuous_travel_user_limit"
  | "rest_break_user_preference";

export interface TimingReminder {
  atMinute: number;
  kind: ReminderKind;
  message: Record<Language, string>;
}

export interface TimingFlag {
  kind: ReminderKind | "no_washroom_supplied";
  message: Record<Language, string>;
}

export interface TimingPlan {
  boundary: Record<Language, string>;
  placesLookedUp: false;
  constraintsSet: boolean;
  unsetNote: Record<Language, string> | null;
  reminders: TimingReminder[];
  flags: TimingFlag[];
  emergencyPathways: EmergencyPathway[];
  healthLine: {
    status: "not_reverified";
    message: Record<Language, string>;
  };
}
