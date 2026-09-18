// THE INSTRUCTIONS THEY KEEP.
//
// The dash has everything, but a dash is a web page somebody closes. This is
// the same thing as a file: every step, in order, with the prompt embedded in
// full so there is nothing to come back for. It downloads, so it survives a
// closed tab, and the link goes in the message they send the office, which
// puts a copy in their own sent folder as well.
//
// Written for somebody who has never done any of this. It states plainly
// which steps need a paid plan and which do not, because sending an agent to
// a settings screen that is not on their plan is how you lose them.

import { NextRequest, NextResponse } from "next/server";
import { kitText } from "@/lib/kit";

export function GET(req: NextRequest) {
  const name = (req.nextUrl.searchParams.get("name") ?? "").slice(0, 80).trim();
  const ref = (req.nextUrl.searchParams.get("ref") ?? "").slice(0, 24).trim() || "your reference";

  const doc = kitText(name, ref);

  return new NextResponse(doc, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="equipped-agent-${ref}.txt"`,
      "Cache-Control": "no-store",
    },
  });
}
