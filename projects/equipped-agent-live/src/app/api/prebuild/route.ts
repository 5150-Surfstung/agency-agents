// BUILD IT BEFORE YOU COME.
//
// The assistant that goes on a sign used to be mintable only from inside the
// room, which put the whole build inside the hour and made the hour about
// setup. This lets somebody who has taken a seat build theirs the night
// before, off the sheet their OWN assistant wrote, and walk in with a live
// page and a QR code already on it.
//
// THE BOOKING IS THE GATE, and it is the right one: it is unguessable, it is
// already the private link we hand them for their kit, and it ties a live
// public page to a real seat rather than to a browser that could be cleared.
// Ownership is derived from the reference, so the same kit link keeps working
// on their phone, their laptop and the office machine — and so the leads and
// the alert address follow the booking rather than the device.

import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { mintCode } from "@/lib/code";
import { looksLikeEmail } from "@/lib/mailer";
import { parseSheet } from "@/lib/sheet";
import { getStore } from "@/lib/store";

const REF = /^EA-[A-Z0-9]{6}$/;

/** The reference, shaped as the uuid the assistant tables key ownership on.
 *  Derived rather than stored: the same booking always resolves to the same
 *  owner, and knowing the reference is the whole claim — which is true,
 *  because the reference is what we gave them privately. */
function deviceForRef(ref: string): string {
  const h = createHash("sha256").update(`assistant-owner:${ref}`).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

/** What this booking has built already, so the kit page can show it back with
 *  the live link and the QR instead of offering to build a second one. */
export async function GET(req: NextRequest) {
  const ref = (req.nextUrl.searchParams.get("ref") ?? "").toUpperCase();
  if (!REF.test(ref)) return NextResponse.json({ ok: false, error: "bad_ref" }, { status: 400 });
  try {
    const store = getStore();
    const device = deviceForRef(ref);
    // The leads come back too. Until the alert email is switched on this is
    // the only place an agent sees who their pre-built assistant caught, and
    // it stays the list they work from afterwards.
    const [mine, leads] = await Promise.all([
      store.assistantsByDevice(device),
      store.assistantLeadsByDevice(device).catch(() => []),
    ]);
    return NextResponse.json({ ok: true, mine, leads });
  } catch {
    return NextResponse.json({ ok: false, error: "store_error" }, { status: 502 });
  }
}

/** FIX IT. Everybody gets the sheet wrong the first time. The code never
 *  moves — it is on a printed QR by now — so this rewrites only what came out
 *  of the sheet. */
export async function PATCH(req: NextRequest) {
  let ref = "";
  let code = "";
  let sheet = "";
  let ownerEmail = "";
  try {
    const b = await req.json();
    ref = String(b?.ref ?? "").trim().toUpperCase();
    code = String(b?.code ?? "").trim().toUpperCase().slice(0, 12);
    sheet = String(b?.sheet ?? "").slice(0, 12000);
    ownerEmail = String(b?.ownerEmail ?? "").trim().slice(0, 160);
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  if (!REF.test(ref)) return NextResponse.json({ ok: false, error: "bad_ref" }, { status: 400 });
  if (!code) return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });

  const device = deviceForRef(ref);
  const store = getStore();

  try {
    let changed = false;
    if (sheet.trim()) {
      const parsed = parseSheet(sheet);
      if (parsed.facts.trim().length < 40) {
        return NextResponse.json({ ok: false, error: "need_facts" }, { status: 400 });
      }
      changed = await store.assistantUpdateByDevice(code, device, {
        headline: parsed.headline || "this listing",
        facts: parsed.facts,
        notes: parsed.notes,
        voice: parsed.voice,
      });
      if (!changed) return NextResponse.json({ ok: false, error: "not_yours" }, { status: 403 });
    }
    let alerts: boolean | null = null;
    if (ownerEmail) {
      if (!looksLikeEmail(ownerEmail)) {
        return NextResponse.json({ ok: false, error: "bad_email" }, { status: 400 });
      }
      alerts = await store.assistantSetOwnerEmail(code, device, ownerEmail);
      if (!alerts) return NextResponse.json({ ok: false, error: "not_yours" }, { status: 403 });
    }
    if (!changed && alerts === null) {
      return NextResponse.json({ ok: false, error: "nothing_to_do" }, { status: 400 });
    }
    return NextResponse.json({ ok: true, changed, alerts });
  } catch (e) {
    const known = /need_facts/.test(String(e)) ? "need_facts" : "store_error";
    return NextResponse.json({ ok: false, error: known }, { status: known === "need_facts" ? 400 : 502 });
  }
}

export async function POST(req: NextRequest) {
  let ref = "";
  let sheet = "";
  let agentName = "";
  let brokerage = "";
  let cell = "";
  let ownerEmail = "";
  try {
    const b = await req.json();
    ref = String(b?.ref ?? "").trim().toUpperCase();
    sheet = String(b?.sheet ?? "").slice(0, 12000);
    agentName = String(b?.agentName ?? "").trim().slice(0, 60);
    brokerage = String(b?.brokerage ?? "").trim().slice(0, 60);
    cell = String(b?.cell ?? "").trim().slice(0, 24);
    ownerEmail = String(b?.ownerEmail ?? "").trim().slice(0, 160);
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  if (!REF.test(ref)) return NextResponse.json({ ok: false, error: "bad_ref" }, { status: 400 });
  if (agentName.length < 2) return NextResponse.json({ ok: false, error: "need_name" }, { status: 400 });

  // The sheet is the whole product. An assistant with nothing to stand on
  // would have to guess, and guessing is the one thing it must never do — so
  // a thin paste is refused here rather than deployed onto somebody's sign.
  const parsed = parseSheet(sheet);
  if (parsed.facts.trim().length < 40) {
    return NextResponse.json({ ok: false, error: "need_facts" }, { status: 400 });
  }

  const device = deviceForRef(ref);
  const code = mintCode();

  try {
    const store = getStore();
    await store.assistantCreateByRef(ref, device, {
      code,
      agentName,
      brokerage,
      cell,
      headline: parsed.headline || "this listing",
      facts: parsed.facts,
      notes: parsed.notes,
      voice: parsed.voice,
    });

    // Where the leads land. A bad address is never worth failing a deployed
    // assistant over — the page and the QR have to work either way, and they
    // can fix the address from the same link afterwards.
    let alerts = false;
    if (ownerEmail && looksLikeEmail(ownerEmail)) {
      try {
        alerts = await store.assistantSetOwnerEmail(code, device, ownerEmail);
      } catch {
        alerts = false;
      }
    }

    return NextResponse.json({
      ok: true,
      code,
      alerts,
      // Said back so the page can show what it actually read out of their
      // sheet, rather than claiming it understood a structure it did not.
      structured: parsed.structured,
      headline: parsed.headline,
      voice: parsed.voice,
    });
  } catch (e) {
    const msg = String(e);
    const known = /no_booking/.test(msg)
      ? "no_booking"
      : /too_many/.test(msg)
        ? "too_many"
        : "store_error";
    return NextResponse.json(
      { ok: false, error: known },
      { status: known === "store_error" ? 502 : 400 }
    );
  }
}
