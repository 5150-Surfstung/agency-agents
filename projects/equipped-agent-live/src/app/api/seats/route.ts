// How many have actually booked.
//
// The number is a count of rows, so it cannot be flattering and wrong. The
// one judgement call is in the page, not here: a count this returns honestly
// as 2 is a weaker signal than no count at all, so the component that draws
// it stays silent below a floor rather than dressing a small number up.
// Nothing here is rounded, padded or "seeded".

import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export async function GET() {
  try {
    const booked = await getStore().rsvpCount();
    return NextResponse.json(
      { ok: true, booked },
      { headers: { "Cache-Control": "public, max-age=60" } }
    );
  } catch {
    // A count we cannot read is a count we do not show.
    return NextResponse.json({ ok: false }, { status: 502 });
  }
}
