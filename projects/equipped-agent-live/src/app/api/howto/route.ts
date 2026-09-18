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
import { starterPrompt } from "@/lib/prompts";
import { HOST } from "@/lib/contact";
import { EVENT } from "@/lib/event";

export function GET(req: NextRequest) {
  const name = (req.nextUrl.searchParams.get("name") ?? "").slice(0, 80).trim();
  const ref = (req.nextUrl.searchParams.get("ref") ?? "").slice(0, 24).trim() || "your reference";
  const first = name.split(/\s+/)[0] || "there";

  const doc = `THE EQUIPPED AGENT — WHAT TO DO BEFORE FRIDAY
${"=".repeat(46)}

${first}, your seat is held. Reference ${ref}.
${EVENT.date} · ${EVENT.time}
${EVENT.place}

Bring a laptop with Claude on it and your phone. Both. The free tier is
genuinely fine for the class.

This file is everything, in order. It takes about twenty minutes and you do
not need to have done anything like it before.


STEP 1 — OPEN CLAUDE
${"-".repeat(46)}
Go to claude.ai in a browser and sign in. Free is fine. Start a new chat.


STEP 2 — PASTE THE WHOLE THING BELOW
${"-".repeat(46)}
Everything between the two lines of equals signs is one message. Copy all of
it and paste it as your first message in that new chat. Do not edit it. Do
not paste it in pieces.


STEP 3 — ANSWER ITS QUESTIONS HONESTLY
${"-".repeat(46)}
It asks one question at a time. There are about a dozen. Answer them the way
you would talk to a colleague, not the way you would fill in a form. "I don't
know" is a real answer and it will move on.

The vague answers are where the useful stuff is. If it asks what you are
secretly not good at, tell it.


STEP 4 — IT WRITES YOU A SKILL. KEEP IT.
${"-".repeat(46)}
At the end it hands you a block of text that starts with three dashes. That
is a Skill — a permanent version of your assistant that already knows your
market, your brokerage and your three biggest gaps.

You have two ways to use it, and the free one works fine:

  IF YOU ARE ON THE FREE PLAN
  Keep that block somewhere you can get to it — a note, a doc, anywhere.
  Paste it at the top of a new chat whenever you want your assistant back.
  That is it. Nothing else to set up.

  IF YOU ARE ON A PAID PLAN (Pro, Max, Team or Enterprise)
  You can install it so it is always there and you never paste again:
    1. Save the block as a file called exactly  SKILL.md
    2. Put that file in a folder named after the skill
    3. Compress the folder into a .zip
    4. In Claude, open Settings, find Features, and upload the .zip
  Custom skills are per person, so each agent on your team does their own.


STEP 5 — THEN SAY FOUR WORDS
${"-".repeat(46)}
With the skill in play, say to it:

    build my mark

It will write you a single HTML file. Save it, double-click it, and you get a
living version of your brand — a wireframe that turns through your objects in
your colours, the way the one on the invitation page does. It is yours. Put
it on a laptop at an open house, or screen-record it for social.

If what comes back looks like a tangled ball instead of a house, tell it:
"the sphere links are still on during the shape — apply the group rule." It
will know what you mean and fix it.


STEP 6 — BRING IT FRIDAY
${"-".repeat(46)}
Bring what it built you. Half the room will have made something, and the part
after the hour — when people put what they made on the screen — is usually
the best part. If yours is rough, bring it rough. That is the point.


IF ANYTHING GOES SIDEWAYS
${"-".repeat(46)}
Text ${HOST.cell} or email ${HOST.email} with ${ref}. Bring the problem
Friday if it is easier — we will fix it on the screen.

${HOST.full}
${HOST.title}, ${HOST.org}
REALTOR, ${HOST.brokerage}


${"=".repeat(46)}
PASTE EVERYTHING BELOW THIS LINE AS ONE MESSAGE
${"=".repeat(46)}

${starterPrompt(name, ref)}

${"=".repeat(46)}
END — nothing after this line goes in the chat.
`;

  return new NextResponse(doc, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="equipped-agent-${ref}.txt"`,
      "Cache-Control": "no-store",
    },
  });
}
