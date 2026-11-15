import type { InputRow } from '../types.js';
import { place, value } from '../transform.js';

export function address(row: InputRow) {
  const text = [row.number, row.street, row.city, row.region, row.postcode].map(value).filter(Boolean).join(', ');
  return place({ address: text, latitude: row.LAT ?? row.latitude,
    longitude: row.LON ?? row.longitude, key: value(row.id) || text });
}
