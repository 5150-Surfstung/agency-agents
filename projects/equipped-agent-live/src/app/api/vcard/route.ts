// "Save my contact" — a real vCard, not a picture of one. Tapping this on a
// phone opens the Add Contact sheet; scanning the QR of this URL does the
// same thing from across a room. No form, no email capture, no funnel: the
// point of the hour is that they leave with things, and this is a thing.

import { NextResponse } from "next/server";
import { HOST, vcard } from "@/lib/contact";

export function GET() {
  return new NextResponse(vcard(), {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${HOST.first}-${HOST.last}.vcf"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
