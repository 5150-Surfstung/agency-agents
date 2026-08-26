// THE TROPHY. An attendee builds a real, branded, deployed listing assistant
// in about ninety seconds — and walks out with a live URL and a QR they can
// put on a rider tomorrow. POST builds it; GET returns theirs (plus any leads
// a stranger has already left on it).

import { NextRequest, NextResponse } from "next/server";
import { mintCode } from "@/lib/code";
import { sessionFromCookies } from "@/lib/room";
import { getStore } from "@/lib/store";

const VOICES = new Set(["warm", "luxury", "energy"]);

export async function POST(req: NextRequest) {
  const sess = await sessionFromCookies();
  if (!sess) return NextResponse.json({ ok: false, error: "join_first" }, { status: 401 });

  let agentName = "";
  let brokerage = "";
  let cell = "";
  let headline = "";
  let facts = "";
  let voice = "warm";
  try {
    const b = await req.json();
    agentName = String(b?.agentName ?? "").trim().slice(0, 60);
    brokerage = String(b?.brokerage ?? "").trim().slice(0, 60);
    cell = String(b?.cell ?? "").trim().slice(0, 24);
    headline = String(b?.headline ?? "").trim().slice(0, 80);
    facts = String(b?.facts ?? "").trim().slice(0, 4000);
    voice = String(b?.voice ?? "warm");
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  if (agentName.length < 2) return NextResponse.json({ ok: false, error: "need_name" }, { status: 400 });
  // A fact sheet is the whole product — an assistant with nothing to stand on
  // would have to guess, and guessing is the one thing it must never do.
  if (facts.length < 40) return NextResponse.json({ ok: false, error: "need_facts" }, { status: 400 });
  if (!VOICES.has(voice)) voice = "warm";

  try {
    const store = getStore();
    const code = mintCode();
    await store.assistantCreate(sess.roomKey, sess.deviceId, {
      code,
      agentName,
      brokerage,
      cell,
      headline,
      facts,
      voice: voice as "warm" | "luxury" | "energy",
    });
    return NextResponse.json({ ok: true, code });
  } catch {
    return NextResponse.json({ ok: false, error: "store_error" }, { status: 502 });
  }
}

export async function GET() {
  const sess = await sessionFromCookies();
  if (!sess) return NextResponse.json({ ok: false, error: "join_first" }, { status: 401 });
  try {
    const store = getStore();
    const mine = await store.assistantMine(sess.roomKey, sess.deviceId);
    if (!mine) return NextResponse.json({ ok: true, assistant: null, leads: [] });
    const leads = await store.assistantLeadsMine(sess.roomKey, sess.deviceId);
    return NextResponse.json({ ok: true, assistant: mine, leads });
  } catch {
    return NextResponse.json({ ok: false, error: "store_error" }, { status: 502 });
  }
}
