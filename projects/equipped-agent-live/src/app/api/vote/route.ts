import { NextRequest, NextResponse } from "next/server";
import { DECK } from "@/lib/deck";
import { deviceFromCookies } from "@/lib/room";
import { getStore } from "@/lib/store";

export async function POST(req: NextRequest) {
  const deviceId = await deviceFromCookies();
  if (!deviceId) return NextResponse.json({ ok: false, error: "join_first" }, { status: 401 });

  let pollKey = "";
  let choice = -1;
  try {
    const body = await req.json();
    pollKey = String(body?.pollKey ?? "");
    choice = Number(body?.choice);
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const store = getStore();
  const state = await store.getState();
  const slide = DECK[state.step];
  const poll = slide?.poll;

  // Votes only land on the poll that is actually open on screen — a stale
  // phone can't stuff a closed poll.
  if (!poll || poll.key !== pollKey) {
    return NextResponse.json({ ok: false, error: "poll_not_current" }, { status: 409 });
  }
  if (state.pollState !== "open") {
    return NextResponse.json({ ok: false, error: "poll_not_open" }, { status: 409 });
  }
  if (!Number.isInteger(choice) || choice < 0 || choice >= poll.options.length) {
    return NextResponse.json({ ok: false, error: "bad_choice" }, { status: 400 });
  }

  await store.castVote({ pollKey, deviceId, choice, at: Date.now() });
  return NextResponse.json({ ok: true });
}
