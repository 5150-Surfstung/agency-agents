// THE SWITCHBOARD — the operator's half. Two kinds of human can sit here:
//
//   · the PRESENTER, with the console key, who sees every live conversation in
//     the room and can break into any of them from the stage;
//   · the ATTENDEE, with nothing but the session cookie they got at the door,
//     who sees the conversations happening on the assistant THEY built.
//
// The second one is the point. It is what they take home: their listing
// answers at 11pm, and when it matters they reach in from their phone and
// finish the conversation themselves.

import { NextRequest, NextResponse } from "next/server";
import { sessionFromCookies } from "@/lib/room";
import { isThreadId } from "@/lib/thread";
import { getStore } from "@/lib/store";

/** The console has no device of its own; the database ignores this for a
 *  presenter key, which is the only caller that ever sends it. */
const CONSOLE_DEVICE = "00000000-0000-4000-8000-0000000000c0";

async function seat(key: string): Promise<{ key: string; deviceId: string; presenter: boolean } | null> {
  const store = getStore();
  if (key && (await store.checkKey(key)) === "presenter") {
    return { key, deviceId: CONSOLE_DEVICE, presenter: true };
  }
  const sess = await sessionFromCookies();
  return sess ? { key: sess.roomKey, deviceId: sess.deviceId, presenter: false } : null;
}

export async function GET(req: NextRequest) {
  const who = await seat(req.nextUrl.searchParams.get("key") ?? "");
  if (!who) return NextResponse.json({ ok: false, error: "no_seat" }, { status: 401 });
  const t = req.nextUrl.searchParams.get("t") ?? "";
  const store = getStore();
  try {
    if (t) {
      if (!isThreadId(t)) return NextResponse.json({ ok: false, error: "bad_thread" }, { status: 400 });
      const messages = await store.threadRead(who.key, who.deviceId, t);
      return NextResponse.json({ ok: true, messages });
    }
    const threads = await store.threadList(who.key, who.deviceId, who.presenter);
    // Room-wide counters are the console's business; a phone gets its own.
    const stats = who.presenter
      ? await store.threadStats(who.key)
      : {
          threads: threads.length,
          waiting: threads.filter((r) => r.waiting).length,
          taken: threads.filter((r) => r.operator).length,
          msgs: threads.reduce((n, r) => n + r.msgs, 0),
        };
    return NextResponse.json({ ok: true, threads, stats, presenter: who.presenter });
  } catch (e) {
    const denied = /not_yours|not_presenter|bad_key/.test(String(e));
    return NextResponse.json(
      { ok: false, error: denied ? "not_yours" : "store_error" },
      { status: denied ? 403 : 502 }
    );
  }
}

/** BREAK IN (`body`) or hand it back (`release`). */
export async function POST(req: NextRequest) {
  let key = "";
  let t = "";
  let body = "";
  let label = "";
  let release = false;
  try {
    const b = await req.json();
    key = String(b?.key ?? "");
    t = String(b?.t ?? "");
    body = String(b?.body ?? "").trim().slice(0, 1200);
    label = String(b?.who ?? "").trim().slice(0, 60);
    release = Boolean(b?.release);
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  if (!isThreadId(t)) return NextResponse.json({ ok: false, error: "bad_thread" }, { status: 400 });
  const who = await seat(key);
  if (!who) return NextResponse.json({ ok: false, error: "no_seat" }, { status: 401 });
  const store = getStore();
  try {
    if (release) {
      await store.threadRelease(who.key, who.deviceId, t);
      return NextResponse.json({ ok: true, released: true });
    }
    if (!body) return NextResponse.json({ ok: false, error: "need_body" }, { status: 400 });
    const id = await store.threadSay(who.key, who.deviceId, t, label, body);
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    const denied = /not_yours|bad_key|no_thread/.test(String(e));
    return NextResponse.json(
      { ok: false, error: denied ? "not_yours" : "store_error" },
      { status: denied ? 403 : 502 }
    );
  }
}
