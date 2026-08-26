// Self-reported ring scores from THEIR OWN Claude (the seed's spar move).
// On their honor — it's a lunch table, not the SEC. Best score per device
// sticks; the board shows top ten.

import { NextRequest, NextResponse } from "next/server";
import { sessionFromCookies } from "@/lib/room";
import { getStore } from "@/lib/store";

export async function POST(req: NextRequest) {
  const sess = await sessionFromCookies();
  if (!sess) return NextResponse.json({ ok: false, error: "join_first" }, { status: 401 });

  let initials = "";
  let score = -1;
  try {
    const body = await req.json();
    initials = String(body?.initials ?? "").replace(/[^a-z]/gi, "").slice(0, 3).toUpperCase();
    score = Number(body?.score);
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  if (initials.length < 2) return NextResponse.json({ ok: false, error: "need_initials" }, { status: 400 });
  if (!Number.isInteger(score) || score < 1 || score > 10) {
    return NextResponse.json({ ok: false, error: "bad_score" }, { status: 400 });
  }

  try {
    await getStore().scorePost(sess.roomKey, sess.deviceId, initials, score);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "store_error" }, { status: 502 });
  }
}
