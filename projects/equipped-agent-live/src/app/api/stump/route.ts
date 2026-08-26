// Stump the Assistant. Phones fire questions at a fact sheet; the grounded
// assistant answers or — the whole point — refuses. Everything streams to the
// projector via the console snapshot. Refusal is detected in code from the
// reply's own words, never invented.

import { NextRequest, NextResponse } from "next/server";
import { runArcadeTurn } from "@/lib/ai";
import { DECK, STUMP_FACTS } from "@/lib/deck";
import { listingAssistantSystem } from "@/lib/prompts";
import { sessionFromCookies } from "@/lib/room";
import { getStore } from "@/lib/store";

const REFUSAL =
  /don't want to guess|not on the sheet|don't have that|do not have that|have (mike|the agent) confirm|can't confirm|cannot confirm|i don't know/i;

export async function POST(req: NextRequest) {
  const sess = await sessionFromCookies();
  if (!sess) return NextResponse.json({ ok: false, error: "join_first" }, { status: 401 });

  let question = "";
  try {
    const body = await req.json();
    question = String(body?.question ?? "").trim().slice(0, 300);
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  if (!question) return NextResponse.json({ ok: false, error: "need_question" }, { status: 400 });

  try {
    const store = getStore();
    const state = await store.getState(sess.roomKey);
    if (DECK[state.step]?.kind !== "stump") {
      return NextResponse.json({ ok: false, error: "not_stump_time" }, { status: 409 });
    }

    const result = await runArcadeTurn({
      roomKey: sess.roomKey,
      deviceId: sess.deviceId,
      tool: "listing",
      system: listingAssistantSystem(STUMP_FACTS, "Mike"),
      messages: [{ role: "user", content: question }],
    });

    if (!result.ok) {
      // Nothing recorded on failure — no ghost entries on the projector, no
      // board points for a question the assistant never faced.
      const status = result.reason === "offline" ? 503 : result.reason === "error" ? 502 : 429;
      return NextResponse.json({ ok: false, error: result.reason }, { status });
    }

    const refused = REFUSAL.test(result.reply);
    const id = await store.stumpAdd(sess.roomKey, sess.deviceId, question);
    await store.stumpAnswer(sess.roomKey, id, result.reply, refused);
    return NextResponse.json({ ok: true, answer: result.reply, refused });
  } catch {
    return NextResponse.json({ ok: false, error: "store_error" }, { status: 502 });
  }
}
