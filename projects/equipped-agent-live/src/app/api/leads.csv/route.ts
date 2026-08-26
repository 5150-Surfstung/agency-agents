// The night's leads as a CSV — one click from the console drawer.

import { NextRequest, NextResponse } from "next/server";
import { isPresenter } from "@/lib/room";
import { getStore } from "@/lib/store";

function esc(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replaceAll('"', '""')}"` : v;
}

export async function GET(req: NextRequest) {
  if (!isPresenter(req.nextUrl.searchParams.get("key"))) {
    return NextResponse.json({ ok: false, error: "not_presenter" }, { status: 401 });
  }

  const leads = await getStore().listLeads();
  const rows = [
    "name,cell,next_step,captured_at",
    ...leads.map((l) => [esc(l.name), esc(l.cell), esc(l.rung), new Date(l.at).toISOString()].join(",")),
  ].join("\n");

  return new NextResponse(rows, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="equipped-agent-leads.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
