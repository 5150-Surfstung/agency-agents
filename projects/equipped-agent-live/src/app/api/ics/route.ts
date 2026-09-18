import { NextRequest, NextResponse } from "next/server";
import { icsFor } from "@/lib/ics";

export function GET(req: NextRequest) {
  const ref = (req.nextUrl.searchParams.get("ref") ?? "EA-000000").slice(0, 24);
  const attend = req.nextUrl.searchParams.get("attend") ?? "in-person";
  return new NextResponse(icsFor(ref, attend), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="equipped-agent.ics"',
      "Cache-Control": "no-store",
    },
  });
}
