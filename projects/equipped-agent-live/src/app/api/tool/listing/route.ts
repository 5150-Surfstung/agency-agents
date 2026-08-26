// The Listing Assistant Builder. An attendee pastes their own listing's
// facts and gets a working grounded chat — the same property rule the
// production receptionist runs. The refusal to guess IS the demo.

import { NextRequest, NextResponse } from "next/server";
import { runArcadeTurn, type ChatMsg } from "@/lib/ai";
import { ARCADE_FROM_STEP } from "@/lib/deck";
import { listingAssistantSystem } from "@/lib/prompts";
import { deviceFromCookies } from "@/lib/room";
import { getStore } from "@/lib/store";

export async function POST(req: NextRequest) {
  const deviceId = await deviceFromCookies();
  if (!deviceId) return NextResponse.json({ ok: false, error: "join_first" }, { status: 401 });

  const state = await getStore().getState();
  if (state.step < ARCADE_FROM_STEP) {
    return NextResponse.json({ ok: false, error: "arcade_locked" }, { status: 409 });
  }

  let facts = "";
  let agentLabel = "";
  let messages: ChatMsg[] = [];
  try {
    const body = await req.json();
    facts = String(body?.facts ?? "").slice(0, 4000);
    agentLabel = String(body?.agentLabel ?? "").slice(0, 60);
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

  if (!facts.trim() || messages.length === 0) {
    return NextResponse.json({ ok: false, error: "need_facts_and_message" }, { status: 400 });
  }

  const result = await runArcadeTurn({
    deviceId,
    tool: "listing",
    system: listingAssistantSystem(facts, agentLabel),
    messages,
  });

  if (!result.ok) {
    const status = result.reason === "offline" ? 503 : result.reason === "error" ? 502 : 429;
    return NextResponse.json({ ok: false, error: result.reason }, { status });
  }
  return NextResponse.json({ ok: true, reply: result.reply });
}
