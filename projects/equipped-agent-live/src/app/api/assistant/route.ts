// THE TROPHY. An attendee builds a real, branded, deployed listing assistant
// in about ninety seconds — and walks out with a live URL and a QR they can
// put on a rider tomorrow. POST builds it; GET returns theirs (plus any leads
// a stranger has already left on it).

import { NextRequest, NextResponse } from "next/server";
import { mintCode } from "@/lib/code";
import { sessionFromCookies } from "@/lib/room";
import { getStore } from "@/lib/store";
import { looksLikeEmail } from "@/lib/mailer";

const VOICES = new Set(["warm", "luxury", "energy"]);

export async function POST(req: NextRequest) {
  const sess = await sessionFromCookies();
  if (!sess) return NextResponse.json({ ok: false, error: "join_first" }, { status: 401 });

  let agentName = "";
  let brokerage = "";
  let cell = "";
  let headline = "";
  let facts = "";
  let notes = "";
  let voice = "warm";
  let ownerEmail = "";
  try {
    const b = await req.json();
    agentName = String(b?.agentName ?? "").trim().slice(0, 60);
    brokerage = String(b?.brokerage ?? "").trim().slice(0, 60);
    cell = String(b?.cell ?? "").trim().slice(0, 24);
    headline = String(b?.headline ?? "").trim().slice(0, 80);
    facts = String(b?.facts ?? "").trim().slice(0, 4000);
    notes = String(b?.notes ?? "").trim().slice(0, 4000);
    voice = String(b?.voice ?? "warm");
    ownerEmail = String(b?.ownerEmail ?? "").trim().slice(0, 160);
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
      notes,
      voice: voice as "warm" | "luxury" | "energy",
    });
    // Set right after the create, by the same device, so an agent leaves the
    // room with somewhere for their leads to land. A bad address is not worth
    // failing a deployed assistant over — the agent can fix it and the QR on
    // their sign keeps working either way.
    if (ownerEmail && looksLikeEmail(ownerEmail)) {
      try {
        await store.assistantSetOwnerEmail(code, sess.deviceId, ownerEmail);
      } catch {}
    }
    return NextResponse.json({ ok: true, code, alerts: Boolean(ownerEmail && looksLikeEmail(ownerEmail)) });
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
