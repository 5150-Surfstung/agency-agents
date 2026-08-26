// Assistant To Go. POST (in the room) mints a pack code from the agent's
// profile; GET (anywhere, forever) returns it — the pack page is theirs to
// keep after the room closes.

import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { sessionFromCookies } from "@/lib/room";
import { getStore } from "@/lib/store";
import type { Pack } from "@/lib/types";

// No 0/O/1/I — codes get read aloud across lunch tables.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
function mintCode(): string {
  const bytes = randomBytes(6);
  let out = "";
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return out;
}

export async function POST(req: NextRequest) {
  const sess = await sessionFromCookies();
  if (!sess) return NextResponse.json({ ok: false, error: "join_first" }, { status: 401 });

  let name = "";
  let brokerage = "";
  let area = "";
  let specialty = "";
  let tone: Pack["tone"] = "warm";
  try {
    const body = await req.json();
    name = String(body?.name ?? "").trim().slice(0, 60);
    brokerage = String(body?.brokerage ?? "").trim().slice(0, 80);
    area = String(body?.area ?? "").trim().slice(0, 100);
    specialty = String(body?.specialty ?? "").trim().slice(0, 80);
    tone = ["warm", "luxury", "energy"].includes(body?.tone) ? body.tone : "warm";
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  if (!name) return NextResponse.json({ ok: false, error: "need_name" }, { status: 400 });

  try {
    const store = getStore();
    // A tiny mint-collision loop; 31^6 codes makes a second pass vanishingly rare.
    let code = mintCode();
    for (let i = 0; i < 3 && (await store.getPack(code)); i++) code = mintCode();

    const pack: Pack = { code, deviceId: sess.deviceId, name, brokerage, area, specialty, tone, createdAt: Date.now() };
    await store.savePack(sess.roomKey, pack);
    return NextResponse.json({ ok: true, code });
  } catch {
    return NextResponse.json({ ok: false, error: "store_error" }, { status: 502 });
  }
}

export async function GET(req: NextRequest) {
  const code = String(req.nextUrl.searchParams.get("code") ?? "").toUpperCase();
  if (!code) return NextResponse.json({ ok: false, error: "need_code" }, { status: 400 });
  try {
    const pack = await getStore().getPack(code);
    if (!pack) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    const { deviceId: _omit, ...pub } = pack;
    return NextResponse.json({ ok: true, pack: pub });
  } catch {
    return NextResponse.json({ ok: false, error: "store_error" }, { status: 502 });
  }
}
