// WHAT THEY ACTUALLY WALK AWAY WITH, AND WHERE THEY PUT IT.
//
// Two things were missing from the take-home and both were the same kind of
// missing: the page told somebody to run an interview and copy a block, and
// never said what the block DOES or where it goes. An agent who finishes a
// twenty-minute interview holding a file they do not understand and cannot
// install has not been given an assistant — they have been given homework.
//
// THE THING TO BE CLEAR ABOUT, BECAUSE IT IS THE FIRST FEAR EVERY TIME: none
// of this needs code. The interview runs in the chat box on claude.ai. What
// comes back is text, not a program. There is no terminal, no editor, no
// repository, no install, and nothing to run. The single file-shaped step in
// the whole thing — zipping a Skill — is the OPTIONAL one, and there are two
// ways to keep the same assistant permanently without ever touching a file.
//
// Written once here and read by both the interview prompt and the kit page,
// so what Val promises in the conversation and what the page says are the
// same words rather than two drifting descriptions of the same product.

/** WHAT VAL DOES.
 *
 *  Taken from what the interview actually writes into the skill — the gaps,
 *  the recurring jobs, the rules and the mark — rather than from a list of
 *  things an assistant could theoretically do. If a line here is not backed
 *  by a section the prompt produces, it does not belong on the page. */
export const VAL_DOES: [string, string][] = [
  [
    "Knows your work without being told again",
    "It carries your trade, your market, your clients and the way you talk into every conversation — so you stop re-explaining your own business to a blank box every morning.",
  ],
  [
    "Drafts in your voice, not a robot's",
    "Follow-ups, listing copy, a reply to the message that came in at nine at night, the awkward one you have been avoiding since Tuesday. It writes them the way you write them, because the interview captured how you talk.",
  ],
  [
    "Works the three gaps it found in you",
    "The interview names the three places your work actually leaks, worst first, and the assistant is built pointing at those. It is not general-purpose — it is aimed.",
  ],
  [
    "Runs your recurring jobs",
    "The things you said you do every week and hate — the weekly round of check-ins, the same five updates, the list you rebuild by hand — it handles those specifically, the way you said you want them handled.",
  ],
  [
    "Counts the dates instead of remembering them",
    "Give it the contract dates and it counts the deadlines off them and names the paragraph that governs. It will not rule on the contract, and it says so — that goes to the closing attorney.",
  ],
  [
    "Argues with you",
    "It is written to be short, specific, and willing to disagree. An assistant that agrees with a bad decision is worth nothing, and this one is told that in as many words.",
  ],
  [
    "Refuses instead of inventing",
    "It will not make up a number, a date, a square footage or a fact. When it does not have something it says so and says where it would come from — which is the only reason it is safe to put in front of a client.",
  ],
  [
    "Never claims it did something it didn't",
    "It drafts and it calculates. You send, you file, you book. It will never tell you a thing was sent, scheduled or submitted, because it cannot do those and pretending otherwise is how people end up trusting the wrong thing.",
  ],
  [
    "Builds you a living mark on command",
    "Say four words — build my mark — and it produces the turning wireframe in your colours, out of your objects, as one file you double-click. That is the thing on this page, made yours.",
  ],
];

/** Hard lines the assistant carries whatever trade it is built for. Named on
 *  the page as well as written into the file, because the reason an agent can
 *  put this in front of a client is the refusals, not the features. */
export const VAL_WONT: string[] = [
  "Invent a fact, a number or a date it was not given.",
  "Claim it sent, filed, booked or scheduled anything.",
  "Promise an outcome — not a price, not an approval, not a timeline.",
  "Rule on law, tax, medicine or financing as though it were settled.",
  "For real estate: describe an area or a property by the people in it. Fair housing is absolute, and the assistant turns those questions into sources the client can check themselves.",
];

/** WHERE TO PUT IT — three routes, easiest first.
 *
 *  Ordered by how little setup each one needs, not by which is most capable,
 *  because the person reading this has just spent twenty minutes answering
 *  questions and the next thing they meet should not be a wall.
 *
 *  Written so no route can dead-end: each one says what to do if the thing it
 *  names is not on their screen. Plan tiers and menu labels move around, and
 *  a printed instruction that is wrong next month is worse than one that
 *  tells somebody how to find their own way. */
export const INSTALL: { name: string; time: string; how: string; note: string }[] = [
  {
    name: "Keep talking to it right now",
    time: "nothing to do",
    how:
      "When the interview finishes, it is already your assistant in that conversation. Ask it something from today — a follow-up you owe, a listing description, the message you have been avoiding. It works immediately.",
    note:
      "This costs nothing and needs no plan. The only limit is that the conversation ends eventually, which is what the other two fix.",
  },
  {
    name: "Put it in a Project",
    time: "about a minute",
    how:
      "Make a new Project in the left sidebar of claude.ai, open its instructions or custom-instructions box, and paste the whole block in. Every chat you start inside that Project is your assistant, already knowing everything, forever.",
    note:
      "No files, no upload, nothing zipped. If you do not see Projects in your sidebar, skip to the next one or stay on the first — you have not done anything wrong.",
  },
  {
    name: "Install it as a Skill",
    time: "about five minutes",
    how:
      "Put the block in a plain text file named SKILL.md, put that file in a folder on its own, zip the folder, then in claude.ai open Settings and look for Skills or Capabilities and upload the zip. After that it is available in any conversation without pasting anything.",
    note:
      "This is the only step in the whole thing that touches a file, and it is optional. Custom skills need a paid plan — if you do not see the upload, use the Project route instead and you lose nothing that matters.",
  },
];

/** The first thing to say to it, whichever route they took. A new assistant
 *  that gets asked a real question on day one gets used; one that gets
 *  admired and closed does not. */
export const FIRST_MOVES: string[] = [
  "build my mark",
  "Write the follow-up I owe the people who came through on Sunday.",
  "Here are my two contract dates. Count every deadline off them and tell me what is due first.",
  "What did I tell you I was secretly not good at, and what are you doing about it?",
];
