// THE CONTENT MACHINE. One listing, one platform, one angle — one real piece
// of content, generated live.
//
// Gated on a room session on purpose. The engine is Mike's spend, and the
// standing rule for this class is that attendees build on their OWN accounts.
// So this runs for the room, under the existing caps, as the live demo — and
// the full prompt is printed on the kit page so every attendee can run it
// forever at home without costing anybody anything.

import { NextRequest, NextResponse } from "next/server";
import { runArcadeTurn } from "@/lib/ai";
import { ANGLES, PLATFORMS, socialSystem, type Angle, type Platform } from "@/lib/prompts";
import { sessionFromCookies } from "@/lib/room";

export async function POST(req: NextRequest) {
  const sess = await sessionFromCookies();
  if (!sess) return NextResponse.json({ ok: false, error: "join_first" }, { status: 401 });

  let facts = "";
  let platform: Platform = "Instagram";
  let angle: Angle = "Just listed";
  let agentName = "";
  let market = "";
  try {
    const b = await req.json();
    facts = String(b?.facts ?? "").trim().slice(0, 4000);
    agentName = String(b?.agentName ?? "").trim().slice(0, 60) || "the agent";
    market = String(b?.market ?? "").trim().slice(0, 80);
    const p = String(b?.platform ?? "");
    const a = String(b?.angle ?? "");
    if ((PLATFORMS as readonly string[]).includes(p)) platform = p as Platform;
    if ((ANGLES as readonly string[]).includes(a)) angle = a as Angle;
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  // Below this, there isn't enough to ground anything and the model would
  // start inventing a house. Better to refuse than to produce fiction.
  if (facts.length < 40) return NextResponse.json({ ok: false, error: "need_facts" }, { status: 400 });

  const result = await runArcadeTurn({
    roomKey: sess.roomKey,
    deviceId: sess.deviceId,
    tool: "listing",
    system: socialSystem(platform, angle, facts, agentName, market),
    messages: [{ role: "user", content: `Write the ${angle} ${platform} piece.` }],
  });
  if (!result.ok) {
    const status = result.reason === "offline" ? 503 : result.reason === "error" ? 502 : 429;
    return NextResponse.json({ ok: false, error: result.reason }, { status });
  }
  return NextResponse.json({ ok: true, content: result.reply, platform, angle });
}
