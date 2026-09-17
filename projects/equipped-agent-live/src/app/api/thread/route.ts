// The visitor's half of a live conversation. A stranger on an assistant page
// polls this to see anything that arrived since their last message — which is
// how a human breaking in from the switchboard reaches them without a reload.
//
// No key: holding the thread id is the capability, exactly like holding the
// assistant's code. Nothing here identifies a person.

import { NextRequest, NextResponse } from "next/server";
import { isThreadId } from "@/lib/thread";
import { getStore } from "@/lib/store";

export async function GET(req: NextRequest) {
  const t = req.nextUrl.searchParams.get("t") ?? "";
  const after = Number(req.nextUrl.searchParams.get("after") ?? 0) || 0;
  if (!isThreadId(t)) return NextResponse.json({ ok: false, error: "bad_thread" }, { status: 400 });
  try {
    const { messages, operator } = await getStore().threadPoll(t, after);
    return NextResponse.json({ ok: true, messages, operator });
  } catch {
    return NextResponse.json({ ok: false, error: "store_error" }, { status: 502 });
  }
}
