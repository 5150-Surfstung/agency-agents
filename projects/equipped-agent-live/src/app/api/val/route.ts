// VAL ON THE INVITE — the demo doing its job on the way in the door.
//
// A page that SAYS an assistant will refuse to invent things is an argument. An
// assistant that refuses, live, in front of somebody who has just booked a seat
// to learn how to build one, is the product. So this route exists purely so a
// stranger can ask a real question and watch the honest failure happen.
//
// It is a public endpoint that spends money, so the caps come first and the
// answer second. runArcadeTurn meters against a labelled public budget rather
// than a room key, refuses when the day's device allowance or the spend cap is
// reached, and reports `offline` rather than throwing when no key is set.

import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { runArcadeTurn } from "@/lib/ai";
import { isRefusal } from "@/lib/refusal";
import { INVITE_SYSTEM } from "@/lib/invite-sheet";

const METER_ROOM = "invite-val";

/** Stable per browser per day, derived and never stored — the same visitor
 *  keeps one allowance without this page setting a cookie or learning
 *  anything about them. */
function visitorId(req: NextRequest): string {
  const seed = [
    req.headers.get("user-agent") ?? "",
    req.headers.get("accept-language") ?? "",
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "",
    new Date().toISOString().slice(0, 10),
  ].join("|");
  return createHash("sha256").update(seed).digest("hex").slice(0, 32);
}

export async function POST(req: NextRequest) {
  let q = "";
  try {
    const b = await req.json();
    q = String(b?.q ?? "").trim().slice(0, 400);
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  if (q.length < 2) return NextResponse.json({ ok: false, error: "empty" }, { status: 400 });

  const res = await runArcadeTurn({
    roomKey: METER_ROOM,
    meterRoom: METER_ROOM,
    deviceId: visitorId(req),
    tool: "listing",
    system: INVITE_SYSTEM,
    messages: [{ role: "user", content: q }],
  });

  if (!res.ok) {
    // Each of these is a different true sentence. None of them pretends an
    // answer was produced.
    const say =
      res.reason === "offline"
        ? "I am not switched on right now — Mike can answer anything you need."
        : res.reason === "device_cap"
          ? "That is all the questions I can take from one device today. Mike can pick it up from here."
          : res.reason === "room_cap"
            ? "I have hit my budget for the day, which is a real limit rather than a polite no. Mike can answer it."
            : "Something went wrong on my end, so I would rather not guess. Mike can answer it.";
    return NextResponse.json({ ok: true, reply: say, refused: true, degraded: res.reason });
  }

  return NextResponse.json({ ok: true, reply: res.reply, refused: isRefusal(res.reply) });
}
