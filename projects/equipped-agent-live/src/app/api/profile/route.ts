// NAMING YOUR VAL. A device names its assistant once — "Nova", "Sweet Tea",
// whatever they want — and from then on every vote, guess, shot fired and ring
// score in the room wears that name.
//
// It used to ask for three initials. A name does the same job on THE BOARD and
// does a much better one on the person: thirty seconds after walking in they
// have stopped thinking of it as "an AI" and started thinking of it as theirs.
// The field behind this is still called `initials` end to end — see 007.

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
    // Letters, digits, spaces, hyphens, apostrophes — enough for a name
    // somebody chose, narrow enough that nothing surprising hits a projector.
    initials = String(body?.initials ?? "")
      .replace(/[^a-zA-Z0-9 '-]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 14);
    emoji = String(body?.emoji ?? "").slice(0, 8);
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  if (initials.length < 2) return NextResponse.json({ ok: false, error: "need_name" }, { status: 400 });

  try {
    await getStore().profileSet(sess.roomKey, sess.deviceId, initials, emoji);
    return NextResponse.json({ ok: true, initials, emoji });
  } catch {
    return NextResponse.json({ ok: false, error: "store_error" }, { status: 502 });
  }
}
