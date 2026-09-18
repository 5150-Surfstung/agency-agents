// THE KIT — everything of value, in one place, sent to them.
//
// The invite used to carry all of this inline, which made it fifteen phone
// screens deep and buried the ask. The page now makes the argument and takes
// the seat; this is what lands afterwards, and it is deliberately the heavier
// of the two. Somebody who signs up should feel like the good part arrived
// after they said yes, not that they already read it all.
//
// One builder, two renderings. The plain-text version is the same document as
// the downloadable file, so the two can never drift and say different things.

import { starterPrompt, orbPrompt } from "./prompts";
import { HOST } from "./contact";
import { EVENT } from "./event";

export const SERIES = [
  ["Friday, October 2", "The one you booked"],
  ["Friday, November 6", "Next one"],
  ["Friday, December 4", "The one after"],
] as const;

export const MLS_ASKS = [
  "What are days on market doing in West Ashley this quarter versus last?",
  "How much inventory is actually sitting in 29407 right now?",
  "What is the absorption rate in my farm — how many months of supply?",
  "List-to-sale price ratio in my neighbourhood this year, by month.",
  "Every three-bedroom under $500k that came on this week in my ZIP.",
  "What did my own listings do last month?",
];

/** What Surfstung actually builds, in the words of its own pattern library.
 *  Every line here is a shelf that exists — no invented case studies, and no
 *  numbers, because a number we cannot defend on a client's own data is not
 *  ours to print. */
export const SURFSTUNG_WORK = [
  ["A scan that becomes a lead", "Signs, riders, stickers and per-listing pages where the first sixty seconds after a scan are owned rather than lost."],
  ["A front desk that does not sleep", "After-hours calls and messages answered and qualified, instead of a voicemail nobody returns."],
  ["Bookings without a phone call", "Tours, charters, rentals, day passes and deposits, taken online and confirmed."],
  ["The same job, ten thousand times", "One operation run per item or per row, at a cost per run you can put in front of a CFO."],
  ["Pipelines with a human in the gate", "Staged work that reruns cleanly and never ships a step nobody checked."],
  ["Work that cannot leave the building", "On-prem and air-gapped builds for data under HIPAA, CJIS or legal hold."],
  ["A tablet that closes in the room", "Guided, rep-facing consults for the in-home sale."],
  ["A live room where the phones are the show", "Which is what you are looking at: this invitation, the class, the polling and the screen are all one build."],
] as const;

export function kitText(name: string, ref: string): string {
  const first = (name || "").trim().split(/\s+/)[0] || "there";
  const R = ref || "your reference";
  const rule = (c = "-") => c.repeat(58);

  return `THE EQUIPPED AGENT — YOUR KIT
${rule("=")}

${first}, your seat is held. Reference ${R}.
${EVENT.date} · ${EVENT.time}
${EVENT.place}

Bring a laptop with Claude on it and your phone. Both. The free tier is
genuinely fine for everything in the hour.

Everything below is yours to keep whether you make it on the 2nd or not.


WHAT TO DO TONIGHT (about twenty minutes)
${rule()}
1. Go to claude.ai in a browser and sign in. Free is fine. New chat.
2. Copy everything in PROMPT ONE below — all of it, one message — and paste
   it as your first message.
3. Answer its questions honestly. It asks one at a time. The vague answers
   are where the useful part is.
4. It hands you back a block starting with three dashes. That is YOUR
   assistant. Keep it.
5. Say four words to it: build my mark.
6. Bring what it made you on Friday.


KEEPING YOUR ASSISTANT
${rule()}
ON THE FREE PLAN — keep the block in a note and paste it at the top of a new
chat whenever you want your assistant back. Works fine.

ON A PAID PLAN (Pro, Max, Team, Enterprise) — install it and never paste
again: save the block as a file called exactly SKILL.md, put it in a folder,
compress the folder to a .zip, then in Claude open Settings, find Features,
and upload the .zip. Custom skills are per person, so everybody on a team
does their own.

It is YOURS. It lives in your account, nobody here has a copy, and you can
open it and rewrite any line of it whenever you like. We only start it.


PROMPT ONE — BUILDS YOUR ASSISTANT
${rule("=")}
Paste everything between the lines as a single message.
${rule("=")}

${starterPrompt(name, R)}

${rule("=")}
END OF PROMPT ONE
${rule("=")}


PROMPT TWO — BUILDS YOUR MARK ON ITS OWN
${rule("=")}
Your assistant can already do this once it is set up — just say "build my
mark". This is the standalone version if you want it without the interview,
or if you want to hand it to somebody else.
${rule("=")}

${orbPrompt(name)}

${rule("=")}
END OF PROMPT TWO
${rule("=")}


WHAT WE DO IN THE ROOM ON THE 2ND
${rule()}
First fifteen — one listing answering its own phone, and refusing to invent
an answer when somebody asks it something nobody told it.

Next thirty — you build yours. Your listing, your account, your number on it.

Last fifteen — we switch on the FlexMLS connector and ask it about your farm,
live, on the screen. It is a settings screen and a key, not a project. These
are the kinds of questions you will be able to type in plain English:

${MLS_ASKS.map((q) => `  · ${q}`).join("\n")}

Afterwards — nobody gets rushed out. People put what they built on the
screen. That part is usually the best part. Bring yours rough.


WHAT VAL IS, AND WHY IT IS NOT A REAL-ESTATE THING
${rule()}
Val is the assistant that took your seat two minutes ago. It is not a
real-estate product — real estate is just where we have proved it hardest.

Underneath, Val is one idea: take the part of a business that only lives in
somebody's head or somebody's inbox, write it down properly, and put it
somewhere that answers instantly, at two in the morning, without inventing
anything. A dentist's front desk. A charter captain's booking calendar. A
contractor's quote follow-up. A law office's intake, on a machine that never
sends the file anywhere. Same idea every time; the vocabulary changes.

What that buys a business, plainly: the first sixty seconds after somebody
raises their hand stop being wasted, the work that gets dropped at 6pm stops
being dropped, and the thing you would only trust yourself to do gets done
the same way every time whether you are there or not.

The prompt in this email builds you a version of it for whatever you do. That
is not a trial or a teaser — it is yours, in your account, and you can rewrite
any line of it forever.


WHO BUILT THIS, AND WHAT ELSE THEY BUILD
${rule()}
Surfstung Systems. This invitation, the assistant that took your seat, the
class and the screen in the room are one build, and that is the point — it is
the same work we do for other people. If any of these is a problem you have:

${SURFSTUNG_WORK.map(([t, d]) => `  · ${t}\n    ${d}`).join("\n\n")}

That is not a menu, it is a list of things already built. If one of them is
yours, it is a conversation, not a proposal. ${HOST.email}

And to be clear about something, because it is the question people do not ask
out loud: we build for any agent, at any brokerage. You do not have to move
to eXp, or to The AGENT Connection, or anywhere. Come to the class, take the
prompts, have something built — none of it is contingent on where your
licence hangs.


TRACK TO KEYS
${rule()}
Two dates in, every deadline in the contract out, with what each one costs if
it slips and a plain-English version you can text your client the same night.
It is the thing agents ask us for twice a week.

TAC agents get exclusive pricing on it. It is not open for sign-up yet — ask
${HOST.first} about it in the room on the 2nd, or reply to this and he will
tell you where it is up to.


AND IF YOU ARE BUYING OR SELLING A HOUSE
${rule()}
${HOST.full} is a REALTOR with ${HOST.brokerage} and has been doing this
twenty years — inspector first, then agent, then multifamily. If you have
been idly wondering what yours is worth, or you know somebody moving, that is
a text to ${HOST.cell}. Not a commitment; worst case you find out and go back
to your day.


IF YOUR BROKERAGE FEELS A STEP BEHIND
${rule()}
Not a pitch, just where to put it. The AGENT Connection is a tech-driven team
with old-school experience — the tools are new, knowing the street and
remembering what somebody told you in March is not. Nobody will pitch you
from the front of the room. If you want the longer conversation — what the
team is, what eXp does differently, what the first ninety days look like — we
stay in the office afterwards. Coffee, no script.


IF ANYTHING GOES SIDEWAYS
${rule()}
Text ${HOST.cell} or email ${HOST.email} with ${R}. Or just bring the problem
Friday and we will fix it on the screen.

${HOST.full}
${HOST.title}, ${HOST.org}
REALTOR, ${HOST.brokerage}
${HOST.cell}
`;
}

/** An email client has no origin to resolve a relative path against, so every
 *  URL in the message has to be absolute. */
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://the-equipped-agent.vercel.app";

/** THE EMAIL, WHICH IS NOW SHORT ON PURPOSE.
 *
 *  It used to BE the kit — two full prompts inline, nine thousand pixels of
 *  message. Gmail clips anything over about 102KB behind "view entire
 *  message", a good share of clients block images by default, and copying a
 *  prompt out of a pre block on a phone is miserable. So the payload moved to
 *  a page keyed to their reference and this got out of its way: who they are,
 *  when it is, one button.
 *
 *  It also means the kit keeps improving after they book. They hold a link,
 *  not a copy, so a better prompt tomorrow reaches everybody who signed up
 *  yesterday. */
export function kitHtml(name: string, ref: string): string {
  const first = (name || "").trim().split(/\s+/)[0] || "there";
  const R = ref || "your reference";
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const ink = "#f2efe7";
  const soft = "#98a9ba";
  const faint = "#64788d";
  const gold = "#d0a050";
  const sheet = "#071320";
  const card = "#0c1c2c";
  const rule = "#1c3049";
  const url = `${SITE}/kit/${encodeURIComponent(R)}`;

  return `<!doctype html><html><body style="margin:0;padding:0;background:${sheet};">
<div style="max-width:560px;margin:0 auto;padding:28px 20px 40px;background:${sheet};font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">

  <p style="margin:0;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${faint};">Surfstung Systems with The AGENT Connection</p>

  <a href="${url}" style="text-decoration:none;">
    <img src="${SITE}/mail-banner.jpg" width="520" alt="The Equipped Agent" style="display:block;width:100%;max-width:520px;height:auto;margin:16px 0 0;border-radius:10px;border:1px solid ${rule};">
  </a>

  <h1 style="margin:22px 0 0;font-size:30px;line-height:1.08;letter-spacing:-0.03em;color:${ink};">Your seat is held, ${esc(first)}.</h1>

  <div style="margin-top:18px;padding:16px;background:${card};border-left:3px solid ${gold};border-radius:0 8px 8px 0;">
    <p style="margin:0;font-family:ui-monospace,Menlo,monospace;font-size:22px;letter-spacing:0.05em;color:${gold};">${esc(R)}</p>
    <p style="margin:8px 0 0;font-size:14px;line-height:1.6;color:${ink};">
      ${esc(EVENT.date)} · ${esc(EVENT.time)}<br>${esc(EVENT.place)}
    </p>
    <p style="margin:8px 0 0;font-size:13px;color:${faint};">Bring a laptop with Claude on it, and your phone. Both. Free tier is fine.</p>
  </div>

  <p style="margin:22px 0 0;font-size:16px;line-height:1.6;color:${ink};">
    Everything else lives on one page — both prompts with buttons that copy them,
    the files, and what we do on the 2nd. Bookmark it: the prompts keep getting
    better and that link always has the current ones.
  </p>

  <a href="${url}" style="display:block;margin:22px 0 0;padding:16px 20px;background:${gold};color:${sheet};border-radius:8px;text-align:center;text-decoration:none;font-size:17px;font-weight:700;">
    Open your kit
  </a>

  <p style="margin:14px 0 0;font-size:13px;line-height:1.6;color:${faint};">
    Or paste this in: ${esc(url)}
  </p>

  <div style="margin-top:30px;padding-top:18px;border-top:1px solid ${rule};">
    <p style="margin:0;font-size:14px;line-height:1.6;color:${soft};">
      Anything at all — reply to this, or text ${esc(HOST.cell)}.
    </p>
    <p style="margin:12px 0 0;font-size:14px;line-height:1.5;color:${ink};">
      <b>${esc(HOST.full)}</b><br>
      <span style="color:${gold};">${esc(HOST.title)}, ${esc(HOST.org)}</span><br>
      <span style="color:${faint};">REALTOR&reg;, ${esc(HOST.brokerage)} · ${esc(HOST.cell)}</span>
    </p>
  </div>
</div></body></html>`;
}
