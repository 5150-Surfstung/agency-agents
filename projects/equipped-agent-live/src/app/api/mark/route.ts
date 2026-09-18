// THE MARK'S BRAIN.
//
// The orb is a single HTML file. It can sit on a laptop at an open house, get
// mailed to somebody, or be opened off a USB stick — which is exactly why the
// key is not in it. A credential written into a file like that is readable by
// anyone who opens it and billable by all of them. The file posts here, the
// key stays in the deployment, and the spend is metered and capped whoever
// is asking.
//
// KEYLESS ON PURPOSE, the same way the public metering is. This surface has
// no room key and never will: the room key is an auth token, and gating a
// public page on one is what made the desk return 500 to every stranger who
// was not Mike. Safety here is bounds, not a secret — a per-device daily cap
// and a spend ceiling, both read before a model is ever called.
//
// CORS is open because the whole point is that the file works from `file://`,
// where the browser sends `Origin: null`. Nothing here is authenticated, so
// there is no session for another origin to ride; the caps are the control.

import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { runArcadeTurn, type ChatMsg } from "@/lib/ai";
import { markSystem } from "@/lib/mark";

/** Its own labelled budget, so a busy Facebook week on the invite and a busy
 *  open house on the mark cannot starve each other. */
const METER_ROOM = "mark";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Max-Age": "86400",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

/** A stable-per-browser bucket with nothing stored and no cookie set: the
 *  same visitor meters against the same bucket for the day, and tomorrow it
 *  is a different one. Copied in shape from /api/ask, which solved this
 *  first — one visitor should not be able to reset their cap by reloading,
 *  and we should not have to learn anything about them to enforce that. */
function visitorId(req: NextRequest): string {
  const seed = [
    req.headers.get("user-agent") ?? "",
    req.headers.get("accept-language") ?? "",
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "",
    new Date().toISOString().slice(0, 10),
  ].join("|");
  const h = createHash("sha256").update(seed).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

const say = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: CORS });

export async function POST(req: NextRequest) {
  let messages: ChatMsg[] = [];
  try {
    const b = await req.json();
    const raw = Array.isArray(b?.messages) ? b.messages : [];
    messages = raw
      .filter((m: unknown): m is ChatMsg => {
        const r = m as ChatMsg;
        return (r?.role === "user" || r?.role === "assistant") && typeof r?.content === "string";
      })
      // Bounded on both axes: a long paste cannot become an expensive turn,
      // and a browser cannot hand us an unbounded history to pay for.
      .slice(-12)
      .map((m: ChatMsg) => ({ role: m.role, content: m.content.slice(0, 1200) }));
  } catch {
    return say({ ok: false, error: "bad_request" }, 400);
  }

  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser || !lastUser.content.trim()) {
    return say({ ok: false, error: "need_question" }, 400);
  }

  const r = await runArcadeTurn({
    roomKey: METER_ROOM,
    deviceId: visitorId(req),
    tool: "mine",
    system: markSystem(),
    messages,
    meterRoom: METER_ROOM,
  });

  if (r.ok) return say({ ok: true, reply: r.reply });

  // Each of these is a real state, and the file prints the matching line
  // rather than inventing an answer or pretending the turn succeeded.
  const status = r.reason === "offline" ? 503 : r.reason === "error" ? 502 : 429;
  return say({ ok: false, error: r.reason }, status);
}
