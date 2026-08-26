import { NextRequest, NextResponse } from "next/server";
import { mintSession, sessionCookieName } from "@/lib/room";
import { getStore } from "@/lib/store";

export async function POST(req: NextRequest) {
  let pin = "";
  try {
    const body = await req.json();
    pin = String(body?.pin ?? "").trim();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  // The database (or local defaults in dev) is the judge — the app holds no pin.
  let role = null;
  try {
    role = await getStore().checkKey(pin);
  } catch {
    return NextResponse.json({ ok: false, error: "store_unreachable" }, { status: 502 });
  }
  if (!role) {
    return NextResponse.json({ ok: false, error: "wrong_pin" }, { status: 401 });
  }

  const { cookieValue } = mintSession(pin);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(sessionCookieName(), cookieValue, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 12, // the room lives for a day of lunches
    path: "/",
  });
  return res;
}
