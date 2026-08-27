// The public front door of a deployed assistant. A stranger scans an agent's
// QR, asks a real question, and gets an answer grounded ONLY in that agent's
// fact sheet — or an honest refusal. No room session required: this page is
// meant to live on a rider sign long after the class ends.
//
// Two writes come out of it: the lead (name + cell) the agent actually wanted,
// and, when the asker is a phone in the room during the duel, an attack row.

import { NextRequest, NextResponse } from "next/server";
import { runArcadeTurn } from "@/lib/ai";
import { DECK } from "@/lib/deck";
import { listingAssistantSystem } from "@/lib/prompts";
import { notifyAssistantLead } from "@/lib/notify";
import { sessionFromCookies } from "@/lib/room";
import { getStore } from "@/lib/store";

// Refusal is read from the reply's own words — never asserted by us.
const REFUSAL =
  /don'?t want to guess|not (on|in) (the|my) (fact )?sheet|don'?t have (that|a|the|it)|do not have that|not something i have|isn'?t something i have|can'?t confirm|cannot confirm|i don'?t know|would need to confirm|i'?d have to check|have .{0,24} confirm|get you the real answer|not in what i have/i;

export async function POST(req: NextRequest) {
  let code = "";
  let question = "";
  let duel = false;
  try {
    const b = await req.json();
    code = String(b?.code ?? "").trim().toUpperCase().slice(0, 12);
    question = String(b?.question ?? "").trim().slice(0, 300);
    duel = Boolean(b?.duel);
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
    const deviceId = sess?.deviceId ?? "00000000-0000-4000-8000-0000000000ff";

    const result = await runArcadeTurn({
      roomKey,
      deviceId,
      tool: "listing",
      system: listingAssistantSystem(a.facts, a.agentName, a.voice, a.brokerage, a.notes),
      messages: [{ role: "user", content: question }],
    });
    if (!result.ok) {
      const status = result.reason === "offline" ? 503 : result.reason === "error" ? 502 : 429;
      return NextResponse.json({ ok: false, error: result.reason }, { status });
    }

    const refused = REFUSAL.test(result.reply);
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
  try {
    const b = await req.json();
    code = String(b?.code ?? "").trim().toUpperCase().slice(0, 12);
    name = String(b?.name ?? "").trim().slice(0, 60);
    cell = String(b?.cell ?? "").trim().slice(0, 24);
    question = String(b?.question ?? "").trim().slice(0, 300);
    timeline = String(b?.timeline ?? "").trim().slice(0, 60);
    financing = String(b?.financing ?? "").trim().slice(0, 60);
    hasAgent = String(b?.hasAgent ?? "").trim().slice(0, 60);
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  if (!code || !name || !cell) return NextResponse.json({ ok: false, error: "need_fields" }, { status: 400 });
  try {
    const store = getStore();
    await store.assistantLeadAdd(code, name, cell, question, { timeline, financing, hasAgent });
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
