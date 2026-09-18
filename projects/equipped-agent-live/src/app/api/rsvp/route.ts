// VAL TAKES THE RESERVATION.
//
// This is the one place on the invite where the page performs something on
// the visitor's behalf, so it is the one place where honesty costs the most
// to get wrong. The rule the whole flow is built around: the confirmation the
// visitor sees must describe a row that exists. The reference and the
// timestamp both come back FROM the database — they are not generated in the
// browser and drawn on the screen, because a confirmation nothing performed
// is exactly the kind of demo this hour teaches against.
//
// What this does NOT claim: nothing here emails or texts anybody. The page
// says so, and it offers the visitor their own mail app alongside, so the
// reservation lands in a human's inbox as well as in the table.

import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";

/** Short, unambiguous, sayable down a phone: no O/0, no I/1. */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function makeRef(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  const body = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
  return `EA-${body.slice(0, 3)}${body.slice(3, 6)}`;
}

export async function POST(req: NextRequest) {
  let name = "";
  let cell = "";
  let attend = "in-person";
  let note = "";
  let ref = "";
  try {
    const b = await req.json();
    name = String(b?.name ?? "").trim().slice(0, 80);
    cell = String(b?.cell ?? "").trim().slice(0, 32);
    attend = String(b?.attend ?? "in-person").trim();
    note = String(b?.note ?? "").trim().slice(0, 400);
    // The browser may hand back a reference from a previous attempt, which is
    // what makes a retry idempotent instead of a second seat.
    ref = String(b?.ref ?? "").trim().slice(0, 24);
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  if (name.length < 2) {
    return NextResponse.json({ ok: false, error: "need_name" }, { status: 400 });
  }
  if (!["in-person", "zoom", "either"].includes(attend)) attend = "in-person";
  if (!/^EA-[A-Z0-9]{6}$/.test(ref)) ref = makeRef();

  try {
    const at = await getStore().rsvpAdd({ ref, name, cell, attend, note });
    return NextResponse.json({ ok: true, ref, at });
  } catch (e) {
    const msg = String(e);
    const known = /too_many/.test(msg) ? "too_many" : /need_name/.test(msg) ? "need_name" : "store_error";
    return NextResponse.json({ ok: false, error: known }, { status: known === "too_many" ? 429 : 502 });
  }
}
