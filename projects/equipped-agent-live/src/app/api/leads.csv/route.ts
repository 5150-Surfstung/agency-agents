// The night's leads as a CSV — one click from the console drawer.

import { NextRequest, NextResponse } from "next/server";
import { getStore } from "@/lib/store";

function esc(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replaceAll('"', '""')}"` : v;
}

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  try {
    const store = getStore();
    if (!key || (await store.checkKey(key)) !== "presenter") {
      return NextResponse.json({ ok: false, error: "not_presenter" }, { status: 401 });
    }

    const leads = await store.listLeads(key);
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
  } catch {
    return NextResponse.json({ ok: false, error: "store_error" }, { status: 502 });
  }
}
