// The room: consent in, wall out.
//
// The POST is called after the seat already exists, so deciding about the
// wall never stands between somebody and their booking. The GET returns only
// what consent covers — a first name and a brokerage. Full names, cells and
// references never leave through this route.

import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export async function GET() {
  try {
    const wall = await getStore().rsvpWall();
    return NextResponse.json({ ok: true, wall }, { headers: { "Cache-Control": "public, max-age=60" } });
  } catch {
    return NextResponse.json({ ok: false }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  let ref = "", brokerage = "", bringing = "";
  let show = false;
  try {
    const b = await req.json();
    ref = String(b?.ref ?? "").trim().slice(0, 24);
    show = Boolean(b?.show);
    brokerage = String(b?.brokerage ?? "").trim().slice(0, 60);
    bringing = String(b?.bringing ?? "").trim().slice(0, 160);
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  if (!/^EA-[A-Z0-9]{6}$/.test(ref)) {
    return NextResponse.json({ ok: false, error: "bad_ref" }, { status: 400 });
  }
  try {
    const ok = await getStore().rsvpRoom(ref, show, brokerage, bringing);
    return NextResponse.json({ ok });
  } catch {
    return NextResponse.json({ ok: false, error: "store_error" }, { status: 502 });
  }
}
