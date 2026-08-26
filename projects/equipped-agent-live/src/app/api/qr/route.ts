// The one QR the room ever sees: it opens the join page with the PIN
// pre-filled, so a scan is one tap from being in the room.

import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { isPresenter, roomPin } from "@/lib/room";

export async function GET(req: NextRequest) {
  if (!isPresenter(req.nextUrl.searchParams.get("key"))) {
    return NextResponse.json({ ok: false, error: "not_presenter" }, { status: 401 });
  }

  const proto = req.headers.get("x-forwarded-proto") ?? "http";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3000";
  const joinUrl = `${proto}://${host}/?pin=${encodeURIComponent(roomPin())}`;

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
