// THE BUTTON MIKE PRESSES FROM THE STAGE.
//
// Deterministic on purpose. A model deciding when to fire, who to send to and
// what to paste is a model that can stall for six seconds while forty people
// watch him wait — Val's voice is in the writing, the send is code. Same rule
// the booking flow runs under, higher stakes.
//
// It reports a real delivered count so he does not say the line until he can
// see it landed, and it is idempotent in the way that matters: pressing it
// twice sends twice, which is recoverable, while a silent no-op in front of a
// room is not. The count is what tells him which happened.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { emailOnline, sendEmail } from "@/lib/mailer";
import { PROMPT_SUBJECT, promptHtml, promptText } from "@/lib/prompt-mail";
import { getStore } from "@/lib/store";
import { HOST } from "@/lib/contact";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SUPABASE_URL = process.env.SUPABASE_URL || "https://iwotispqqcnkrbcnvozq.supabase.co";
const SUPABASE_ANON =
  process.env.SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3b3Rpc3BxcWNua3JiY252b3pxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5ODk5MTQsImV4cCI6MjA5NzU2NTkxNH0.cnvrHhZkrygCNuxMQitqsS9TBqC_1Uy0h6ymh9jmppY";

export async function POST(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (!key || (await getStore().checkKey(key)) !== "presenter") {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!emailOnline()) {
    return NextResponse.json({ ok: false, error: "mailer_offline" }, { status: 503 });
  }

  const db = createClient(SUPABASE_URL, SUPABASE_ANON, { auth: { persistSession: false } });
  const { data, error } = await db.rpc("live_rsvp_room", { p_key: key });
  if (error) {
    return NextResponse.json({ ok: false, error: "read_failed" }, { status: 502 });
  }

  const rows = (data ?? []) as { ref: string; name: string; email: string }[];
  let sent = 0;
  const failed: string[] = [];
  for (const r of rows) {
    const went = await sendEmail({
      to: r.email,
      replyTo: HOST.email,
      subject: PROMPT_SUBJECT,
      text: promptText(r.name),
      html: promptHtml(r.name),
    });
    if (went) sent += 1;
    else failed.push(r.ref);
  }
  if (failed.length) console.error("[send-prompt] failed", failed.join(", "));
  return NextResponse.json({ ok: true, room: rows.length, sent, failed });
}
