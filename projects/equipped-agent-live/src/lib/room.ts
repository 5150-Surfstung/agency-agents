// Room auth. Attendees: PIN once → signed device cookie that also carries the
// key they joined with, so every later request can prove itself to the
// database's gated functions. No accounts, no passwords (house rule).
// Presenter: a key in the URL they already have.

import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE = "ea_session";

function secret(): string {
  return process.env.LIVE_SESSION_SECRET || "dev-only-secret";
}

/** Local/dev fallbacks — in production the database's live_config row is the
 *  single source of truth, consulted through Store.checkKey. */
export function roomPin(): string {
  return process.env.LIVE_ROOM_PIN || "1054";
}

export function presenterKey(): string {
  return process.env.LIVE_PRESENTER_KEY || "dev-presenter";
}

function mac(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex").slice(0, 32);
}

export interface RoomSession {
  deviceId: string;
  /** The key this device joined with — passed to the DB's gated functions. */
  roomKey: string;
}

export function mintSession(roomKey: string): { deviceId: string; cookieValue: string } {
  const deviceId = randomUUID();
  const keyB64 = Buffer.from(roomKey, "utf8").toString("base64url");
  return { deviceId, cookieValue: `v2.${deviceId}.${keyB64}.${mac(`${deviceId}.${keyB64}`)}` };
}

export function sessionCookieName(): string {
  return COOKIE;
}

/** Returns the session for a valid cookie, else null. */
export async function sessionFromCookies(): Promise<RoomSession | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return null;
  const parts = raw.split(".");
  if (parts.length !== 4 || parts[0] !== "v2") return null;
  const [, deviceId, keyB64, gotMac] = parts;
  const expect = mac(`${deviceId}.${keyB64}`);
  if (gotMac.length !== expect.length) return null;
  try {
    if (!timingSafeEqual(Buffer.from(gotMac), Buffer.from(expect))) return null;
  } catch {
    return null;
  }
  try {
    return { deviceId, roomKey: Buffer.from(keyB64, "base64url").toString("utf8") };
  } catch {
    return null;
  }
}
