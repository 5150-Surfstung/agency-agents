import { NextRequest, NextResponse } from "next/server";
import { DECK } from "@/lib/deck";
import { sessionFromCookies } from "@/lib/room";
import { getStore } from "@/lib/store";

export async function POST(req: NextRequest) {
  const sess = await sessionFromCookies();
  if (!sess) return NextResponse.json({ ok: false, error: "join_first" }, { status: 401 });

  let pollKey = "";
  let choice = -1;
  try {
    const body = await req.json();
    pollKey = String(body?.pollKey ?? "");
    choice = Number(body?.choice);
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  try {
    const store = getStore();
    const state = await store.getState(sess.roomKey);
    const slide = DECK[state.step];
    const poll = slide?.poll;
    const price = slide?.price;

    // Votes only land on the poll/game that is actually open on screen — a
    // stale phone can't stuff a closed one. Price guesses ride the same rail
    // as whole $thousands.
    const current = poll?.key === pollKey ? "poll" : price?.key === pollKey ? "price" : null;
    if (!current) {
      return NextResponse.json({ ok: false, error: "poll_not_current" }, { status: 409 });
    }
    if (state.pollState !== "open") {
      return NextResponse.json({ ok: false, error: "poll_not_open" }, { status: 409 });
    }
    if (current === "poll" && (!Number.isInteger(choice) || choice < 0 || choice >= (poll?.options.length ?? 0))) {
      return NextResponse.json({ ok: false, error: "bad_choice" }, { status: 400 });
    }
    if (current === "price" && (!Number.isInteger(choice) || choice < (price?.minK ?? 0) || choice > (price?.maxK ?? 0))) {
      return NextResponse.json({ ok: false, error: "bad_choice" }, { status: 400 });
    }

    await store.castVote(sess.roomKey, { pollKey, deviceId: sess.deviceId, choice, at: Date.now() });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "store_error" }, { status: 502 });
  }
}
