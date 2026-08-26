// Test-drive your own assistant, in the room, before you take it home.
// Same engine, same caps — the persona is the pack the attendee just built.

import { NextRequest, NextResponse } from "next/server";
import { runArcadeTurn, type ChatMsg } from "@/lib/ai";
import { ARCADE_FROM_STEP } from "@/lib/deck";
import { packTestSystem } from "@/lib/prompts";
import { sessionFromCookies } from "@/lib/room";
import { getStore } from "@/lib/store";

export async function POST(req: NextRequest) {
  const sess = await sessionFromCookies();
  if (!sess) return NextResponse.json({ ok: false, error: "join_first" }, { status: 401 });

  const store = getStore();
  const state = await store.getState(sess.roomKey);
  if (state.step < ARCADE_FROM_STEP) {
    return NextResponse.json({ ok: false, error: "arcade_locked" }, { status: 409 });
  }

  let code = "";
  let messages: ChatMsg[] = [];
  try {
    const body = await req.json();
    code = String(body?.code ?? "").toUpperCase().slice(0, 8);
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

  const pack = code ? await store.getPack(code) : null;
  if (!pack) return NextResponse.json({ ok: false, error: "pack_not_found" }, { status: 404 });
  if (messages.length === 0) {
    messages = [{ role: "user", content: "Introduce yourself." }];
  }

  const result = await runArcadeTurn({
    roomKey: sess.roomKey,
    deviceId: sess.deviceId,
    tool: "mine",
    system: packTestSystem(pack),
    messages,
  });

  if (!result.ok) {
    const status = result.reason === "offline" ? 503 : result.reason === "error" ? 502 : 429;
    return NextResponse.json({ ok: false, error: result.reason }, { status });
  }
  return NextResponse.json({ ok: true, reply: result.reply });
}
