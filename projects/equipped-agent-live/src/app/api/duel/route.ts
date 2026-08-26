// THE DUEL. The room fires at each other's REAL assistants. GET returns the
// roster of targets; POST flags a shot as "it made that up" — a human claim,
// sent to the stage to judge, never a verdict the machine issues itself.
// (The shot itself goes through /api/ask with duel:true so one code path
// answers strangers and rivals alike.)

import { NextRequest, NextResponse } from "next/server";
import { DECK } from "@/lib/deck";
import { sessionFromCookies } from "@/lib/room";
import { getStore } from "@/lib/store";

export async function GET() {
  const sess = await sessionFromCookies();
  if (!sess) return NextResponse.json({ ok: false, error: "join_first" }, { status: 401 });
  try {
    const store = getStore();
    const roster = await store.assistantRoster(sess.roomKey);
    // You cannot shoot at your own — the point is defending yours, not gaming it.
    return NextResponse.json({
      ok: true,
      roster: roster
        .filter((r) => r.deviceId !== sess.deviceId)
        .map(({ deviceId, ...r }) => {
          void deviceId;
          return r;
        }),
      stats: await store.duelStats(sess.roomKey),
    });
  } catch {
    return NextResponse.json({ ok: false, error: "store_error" }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  const sess = await sessionFromCookies();
  if (!sess) return NextResponse.json({ ok: false, error: "join_first" }, { status: 401 });

  let id = 0;
  try {
    const b = await req.json();
    id = Number(b?.attackId);
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ ok: false, error: "bad_attack" }, { status: 400 });
  }

  try {
    const store = getStore();
    const state = await store.getState(sess.roomKey);
    if (DECK[state.step]?.kind !== "duel") {
      return NextResponse.json({ ok: false, error: "not_duel_time" }, { status: 409 });
    }
    await store.attackFlag(sess.roomKey, id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "store_error" }, { status: 502 });
  }
}
