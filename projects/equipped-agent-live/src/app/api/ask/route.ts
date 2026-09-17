// The public front door of a deployed assistant. A stranger scans an agent's
// QR, asks a real question, and gets an answer grounded ONLY in that agent's
// fact sheet — or an honest refusal. No room session required: this page is
// meant to live on a rider sign long after the class ends.
//
// Two writes come out of it: the lead (name + cell) the agent actually wanted,
// and, when the asker is a phone in the room during the duel, an attack row.

import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { runArcadeTurn } from "@/lib/ai";
import { isRefusal } from "@/lib/refusal";
import { DECK } from "@/lib/deck";
import { listingAssistantSystem } from "@/lib/prompts";
import { notifyAssistantLead } from "@/lib/notify";
import { sessionFromCookies } from "@/lib/room";
import { isThreadId, toChat } from "@/lib/thread";
import { getStore } from "@/lib/store";


/** A stable-per-browser id for somebody with no room session. Derived, not
 *  stored: the same visitor keeps the same bucket for the day without this
 *  page setting a cookie or learning anything about them. */
function visitorId(req: NextRequest): string {
  const seed = [
    req.headers.get("user-agent") ?? "",
    req.headers.get("accept-language") ?? "",
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "",
    new Date().toISOString().slice(0, 10),
  ].join("|");
  const h = createHash("sha256").update(seed).digest("hex");
  // Shape it as a v4-looking uuid; the column is a uuid and only equality
  // ever matters.
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

export async function POST(req: NextRequest) {
  let code = "";
  let question = "";
  let duel = false;
  let thread: string | null = null;
  try {
    const b = await req.json();
    code = String(b?.code ?? "").trim().toUpperCase().slice(0, 12);
    question = String(b?.question ?? "").trim().slice(0, 300);
    duel = Boolean(b?.duel);
    thread = isThreadId(b?.thread) ? b.thread : null;
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  if (!code) return NextResponse.json({ ok: false, error: "need_code" }, { status: 400 });
  if (!question) return NextResponse.json({ ok: false, error: "need_question" }, { status: 400 });

  try {
    const store = getStore();
    const a = await store.assistantGet(code);
    if (!a) return NextResponse.json({ ok: false, error: "no_assistant" }, { status: 404 });

    // Metering rides the room key when there is one, so the console's spend
    // HUD stays honest during class; public traffic meters under the code.
    const sess = await sessionFromCookies();
    // A shot only counts while the duel is actually on screen.
    if (duel) {
      if (!sess) return NextResponse.json({ ok: false, error: "join_first" }, { status: 401 });
      const state = await store.getState(sess.roomKey);
      if (DECK[state.step]?.kind !== "duel") {
        return NextResponse.json({ ok: false, error: "not_duel_time" }, { status: 409 });
      }
    }
    const roomKey = sess?.roomKey ?? code;
    // Anyone who scanned the QR on a rider sign has no session, so they hold
    // no room key — and the room-key metering RPCs raise on anything that is
    // not one. Public traffic therefore meters against its own labelled
    // budget. Without this, every stranger who ever asked this page a
    // question got a 502 in the cap check.
    const meterRoom = sess ? undefined : "public-assistant";
    // And it gets a per-visitor id rather than one shared constant, so the
    // first forty questions from one phone cannot spend the whole public
    // allowance for everybody else.
    const deviceId = sess?.deviceId ?? visitorId(req);

    // With a thread, the conversation is real: it remembers, it is watchable
    // from the switchboard, and a human can be holding the wheel right now.
    let history = [{ role: "user" as const, content: question }];
    if (thread) {
      await store.threadAppend(thread, code, "visitor", question);
      const { messages, operator } = await store.threadPoll(thread, 0);
      if (operator) {
        // A person took over. We do NOT answer over them, and we do not fake
        // a reply — the question is recorded and the human is looking at it.
        return NextResponse.json({ ok: true, held: true, operator, answer: "", refused: false });
      }
      const chat = toChat(messages);
      if (chat.length) history = chat as typeof history;
    }

    const result = await runArcadeTurn({
      roomKey,
      meterRoom,
      deviceId,
      tool: "listing",
      system: listingAssistantSystem(a.facts, a.agentName, a.voice, a.brokerage, a.notes),
      messages: history,
    });
    if (!result.ok) {
      const status = result.reason === "offline" ? 503 : result.reason === "error" ? 502 : 429;
      return NextResponse.json({ ok: false, error: result.reason }, { status });
    }

    const refused = isRefusal(result.reply);
    if (thread) await store.threadAppend(thread, code, "assistant", result.reply, refused);
    let attackId: number | null = null;
    if (duel && sess) {
      attackId = await store.attackAdd(sess.roomKey, sess.deviceId, code, question, result.reply, refused);
    }
    return NextResponse.json({ ok: true, answer: result.reply, refused, attackId, agentName: a.agentName });
  } catch {
    return NextResponse.json({ ok: false, error: "store_error" }, { status: 502 });
  }
}

/** A stranger leaving their name and cell on someone's assistant page. */
export async function PUT(req: NextRequest) {
  let code = "";
  let name = "";
  let cell = "";
  let question = "";
  let timeline = "";
  let financing = "";
  let hasAgent = "";
  let thread: string | null = null;
  try {
    const b = await req.json();
    code = String(b?.code ?? "").trim().toUpperCase().slice(0, 12);
    name = String(b?.name ?? "").trim().slice(0, 60);
    cell = String(b?.cell ?? "").trim().slice(0, 24);
    question = String(b?.question ?? "").trim().slice(0, 300);
    timeline = String(b?.timeline ?? "").trim().slice(0, 60);
    financing = String(b?.financing ?? "").trim().slice(0, 60);
    hasAgent = String(b?.hasAgent ?? "").trim().slice(0, 60);
    thread = isThreadId(b?.thread) ? b.thread : null;
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  if (!code || !name || !cell) return NextResponse.json({ ok: false, error: "need_fields" }, { status: 400 });
  try {
    const store = getStore();
    await store.assistantLeadAdd(code, name, cell, question, { timeline, financing, hasAgent });
    // The switchboard should show "Dana R." once we know it, not a uuid.
    if (isThreadId(thread)) await store.threadLabel(thread, name);
    // The whole point of the thing: the agent's phone buzzes NOW, not at 5pm.
    const a = await store.assistantGet(code);
    const ownerCell = await store.assistantOwnerCell(code);
    notifyAssistantLead({
      ownerCell,
      headline: a?.headline ?? "your listing",
      name, cell, question, timeline, financing, hasAgent,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    // A code that never existed is a 404, not a server fault.
    const missing = /no_assistant/.test(String(e));
    return NextResponse.json(
      { ok: false, error: missing ? "no_assistant" : "store_error" },
      { status: missing ? 404 : 502 }
    );
  }
}
