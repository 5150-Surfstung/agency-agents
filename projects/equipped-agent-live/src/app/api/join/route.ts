import { NextRequest, NextResponse } from "next/server";
import { mintSession, roomPin, sessionCookieName } from "@/lib/room";

export async function POST(req: NextRequest) {
  let pin = "";
  try {
    const body = await req.json();
    pin = String(body?.pin ?? "").trim();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  if (pin !== roomPin()) {
    return NextResponse.json({ ok: false, error: "wrong_pin" }, { status: 401 });
  }

  const { cookieValue } = mintSession();
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
