// THE OPEN FLOOR.
//
// Three callers, three very different levels of trust:
//
//   POST (phone, room session)      — adds a brag or a confession. Goes to the
//                                     console and NOWHERE ELSE.
//   GET  (presenter key)            — the pile, for the console only.
//   POST (presenter key, `send`)    — puts one on the wall and asks Val.
//
// Nothing an attendee types reaches the projector without Mike tapping it.
// That is the entire point of the split and it is not a detail: a free-text
// box pointed at a wall in front of forty colleagues is a real risk, and one
// human tap removes it for free.
//
// The send is deliberately TWO writes. The first marks the entry shown with an
// empty reply, so the screen puts the words up and Val visibly starts
// thinking; the model call then runs; the second write lands the answer. The
// animation is therefore driven by the actual state of the request rather than
// a timer, and Val cannot appear to be thinking about something she has
// already answered — or worse, appear to have answered before she has.

import { NextRequest, NextResponse } from "next/server";
import { runArcadeTurn } from "@/lib/ai";
import { bragSystem } from "@/lib/prompts";
import { presenterKey, sessionFromCookies } from "@/lib/room";
import { getStore } from "@/lib/store";

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key") ?? "";
  if (!key || key !== presenterKey()) {
    return NextResponse.json({ ok: false, error: "not_presenter" }, { status: 401 });
  }
  const brags = await getStore().bragList(key);
  return NextResponse.json({ ok: true, brags });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  const store = getStore();
  const key = String(body.key ?? "");
  const action = String(body.action ?? "");

  // ---- presenter: put one on the wall, and ask Val ----
  if (key && key === presenterKey()) {
    if (action === "clear") {
      await store.bragClear(key);
      return NextResponse.json({ ok: true });
    }
    const id = Number(body.id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ ok: false, error: "bad_id" }, { status: 400 });
    }
    const pile = await store.bragList(key);
    const entry = pile.find((b) => b.id === id);
    if (!entry) return NextResponse.json({ ok: false, error: "no_entry" }, { status: 404 });

    // Words up, Val thinking — before the model call, not after it.
    await store.bragAnswer(key, id, "");

    const result = await runArcadeTurn({
      roomKey: key,
      deviceId: CONSOLE_DEVICE,
      tool: "sparring",
      system: bragSystem(entry.kind, String(body.agentName ?? "")),
      messages: [{ role: "user", content: entry.body }],
    });
    if (!result.ok) {
      // The screen keeps the words up and says so. It never invents an answer.
      await store.bragAnswer(key, id, "");
      const status = result.reason === "offline" ? 503 : result.reason === "error" ? 502 : 429;
      return NextResponse.json({ ok: false, error: result.reason }, { status });
    }
    await store.bragAnswer(key, id, result.reply);
    return NextResponse.json({ ok: true, reply: result.reply });
  }

  // ---- a phone in the room ----
  const sess = await sessionFromCookies();
  if (!sess) return NextResponse.json({ ok: false, error: "join_first" }, { status: 401 });
  const kind = body.kind === "confess" ? "confess" : "brag";
  const text = String(body.body ?? "").trim().slice(0, 400);
  if (text.length < 4) return NextResponse.json({ ok: false, error: "too_short" }, { status: 400 });
  await store.bragAdd(sess.roomKey, sess.deviceId, kind, text);
  return NextResponse.json({ ok: true });
}

/** The console is not a phone; it still needs a device id for the spend caps. */
const CONSOLE_DEVICE = "00000000-0000-4000-8000-0000000000c0";
