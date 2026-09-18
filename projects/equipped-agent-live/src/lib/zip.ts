// A ZIP writer, because claude.ai takes a custom Skill as a zip and this
// build is not adding a dependency to produce one file.
//
// Stored, not deflated: the payload is a few kilobytes of markdown, so
// compression would buy nothing and cost a dependency. Every field below is
// little-endian, per APPNOTE.TXT. The UTF-8 flag (bit 11) is set because the
// skill body has em dashes and curly quotes in it.

function crcTable(): Uint32Array {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
}
const TABLE = crcTable();

function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** DOS time/date. Anything in range works; this pins to a fixed moment so the
 *  same input always produces byte-identical output. */
const DOS_TIME = 0;
const DOS_DATE = (2026 - 1980) << 9 | (1 << 5) | 1;

export function zipOne(path: string, contents: string): Uint8Array {
  const enc = new TextEncoder();
  const nameBytes = enc.encode(path);
  const dataBytes = enc.encode(contents);
  const crc = crc32(dataBytes);
  const n = nameBytes.length;
  const size = dataBytes.length;

  const local = new Uint8Array(30 + n);
  const lv = new DataView(local.buffer);
  lv.setUint32(0, 0x04034b50, true);
  lv.setUint16(4, 20, true);          // version needed
  lv.setUint16(6, 0x0800, true);      // UTF-8 names
  lv.setUint16(8, 0, true);           // stored
  lv.setUint16(10, DOS_TIME, true);
  lv.setUint16(12, DOS_DATE, true);
  lv.setUint32(14, crc, true);
  lv.setUint32(18, size, true);
  lv.setUint32(22, size, true);
  lv.setUint16(26, n, true);
  lv.setUint16(28, 0, true);
  local.set(nameBytes, 30);

  const central = new Uint8Array(46 + n);
  const cv = new DataView(central.buffer);
  cv.setUint32(0, 0x02014b50, true);
  cv.setUint16(4, 20, true);          // version made by
  cv.setUint16(6, 20, true);          // version needed
  cv.setUint16(8, 0x0800, true);
  cv.setUint16(10, 0, true);
  cv.setUint16(12, DOS_TIME, true);
  cv.setUint16(14, DOS_DATE, true);
  cv.setUint32(16, crc, true);
  cv.setUint32(20, size, true);
  cv.setUint32(24, size, true);
  cv.setUint16(28, n, true);
  cv.setUint32(42, 0, true);          // offset of local header
  central.set(nameBytes, 46);

  const localTotal = local.length + size;
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, 1, true);           // entries on this disk
  ev.setUint16(10, 1, true);          // entries total
  ev.setUint32(12, central.length, true);
  ev.setUint32(16, localTotal, true); // central directory offset
  ev.setUint16(20, 0, true);

  const out = new Uint8Array(localTotal + central.length + end.length);
  out.set(local, 0);
  out.set(dataBytes, local.length);
  out.set(central, localTotal);
  out.set(end, localTotal + central.length);
  return out;
}
