import { createReadStream } from 'node:fs';
import type { InputRow } from './types.js';

// Character-stream CSV parser: escaped quotes, CRLF and quoted newlines are supported.
export async function* readCsv(path: string): AsyncGenerator<InputRow> {
  let headers: string[] | undefined;
  let cells: string[] = [];
  let field = '';
  let quoted = false;
  let afterQuote = false;
  let first = true;
  const emit = (): InputRow | undefined => {
    const values = [...cells, field];
    cells = [];
    field = '';
    if (!headers) {
      headers = values.map((value, index) => index === 0 ? value.replace(/^\uFEFF/, '') : value);
      if (new Set(headers).size !== headers.length || headers.some(value => !value)) {
        throw new Error('CSV header must contain unique non-empty columns');
      }
      return undefined;
    }
    if (values.length !== headers.length) throw new Error('CSV column count mismatch');
    return Object.fromEntries(headers.map((key, i) => [key, values[i]]));
  };
  for await (const chunk of createReadStream(path, { encoding: 'utf8' })) {
    for (const char of chunk) {
      if (first && char === '\uFEFF') { first = false; continue; }
      first = false;
      if (quoted) {
        if (afterQuote) {
          if (char === '"') { field += '"'; afterQuote = false; continue; }
          quoted = false;
          afterQuote = false;
          // Reprocess the first character following the closing quote.
        } else if (char === '"') { afterQuote = true; continue; }
        else { field += char; continue; }
      }
      if (char === '"') {
        if (field) throw new Error('Invalid CSV quote');
        quoted = true;
      } else if (char === ',') {
        cells.push(field);
        field = '';
      } else if (char === '\n') {
        if (field.endsWith('\r')) field = field.slice(0, -1);
        const row = emit();
        if (row) yield row;
      } else {
        field += char;
      }
    }
  }
  if (quoted && !afterQuote) throw new Error('Unterminated CSV quote');
  if (cells.length || field || afterQuote) {
    const row = emit();
    if (row) yield row;
  }
  if (!headers) throw new Error('Missing CSV header');
}

// Stream a FeatureCollection without loading the feature array into memory.
// Also accepts newline-delimited GeoJSON Features.
export async function* readGeoJson(path: string): AsyncGenerator<InputRow> {
  const stream = createReadStream(path, { encoding: 'utf8' });
  let buffer = '';
  let offset = 0;
  let inArray = false;
  let arrayFound = false;
  let nesting = 0;
  let start = -1;
  let quoted = false;
  let escaped = false;
  for await (const chunk of stream) {
    buffer += chunk;
    if (!arrayFound) {
      const match = /"features"\s*:\s*\[/.exec(buffer);
      if (match) {
        offset = match.index + match[0].length;
        arrayFound = true;
        inArray = true;
      } else if (buffer.length > 4096) {
        throw new Error('Expected GeoJSON FeatureCollection.features array');
      } else continue;
    }
    for (let i = offset; i < buffer.length; i++) {
      const c = buffer[i];
      if (quoted) {
        if (escaped) escaped = false;
        else if (c === '\\') escaped = true;
        else if (c === '"') quoted = false;
        continue;
      }
      if (c === '"') { quoted = true; continue; }
      if (c === '{') {
        if (nesting++ === 0) start = i;
      } else if (c === '}') {
        if (--nesting < 0) throw new Error('Invalid GeoJSON object');
        if (nesting === 0 && start >= 0) {
          const feature = JSON.parse(buffer.slice(start, i + 1)) as {
            type?: string; properties?: InputRow;
            geometry?: { type?: string; coordinates?: unknown };
          };
          if (feature.type !== 'Feature') throw new Error('Expected GeoJSON Feature');
          const coords = feature.geometry?.type === 'Point' ? feature.geometry.coordinates : undefined;
          const point = Array.isArray(coords) && coords.length >= 2
            ? { longitude: coords[0], latitude: coords[1] } : {};
          yield { ...feature.properties, ...point };
          start = -1;
        }
      } else if (c === ']' && nesting === 0 && inArray) { inArray = false; break; }
    }
    // Retain only an unfinished feature, or a small suffix for the next chunk.
    if (!inArray) break;
    if (start >= 0) {
      buffer = buffer.slice(start);
      offset = 0;
      start = 0;
      nesting = 0;
      quoted = false;
      escaped = false;
    } else { buffer = ''; offset = 0; }
  }
  if (!arrayFound || inArray || nesting !== 0 || quoted) throw new Error('Incomplete GeoJSON FeatureCollection');
}

export function readRows(path: string): AsyncGenerator<InputRow> {
  if (/\.csv$/i.test(path)) return readCsv(path);
  if (/\.(geojson|json)$/i.test(path)) return readGeoJson(path);
  throw new Error('Expected a local .csv, .geojson or .json file');
}
