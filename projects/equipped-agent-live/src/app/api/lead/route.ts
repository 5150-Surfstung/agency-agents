// A ladder vote with a name on it. Leads are visible on the console the
// second they land — never digested, never batched. The follow-up standard
// is the same one the hour teaches: first reply before the room empties.

import { NextRequest, NextResponse } from "next/server";
import { notifyLead } from "@/lib/notify";
import { sessionFromCookies } from "@/lib/room";
import { getStore } from "@/lib/store";

export async function POST(req: NextRequest) {
  const sess = await sessionFromCookies();
  if (!sess) return NextResponse.json({ ok: false, error: "join_first" }, { status: 401 });

  let name = "";
  let cell = "";
  let rung = "";
  try {
    const body = await req.json();
    name = String(body?.name ?? "").trim().slice(0, 80);
    cell = String(body?.cell ?? "").trim().slice(0, 24);
    rung = String(body?.rung ?? "").trim().slice(0, 60);
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  if (!name || !cell) {
    return NextResponse.json({ ok: false, error: "need_name_and_cell" }, { status: 400 });
  }

  try {
    await getStore().addLead(sess.roomKey, { deviceId: sess.deviceId, name, cell, rung, at: Date.now() });
    notifyLead({ name, cell, rung }); // fire-and-forget; capture never waits on a text
    return NextResponse.json({ ok: true });
  } catch {
    // A lead that didn't persist must never look captured.
    return NextResponse.json({ ok: false, error: "store_error" }, { status: 502 });
  }
}
