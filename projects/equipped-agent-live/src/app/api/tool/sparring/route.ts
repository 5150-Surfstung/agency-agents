// The Objection Sparring Ring. Ten in-character rounds; every reply carries a
// SCORE line the UI parses in code. A missing score renders as no score —
// never an invented one.

import { NextRequest, NextResponse } from "next/server";
import { runArcadeTurn, type ChatMsg } from "@/lib/ai";
import { ARCADE_FROM_STEP } from "@/lib/deck";
import { sparringSystem } from "@/lib/prompts";
import { sessionFromCookies } from "@/lib/room";
import { getStore } from "@/lib/store";

export async function POST(req: NextRequest) {
  const sess = await sessionFromCookies();
  if (!sess) return NextResponse.json({ ok: false, error: "join_first" }, { status: 401 });

  const state = await getStore().getState(sess.roomKey);
  if (state.step < ARCADE_FROM_STEP) {
    return NextResponse.json({ ok: false, error: "arcade_locked" }, { status: 409 });
  }

  let scenario = "interview";
  let messages: ChatMsg[] = [];
  try {
    const body = await req.json();
    scenario = ["interview", "fsbo", "expired"].includes(body?.scenario) ? body.scenario : "interview";
    messages = (Array.isArray(body?.messages) ? body.messages : [])
      .slice(-24)
      .map((m: { role?: string; content?: string }) => ({
        role: m?.role === "assistant" ? ("assistant" as const) : ("user" as const),
        content: String(m?.content ?? "").slice(0, 2000),
      }))
      .filter((m: ChatMsg) => m.content.length > 0);
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  // The ring opens itself: an empty history asks the persona for its opener.
  if (messages.length === 0) {
    messages = [{ role: "user", content: "Ding ding — open the match with your first objection." }];
  }

  const result = await runArcadeTurn({
    roomKey: sess.roomKey,
    deviceId: sess.deviceId,
    tool: "sparring",
    system: sparringSystem(scenario),
    messages,
  });

  if (!result.ok) {
    const status = result.reason === "offline" ? 503 : result.reason === "error" ? 502 : 429;
    return NextResponse.json({ ok: false, error: result.reason }, { status });
  }

  // Parse the score in code — the UI shows exactly what the line said, or nothing.
  const m = result.reply.match(/^SCORE:\s*(\d{1,2})\s*\/\s*10\s*—?\s*(.*)$/m);
  const score = m ? Math.min(10, Number(m[1])) : null;
  const coach = m ? m[2].trim() : null;

  return NextResponse.json({ ok: true, reply: result.reply, score, coach });
}
