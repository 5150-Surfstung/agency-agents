// THE AFTER-HOURS DESK, on a page a stranger reached from Facebook.
//
// This is the only endpoint in the build that answers someone who has not
// joined a room and has not given us anything. That is deliberate: the invite
// has to be worth opening before it asks for a seat, and a paragraph claiming
// so is not worth opening. An agent pastes what a client just texted them and
// gets a message they can send.
//
// Metering, because this one is reachable from a Facebook post:
//  · Each browser gets its own id in a first-party cookie, so one person
//    hammering it cannot spend the allowance the next forty visitors need.
//  · The whole campaign meters under one key, so the spend cap is a real
//    ceiling on the whole invite and not per-visitor.
//  · When either cap is reached the page says so in plain words. It never
//    pretends to be thinking about a question it will not answer.

import { NextRequest, NextResponse } from "next/server";
import { runArcadeTurn } from "@/lib/ai";
import { afterHoursSystem } from "@/lib/prompts";

/** Everything the public invite spends rides one key, so LIVE_SPEND_CAP_USD is
 *  a ceiling on the campaign rather than on each visitor. */
const DESK_KEY = "invite-desk";
const COOKIE = "ea_desk";

/** Uuid because the metering table's device column is one. */
function newVisitor(): string {
  return crypto.randomUUID();
}

/** The model answers in two marked parts so the page can put a copy button on
 *  the sendable half and only that half. If the markers are missing we do NOT
 *  invent a shape — the whole reply becomes the draft and nothing is claimed
 *  about it. */
function split(reply: string): { send: string; check: string } {
  const text = reply.trim();
  const m = /SEND:\s*([\s\S]*?)(?:\n\s*CHECK:\s*([\s\S]*))?$/i.exec(text);
  if (!m) return { send: text, check: "" };
  return { send: (m[1] ?? "").trim(), check: (m[2] ?? "").trim() };
}

export async function POST(req: NextRequest) {
  let message = "";
  try {
    const b = await req.json();
    message = String(b?.message ?? "").trim().slice(0, 600);
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  if (message.length < 4) {
    return NextResponse.json({ ok: false, error: "need_message" }, { status: 400 });
  }

  const existing = req.cookies.get(COOKIE)?.value;
  const visitor = /^[0-9a-f-]{36}$/i.test(existing ?? "") ? (existing as string) : newVisitor();

  // meterRoom, not roomKey, is what makes this work: the room-key metering
  // RPCs treat their key as an auth token and raise on anything that is not
  // the presenter key or the PIN, so a stranger's turn died in the cap check
  // before a model was ever called. This budget is the desk's own.
  const result = await runArcadeTurn({
    roomKey: DESK_KEY,
    meterRoom: DESK_KEY,
    deviceId: visitor,
    // The metering table constrains this column to three values; a drafting
    // turn is the sparring tool's shape, so it rides there rather than needing
    // a migration for one string.
    tool: "sparring",
    system: afterHoursSystem(),
    messages: [{ role: "user", content: message }],
  });

  if (!result.ok) {
    const status =
      result.reason === "offline" ? 503 : result.reason === "error" ? 502 : 429;
    const res = NextResponse.json({ ok: false, error: result.reason }, { status });
    if (visitor !== existing) res.cookies.set(COOKIE, visitor, cookieOpts());
    return res;
  }

  const { send, check } = split(result.reply);
  const res = NextResponse.json({ ok: true, send, check });
  if (visitor !== existing) res.cookies.set(COOKIE, visitor, cookieOpts());
  return res;
}

function cookieOpts() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
}
