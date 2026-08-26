// The jersey. A device picks 2–3 initials and an emoji once; from then on
// every vote, guess, stump question, and ring score in the room wears it.

import { NextRequest, NextResponse } from "next/server";
import { sessionFromCookies } from "@/lib/room";
import { getStore } from "@/lib/store";

export async function POST(req: NextRequest) {
  const sess = await sessionFromCookies();
  if (!sess) return NextResponse.json({ ok: false, error: "join_first" }, { status: 401 });

  let initials = "";
  let emoji = "";
  try {
    const body = await req.json();
    initials = String(body?.initials ?? "").replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase();
    emoji = String(body?.emoji ?? "").slice(0, 8);
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  if (initials.length < 2) return NextResponse.json({ ok: false, error: "need_initials" }, { status: 400 });

  try {
    await getStore().profileSet(sess.roomKey, sess.deviceId, initials, emoji);
    return NextResponse.json({ ok: true, initials, emoji });
  } catch {
    return NextResponse.json({ ok: false, error: "store_error" }, { status: 502 });
  }
}
