// The one QR the room ever sees. It carries the PIN (?pin=…) so a scan lands
// a phone straight in the room — mid-slide, in person or on a shared screen —
// with zero typing. The database owns the real PIN, so the QR follows every
// rotation on its own; only the presenter key can mint it.

import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { getStore } from "@/lib/store";

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  let pin: string | null = null;
  try {
    if (!key || (await getStore().checkKey(key)) !== "presenter") {
      return NextResponse.json({ ok: false, error: "not_presenter" }, { status: 401 });
    }
    pin = await getStore().roomPin(key);
  } catch {
    return NextResponse.json({ ok: false, error: "store_error" }, { status: 502 });
  }

  const proto = req.headers.get("x-forwarded-proto") ?? "http";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3000";
  const joinUrl = pin ? `${proto}://${host}/?pin=${encodeURIComponent(pin)}` : `${proto}://${host}/`;

  const png = await QRCode.toBuffer(joinUrl, {
    type: "png",
    width: 480,
    margin: 1,
    color: { dark: "#071320", light: "#f2efe7" },
  });

  return new NextResponse(new Uint8Array(png), {
    headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
  });
}
