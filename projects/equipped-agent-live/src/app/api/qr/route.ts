// The one QR the room ever sees: it opens the join page. The PIN lives on
// the slide next to it — the database owns the real value, so the QR stays
// honest whatever the pin rotates to.

import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { getStore } from "@/lib/store";

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  try {
    if (!key || (await getStore().checkKey(key)) !== "presenter") {
      return NextResponse.json({ ok: false, error: "not_presenter" }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ ok: false, error: "store_error" }, { status: 502 });
  }

  const proto = req.headers.get("x-forwarded-proto") ?? "http";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3000";
  const joinUrl = `${proto}://${host}/`;

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
