import type {
  Entrance,
  Interior,
  Parking,
  ParkingBay,
  ParkingPrivilege,
  Sourced,
  Transport,
  Washroom,
} from "./types.js";

export function unknown<T>(): Sourced<T> {
  return { value: null, provenance: null, photoSlotIds: [] };
}

export function blankPrivilege(): ParkingPrivilege {
  return {
    municipality: null,
    bylaw: null,
    page: null,
    statement: null,
    checkedOn: null,
  };
}

export function blankEntrance(): Entrance {
  return {
    stepCount: unknown(),
    stepHeightMm: unknown(),
    thresholdHeightMm: unknown(),
    rampPresent: unknown(),
    namedLocation: unknown(),
    streetDirections: unknown(),
    doorClearWidthMm: unknown(),
    doorOperation: unknown(),
    rampGeometry: unknown(),
    rampLengthRise: unknown(),
    elevator: unknown(),
    lightingSignage: unknown(),
    stepFree: unknown(),
  };
}

export function blankWashroom(id: string, name: string): Washroom {
  return {
    id,
    name,
    gender: null,
    attendantAccessNote: null,
    locationAndRoute: unknown(),
    door: unknown(),
    doorClearWidthMm: unknown(),
    turningDiameterMm: unknown(),
    transfer: unknown(),
    grabBars: unknown(),
    seatHeightMm: unknown(),
    sink: unknown(),
    shelfHookSupplies: unknown(),
    privacyLock: unknown(),
    emergencyCord: unknown(),
    changeTable: unknown(),
    hoist: unknown(),
    accessPolicy: unknown(),
    hoursReliability: unknown(),
    hours: null,
  };
}

export function blankInterior(): Interior {
  return {
    routes: unknown(),
    counters: unknown(),
    seating: unknown(),
    sensory: unknown(),
    assistancePolicy: unknown(),
    assistiveListening: unknown(),
    restSpace: unknown(),
  };
}

export function blankParking(): Parking {
  return {
    bays: [],
    route: unknown(),
    surfaceSnow: unknown(),
    payment: unknown(),
    dropOff: unknown(),
    curbCuts: unknown(),
    approachObstacles: unknown(),
  };
}

export function blankTransport(): Transport {
  return {
    nearestStop: unknown(),
    elevatorStatus: unknown(),
    paratransit: unknown(),
    chargingSummary: unknown(),
    repairSupplySummary: unknown(),
    emergencyContacts: unknown(),
  };
}

export function blankBay(id: string, name: string, kind: ParkingBay["kind"]): ParkingBay {
  return {
    id,
    name,
    kind,
    widthMm: unknown(),
    aisleWidthMm: unknown(),
    aisleSide: unknown(),
    surface: unknown(),
    gradient: unknown(),
    distanceToEntranceM: unknown(),
    stepFreeRoute: unknown(),
    snowClearedOn: unknown(),
    signage: unknown(),
    privilege: blankPrivilege(),
    photoSlotIds: [],
  };
}
