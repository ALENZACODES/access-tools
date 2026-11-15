/// <reference types="node" />
import { inflateRawSync } from "node:zlib";

/** Parse the central directory; reject unsupported/encrypted entries and ZIP64. */
export function extractGtfs(zip: Uint8Array): { stops: string; feedInfo?: string } {
  const bytes = Buffer.from(zip);
  let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
    if (bytes.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("ZIP central directory missing");
  const count = bytes.readUInt16LE(eocd + 10);
  const offset = bytes.readUInt32LE(eocd + 16);
  if (offset === 0xffffffff || count === 0xffff) throw new Error("ZIP64 not supported");
  let pos = offset;
  const result: { stops?: string; feedInfo?: string } = {};
  for (let i = 0; i < count; i++) {
    if (bytes.readUInt32LE(pos) !== 0x02014b50) throw new Error("Invalid central directory");
    const flags = bytes.readUInt16LE(pos + 8);
    const method = bytes.readUInt16LE(pos + 10);
    const packed = bytes.readUInt32LE(pos + 20);
    const unpacked = bytes.readUInt32LE(pos + 24);
    const length = bytes.readUInt16LE(pos + 28);
    const extra = bytes.readUInt16LE(pos + 30);
    const comment = bytes.readUInt16LE(pos + 32);
    const filename = bytes.subarray(pos + 46, pos + 46 + length).toString("utf8");
    const local = bytes.readUInt32LE(pos + 42);
    pos += 46 + length + extra + comment;
    if (filename !== "stops.txt" && filename !== "feed_info.txt") continue;
    if ((flags & 1) || ![0, 8].includes(method)) throw new Error("Unsupported ZIP entry");
    if (unpacked > 100 * 1024 * 1024) throw new Error("GTFS entry too large");
    if (bytes.readUInt32LE(local) !== 0x04034b50) throw new Error("Invalid local ZIP header");
    const start = local + 30 + bytes.readUInt16LE(local + 26) + bytes.readUInt16LE(local + 28);
    if (start + packed > bytes.length) throw new Error("Truncated ZIP entry");
    const encoded = bytes.subarray(start, start + packed);
    const decoded = method === 8 ? inflateRawSync(encoded, { maxOutputLength: 100 * 1024 * 1024 }) : encoded;
    if (decoded.length !== unpacked) throw new Error("Incorrect ZIP entry size");
    if (filename === "stops.txt") result.stops = decoded.toString("utf8");
    else result.feedInfo = decoded.toString("utf8");
  }
  if (result.stops === undefined) throw new Error("stops.txt missing");
  return { stops: result.stops, ...(result.feedInfo !== undefined ? { feedInfo: result.feedInfo } : {}) };
}
