import { NO_DEFAULT_NOTE, NOT_A_PLACE_LOOKUP, TIMING_BOUNDARY } from "./boundaries.js";
import { constraintsAreSet } from "./document.js";
import { EMERGENCY_PATHWAYS, HEALTH_LINE_NOT_REVERIFIED } from "./emergency.js";
import type {
  SuppliedLeg,
  SuppliedWaypoint,
  TimingDocument,
  TimingFlag,
  TimingPlan,
  TimingReminder,
} from "./types.js";

function both(en: string, fr: string): { en: string; fr: string } {
  return { en, fr };
}

function assertTimeline(legs: SuppliedLeg[], waypoints: SuppliedWaypoint[]): number {
  if (legs.length === 0) {
    throw new Error("Add at least one supplied leg, or ask for pathways only.");
  }
  let total = 0;
  for (const leg of legs) {
    if (!Number.isInteger(leg.durationMin) || leg.durationMin < 1) {
      throw new Error(`Leg "${leg.id}" needs a whole number of minutes, at least 1.`);
    }
    total += leg.durationMin;
  }
  for (const stop of waypoints) {
    if (!Number.isInteger(stop.minutesFromStart) || stop.minutesFromStart < 0 || stop.minutesFromStart > total) {
      throw new Error(`Washroom stop "${stop.id}" must sit between 0 and ${total} minutes.`);
    }
  }
  return total;
}

export function planTiming(
  document: TimingDocument,
  legs: SuppliedLeg[],
  waypoints: SuppliedWaypoint[],
): TimingPlan {
  const total = assertTimeline(legs, waypoints);
  const reminders: TimingReminder[] = [];
  const flags: TimingFlag[] = [];
  const set = constraintsAreSet(document);

  if (document.maxTimeBetweenWashroomsMin != null) {
    const limit = document.maxTimeBetweenWashroomsMin;
    const lead = document.reminderLeadMin ?? 0;
    const marks = [0, ...waypoints.map((stop) => stop.minutesFromStart), total];
    const unique = [...new Set(marks)].sort((a, b) => a - b);
    if (waypoints.length === 0) {
      flags.push({
        kind: "no_washroom_supplied",
        message: both(
          `${NOT_A_PLACE_LOOKUP.en} You set ${limit} minutes between washroom stops. This timeline is ${total} minutes and no stop was supplied.`,
          `${NOT_A_PLACE_LOOKUP.fr} Vous avez inscrit ${limit} minutes entre les arrêts toilettes. Ce trajet dure ${total} minutes et aucun arrêt n'a été fourni.`,
        ),
      });
    }
    for (let index = 0; index < unique.length - 1; index += 1) {
      const from = unique[index] ?? 0;
      const to = unique[index + 1] ?? from;
      const gap = to - from;
      if (gap > limit) {
        flags.push({
          kind: "washroom_user_limit",
          message: both(
            `You set ${limit} minutes between washroom stops. The gap from minute ${from} to minute ${to} is ${gap} minutes. This is your note, not medical advice.`,
            `Vous avez inscrit ${limit} minutes entre les arrêts toilettes. L'écart de la minute ${from} à la minute ${to} est de ${gap} minutes. C'est votre note, pas un avis médical.`,
          ),
        });
        reminders.push({
          atMinute: Math.max(from, from + limit - lead),
          kind: "washroom_user_limit",
          message: both(
            `Your washroom note: ${limit} minutes from the stop at minute ${from}.`,
            `Votre note toilettes : ${limit} minutes depuis l'arrêt à la minute ${from}.`,
          ),
        });
      }
    }
  }

  if (document.maxContinuousTravelMin != null) {
    const limit = document.maxContinuousTravelMin;
    let cursor = 0;
    for (const leg of legs) {
      if (leg.durationMin > limit) {
        flags.push({
          kind: "continuous_travel_user_limit",
          message: both(
            `You set ${limit} minutes of continuous travel. "${leg.label}" is ${leg.durationMin} minutes. The label is not a verified place.`,
            `Vous avez inscrit ${limit} minutes de déplacement continu. « ${leg.label} » dure ${leg.durationMin} minutes. Le libellé n'est pas un lieu vérifié.`,
          ),
        });
        reminders.push({
          atMinute: cursor + limit,
          kind: "continuous_travel_user_limit",
          message: both(
            `Your continuous-travel note would be reached ${limit} minutes into "${leg.label}".`,
            `Votre note de déplacement continu serait atteinte ${limit} minutes après le début de « ${leg.label} ».`,
          ),
        });
      }
      cursor += leg.durationMin;
    }
  }

  if (document.restBreakEveryMin != null) {
    const every = document.restBreakEveryMin;
    for (let minute = every; minute < total; minute += every) {
      reminders.push({
        atMinute: minute,
        kind: "rest_break_user_preference",
        message: both(
          `Your rest preference: a break every ${every} minutes. This is not a pressure-relief timer.`,
          `Votre préférence de repos : une pause toutes les ${every} minutes. Ce n'est pas un minuteur de soulagement de pression.`,
        ),
      });
    }
  }

  reminders.sort((a, b) => a.atMinute - b.atMinute || a.kind.localeCompare(b.kind));

  return {
    boundary: TIMING_BOUNDARY,
    placesLookedUp: false,
    constraintsSet: set,
    unsetNote: set ? null : NO_DEFAULT_NOTE,
    reminders,
    flags,
    emergencyPathways: [...EMERGENCY_PATHWAYS],
    healthLine: HEALTH_LINE_NOT_REVERIFIED,
  };
}
