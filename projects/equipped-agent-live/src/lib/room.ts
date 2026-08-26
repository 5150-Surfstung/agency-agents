// Room auth. Attendees: PIN once → signed device cookie, no accounts, no
// passwords (house rule). Presenter: a key in the URL they already have.

import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE = "ea_session";

function secret(): string {
  return process.env.LIVE_SESSION_SECRET || "dev-only-secret";
}

export function roomPin(): string {
  return process.env.LIVE_ROOM_PIN || "1054";
}

export function presenterKey(): string {
  return process.env.LIVE_PRESENTER_KEY || "dev-presenter";
}

function sign(deviceId: string): string {
  return createHmac("sha256", secret()).update(deviceId).digest("hex").slice(0, 32);
}

export function mintSession(): { deviceId: string; cookieValue: string } {
  const deviceId = randomUUID();
  return { deviceId, cookieValue: `${deviceId}.${sign(deviceId)}` };
}

export function sessionCookieName(): string {
  return COOKIE;
}

/** Returns the deviceId for a valid session cookie, else null. */
export async function deviceFromCookies(): Promise<string | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return null;
  const dot = raw.lastIndexOf(".");
  if (dot <= 0) return null;
  const deviceId = raw.slice(0, dot);
  const mac = raw.slice(dot + 1);
  const expect = sign(deviceId);
  if (mac.length !== expect.length) return null;
  try {
    if (!timingSafeEqual(Buffer.from(mac), Buffer.from(expect))) return null;
  } catch {
    return null;
  }
  return deviceId;
}

export function isPresenter(key: string | null | undefined): boolean {
  if (!key) return false;
  const expect = presenterKey();
  const a = Buffer.from(key);
  const b = Buffer.from(expect);
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
