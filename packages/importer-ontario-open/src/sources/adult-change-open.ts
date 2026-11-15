import type { InputRow } from '../types.js';
import { place, value } from '../transform.js';

export function adultChangeOpen(row: InputRow) {
  const result = place({ name: value(row.name), address: value(row.address),
    latitude: row.latitude, longitude: row.longitude, key: value(row.id) || value(row.name),
    rawScore: row.publisher_score });
  if (!result) return null;
  // Only the explicit publisher columns are eligible; absence is UNKNOWN.
  result.explicit = { adult_change: row.adult_change, hoist: row.hoist };
  return result;
}
