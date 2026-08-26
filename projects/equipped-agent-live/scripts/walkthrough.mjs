// End-to-end walkthrough against a running dev server: three phones join,
// the presenter drives, votes land, the reveal tallies, the ladder captures
// a lead, and the CSV includes it. Exits non-zero on the first failed check.
//
//   npm run dev   (in one terminal)
//   npm run walkthrough

const BASE = process.env.BASE_URL || "http://localhost:3000";
const PIN = process.env.LIVE_ROOM_PIN || "1054";
const KEY = process.env.LIVE_PRESENTER_KEY || "dev-presenter";

let failures = 0;
function check(name, cond, extra = "") {
  const mark = cond ? "✓" : "✗";
  console.log(`${mark} ${name}${cond || !extra ? "" : ` — ${extra}`}`);
  if (!cond) failures++;
}

async function join(pin = PIN) {
  const res = await fetch(`${BASE}/api/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pin }),
  });
  const cookie = res.headers.get("set-cookie")?.split(";")[0] ?? "";
  return { status: res.status, cookie };
}

const jfetch = (cookie) => async (path, init = {}) => {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", cookie, ...(init.headers || {}) },
  });
  let body = null;
  try {
    body = await res.json();
  } catch {}
  return { status: res.status, body };
};

async function control(action, step) {
  const res = await fetch(`${BASE}/api/control`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key: KEY, action, step }),
  });
  return res.json();
}

// --- run -------------------------------------------------------------

console.log(`walkthrough against ${BASE}\n`);

// A wrong PIN stays outside.
check("wrong PIN rejected", (await join("0000")).status === 401);

// Three phones in.
const phones = [];
for (let i = 0; i < 3; i++) {
  const j = await join();
  check(`phone ${i + 1} joined`, j.status === 200 && j.cookie.length > 10);
  phones.push(jfetch(j.cookie));
}

// State requires a session.
check("no cookie → 401 state", (await fetch(`${BASE}/api/state`)).status === 401);

// Presenter resets to the top, then walks to the first poll slide (step 1).
await control("goto", 0);
let snap = await control("goto", 1);
check("presenter on poll slide", snap.ok && snap.step === 1);

// Voting before the poll opens is refused.
let r = await phones[0]("/api/vote", { method: "POST", body: JSON.stringify({ pollKey: "time", choice: 0 }) });
check("vote before open → 409", r.status === 409);

// Open, vote from all three (one changes their mind), reveal.
snap = await control("poll");
check("poll open", snap.pollState === "open");
r = await phones[0]("/api/vote", { method: "POST", body: JSON.stringify({ pollKey: "time", choice: 0 }) });
check("phone 1 voted", r.status === 200);
await phones[1]("/api/vote", { method: "POST", body: JSON.stringify({ pollKey: "time", choice: 1 }) });
await phones[2]("/api/vote", { method: "POST", body: JSON.stringify({ pollKey: "time", choice: 1 }) });
r = await phones[0]("/api/vote", { method: "POST", body: JSON.stringify({ pollKey: "time", choice: 3 }) });
check("revote while open", r.status === 200);

r = await phones[0]("/api/state");
check("counts hidden while open", r.body.counts === null);

snap = await control("poll");
check("poll revealed", snap.pollState === "revealed");
check("tally = [0,2,0,1]", JSON.stringify(snap.counts) === "[0,2,0,1]", JSON.stringify(snap.counts));

r = await phones[0]("/api/state");
check("attendee sees revealed counts", JSON.stringify(r.body.counts) === "[0,2,0,1]");
check("attendee sees own vote", r.body.myVote === 3);

// Vote after reveal is refused.
r = await phones[1]("/api/vote", { method: "POST", body: JSON.stringify({ pollKey: "time", choice: 2 }) });
check("vote after reveal → 409", r.status === 409);

// Arcade is gated until its slide.
r = await phones[0]("/api/tool/sparring", { method: "POST", body: JSON.stringify({ scenario: "fsbo", messages: [] }) });
check("arcade locked early → 409", r.status === 409);
r = await phones[0]("/api/state");
check("arcadeOpen false early", r.body.arcadeOpen === false);

// Jump to the ladder poll, run the capture flow.
const ladderStep = 11;
snap = await control("goto", ladderStep);
check("on ladder slide", snap.step === ladderStep);
r = await phones[0]("/api/state");
check("arcadeOpen true late", r.body.arcadeOpen === true);
await control("poll");
await phones[0]("/api/vote", { method: "POST", body: JSON.stringify({ pollKey: "ladder", choice: 3 }) });
await control("poll");
r = await phones[0]("/api/lead", { method: "POST", body: JSON.stringify({ name: "Test Agent", cell: "843-555-0100", rung: "All of it" }) });
check("lead captured", r.status === 200);

// Missing fields refused.
r = await phones[1]("/api/lead", { method: "POST", body: JSON.stringify({ name: "", cell: "", rung: "x" }) });
check("empty lead → 400", r.status === 400);

// Console sees it; CSV exports it; both locked to the presenter key.
snap = await control("goto", ladderStep); // any control POST returns a snapshot
check("console lists the lead", snap.leads.length === 1 && snap.leads[0].name === "Test Agent");
const csvRes = await fetch(`${BASE}/api/leads.csv?key=${encodeURIComponent(KEY)}`);
const csv = await csvRes.text();
check("CSV carries the lead", csvRes.status === 200 && csv.includes("Test Agent"));
check("CSV without key → 401", (await fetch(`${BASE}/api/leads.csv`)).status === 401);
check("control without key → 401", (await fetch(`${BASE}/api/control?key=nope`)).status === 401);

// Arcade honesty: with no ANTHROPIC_API_KEY the tool says offline, never fakes.
if (!process.env.ANTHROPIC_API_KEY) {
  r = await phones[0]("/api/tool/listing", {
    method: "POST",
    body: JSON.stringify({ facts: "123 Main St, $500,000", agentLabel: "Test", messages: [{ role: "user", content: "price?" }] }),
  });
  check("engine offline → 503 (honest)", r.status === 503 && r.body.error === "offline");
} else {
  r = await phones[0]("/api/tool/listing", {
    method: "POST",
    body: JSON.stringify({
      facts: "123 Main St, Johns Island. $500,000. 3 bed, 2 bath, 1,800 sqft.",
      agentLabel: "Test Agent",
      messages: [{ role: "user", content: "How many bedrooms, and what year was the roof replaced?" }],
    }),
  });
  const reply = r.body?.reply ?? "";
  check("listing tool replies", r.status === 200 && reply.length > 0);
  check("states the fact (3 bed)", /3 bed/i.test(reply) || /three bed/i.test(reply), reply.slice(0, 160));
  check(
    "refuses the unknown (roof)",
    /don't (want to guess|know|have)/i.test(reply) || /confirm/i.test(reply),
    reply.slice(0, 160)
  );
  r = await phones[0]("/api/tool/sparring", { method: "POST", body: JSON.stringify({ scenario: "interview", messages: [] }) });
  check("ring opens in character", r.status === 200 && (r.body.reply ?? "").length > 0);
}

// Back to the top for a clean room.
await control("goto", 0);

console.log(failures === 0 ? "\nall green" : `\n${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
