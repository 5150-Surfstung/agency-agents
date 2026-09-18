// A local eyeball on the email. Not linked from anywhere and harmless in
// production: it renders the same builder the sender uses, so what you look
// at here is what lands in somebody's inbox.
import { NextRequest, NextResponse } from "next/server";
import { kitHtml } from "@/lib/kit";

export function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name") ?? "Dana Whitfield";
  const ref = req.nextUrl.searchParams.get("ref") ?? "EA-DEMO01";
  return new NextResponse(kitHtml(name, ref), {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
