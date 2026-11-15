import type { InputRow } from '../types.js';
import { place, value } from '../transform.js';

export function facility(row: InputRow) {
  return place({ name: value(row.name), address: value(row.address), latitude: row.latitude ?? row.lat,
    longitude: row.longitude ?? row.lon, key: value(row.id) || value(row.name), rawScore: row.publisher_score });
}
