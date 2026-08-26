// A ladder vote with a name on it. Leads are visible on the console the
// second they land — never digested, never batched. The follow-up standard
// is the same one the hour teaches: first reply before the room empties.

import { NextRequest, NextResponse } from "next/server";
import { deviceFromCookies } from "@/lib/room";
import { getStore } from "@/lib/store";

export async function POST(req: NextRequest) {
  const deviceId = await deviceFromCookies();
  if (!deviceId) return NextResponse.json({ ok: false, error: "join_first" }, { status: 401 });

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

  await getStore().addLead({ deviceId, name, cell, rung, at: Date.now() });
  return NextResponse.json({ ok: true });
}
