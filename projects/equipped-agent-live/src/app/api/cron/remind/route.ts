// VAL'S TWO REMINDERS.
//
// Runs once a day at 7am Eastern and does nothing at all on every day except
// two: the 30th, when it sends the two-day note, and the morning of the 2nd.
// The date is decided in Eastern time rather than UTC, because "the morning
// of" means Mike's morning and a server in another zone would fire it on the
// wrong day — the single most common way a scheduled reminder goes out at
// midnight to the wrong people.
//
// WHY IT CANNOT DOUBLE-SEND. Each row is stamped in Postgres only AFTER the
// provider confirms that message went, and the query that selects who is due
// excludes anything already stamped for that kind. A run that dies halfway
// resumes exactly where it stopped; a run that repeats sends nothing twice.
//
// It is also safe to call by hand with the same secret, which is how it gets
// tested before it matters.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { emailOnline, sendEmail } from "@/lib/mailer";
import { remindHtml, remindSubject, remindText, type Kind } from "@/lib/remind-mail";
import type { Attend } from "@/lib/rsvp-mail";
import { HOST } from "@/lib/contact";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SUPABASE_URL = process.env.SUPABASE_URL || "https://iwotispqqcnkrbcnvozq.supabase.co";
const SUPABASE_ANON =
  process.env.SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3b3Rpc3BxcWNua3JiY252b3pxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5ODk5MTQsImV4cCI6MjA5NzU2NTkxNH0.cnvrHhZkrygCNuxMQitqsS9TBqC_1Uy0h6ymh9jmppY";

/** Today's date in Mike's timezone, as YYYY-MM-DD. */
function todayET(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

const EVENT_DAY = "2026-10-02";
const TWO_DAY = "2026-09-30";

function kindForToday(): Kind | null {
  const d = todayET();
  if (d === TWO_DAY) return "two_day";
  if (d === EVENT_DAY) return "morning";
  return null;
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization") ?? "";
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  // `?kind=` is for testing before the day arrives; without it the calendar
  // decides, which is what runs in production.
  const forced = req.nextUrl.searchParams.get("kind");
  const dry = req.nextUrl.searchParams.get("dry") === "1";
  const kind: Kind | null =
    forced === "two_day" || forced === "morning" ? (forced as Kind) : kindForToday();

  if (!kind) {
    return NextResponse.json({ ok: true, ranOn: todayET(), kind: null, sent: 0, note: "nothing due today" });
  }
  if (!emailOnline()) {
    console.error("[cron/remind] mailer offline — nobody was reminded");
    return NextResponse.json({ ok: false, error: "mailer_offline", kind }, { status: 503 });
  }

  const db = createClient(SUPABASE_URL, SUPABASE_ANON, { auth: { persistSession: false } });
  const { data, error } = await db.rpc("live_rsvp_due", { p_key: secret, p_kind: kind });
  if (error) {
    console.error("[cron/remind] could not read who is due", error.message);
    return NextResponse.json({ ok: false, error: "read_failed" }, { status: 502 });
  }

  const rows = (data ?? []) as { ref: string; name: string; email: string; attend: string }[];
  if (dry) {
    return NextResponse.json({ ok: true, kind, ranOn: todayET(), due: rows.length, dry: true });
  }

  let sent = 0;
  const failed: string[] = [];
  for (const r of rows) {
    const attend = (["in-person", "zoom", "either"].includes(r.attend) ? r.attend : "in-person") as Attend;
    const went = await sendEmail({
      to: r.email,
      replyTo: HOST.email,
      subject: remindSubject(kind, r.ref),
      text: remindText(kind, r.name, r.ref, attend),
      html: remindHtml(kind, r.name, r.ref, attend),
    });
    if (!went) {
      failed.push(r.ref);
      continue;
    }
    // Stamped only now. A send that did not happen stays due.
    const { error: markErr } = await db.rpc("live_rsvp_mark", { p_key: secret, p_ref: r.ref, p_kind: kind });
    if (markErr) console.error("[cron/remind] sent but could not stamp", r.ref, markErr.message);
    sent += 1;
  }

  if (failed.length) console.error("[cron/remind] failed to send", kind, failed.join(", "));
  return NextResponse.json({ ok: true, kind, ranOn: todayET(), due: rows.length, sent, failed });
}
