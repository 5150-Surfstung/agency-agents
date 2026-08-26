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

// Three phones in — and suited up (jersey = initials + emoji).
const phones = [];
const JERSEYS = [
  { initials: "AAA", emoji: "🦈" },
  { initials: "BBB", emoji: "🔥" },
  { initials: "CCC", emoji: "👑" },
];
for (let i = 0; i < 3; i++) {
  const j = await join();
  check(`phone ${i + 1} joined`, j.status === 200 && j.cookie.length > 10);
  phones.push(jfetch(j.cookie));
}
for (let i = 0; i < 3; i++) {
  const r = await phones[i]("/api/profile", { method: "POST", body: JSON.stringify(JERSEYS[i]) });
  check(`phone ${i + 1} suited up`, r.status === 200 && r.body.initials === JERSEYS[i].initials);
}
{
  const r = await phones[0]("/api/profile", { method: "POST", body: JSON.stringify({ initials: "X", emoji: "🦈" }) });
  check("1-letter jersey → 400", r.status === 400);
  const s = await phones[0]("/api/state");
  check("state carries my jersey", s.body.me?.initials === "AAA" && s.body.me?.emoji === "🦈");
}

// State requires a session.
check("no cookie → 401 state", (await fetch(`${BASE}/api/state`)).status === 401);

// Presenter resets to the top, then walks to the first poll slide (step 1).
await control("goto", 0);
let snap = await control("goto", 5);
check("presenter on poll slide", snap.ok && snap.step === 5);

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
check("live counts while open (game-show bars)", Array.isArray(r.body.counts) && r.body.counts.reduce((a, b) => a + b, 0) === 3);

snap = await control("poll");
check("poll revealed", snap.pollState === "revealed");
check("tally = [0,2,0,1]", JSON.stringify(snap.counts) === "[0,2,0,1]", JSON.stringify(snap.counts));

r = await phones[0]("/api/state");
check("attendee sees revealed counts", JSON.stringify(r.body.counts) === "[0,2,0,1]");
check("attendee sees own vote", r.body.myVote === 3);

// Vote after reveal is refused.
r = await phones[1]("/api/vote", { method: "POST", body: JSON.stringify({ pollKey: "time", choice: 2 }) });
check("vote after reveal → 409", r.status === 409);

// Price Is Right: slider guesses ride the vote rail as $thousands.
snap = await control("goto", 9);
check("on price slide", snap.step === 9);
await control("poll");
r = await phones[0]("/api/vote", { method: "POST", body: JSON.stringify({ pollKey: "price1", choice: 824 }) });
check("price guess accepted", r.status === 200);
r = await phones[1]("/api/vote", { method: "POST", body: JSON.stringify({ pollKey: "price1", choice: 300 }) });
check("out-of-range guess → 400", r.status === 400);
await phones[1]("/api/vote", { method: "POST", body: JSON.stringify({ pollKey: "price1", choice: 760 }) });
await phones[2]("/api/vote", { method: "POST", body: JSON.stringify({ pollKey: "price1", choice: 700 }) });
r = await phones[0]("/api/state");
check("answer hidden pre-reveal", JSON.stringify(r.body).includes("soldK") === false);
snap = await control("poll");
check("price values on console", Array.isArray(snap.priceValues) && snap.priceValues.some((v) => v.value === 824));
check(
  "podium paid, closest first (AAA at 824 vs 797)",
  Array.isArray(snap.podium) && snap.podium[0]?.initials === "AAA" && snap.podium[0]?.points === 100,
  JSON.stringify(snap.podium)
);
r = await phones[0]("/api/state");
check(
  "price reveal on phone (record + arithmetic anchor)",
  r.body.priceReveal?.values?.length >= 3 && r.body.priceReveal.soldK === 797 && r.body.priceReveal.anchorK === 719,
  JSON.stringify({ soldK: r.body.priceReveal?.soldK, anchorK: r.body.priceReveal?.anchorK })
);
check("reveal labels the number honestly", r.body.priceReveal?.soldLabel === "ACTUALLY CLOSED");
check("my rank on my phone (AAA = #1)", r.body.priceReveal?.myRank === 1, String(r.body.priceReveal?.myRank));
r = await phones[2]("/api/state");
check("farthest guess ranks #3", r.body.priceReveal?.myRank === 3, String(r.body.priceReveal?.myRank));

// Stump is gated to its slide; without a key it refuses honestly.
r = await phones[0]("/api/stump", { method: "POST", body: JSON.stringify({ question: "roof year?" }) });
check("stump off-slide → 409", r.status === 409);
snap = await control("goto", 12);
if (!process.env.ANTHROPIC_API_KEY) {
  r = await phones[0]("/api/stump", { method: "POST", body: JSON.stringify({ question: "What year was the roof replaced?" }) });
  check("stump engine offline → 503 (honest)", r.status === 503);
}

// Leaderboard: self-reported ring scores.
snap = await control("goto", 15);
r = await phones[0]("/api/score", { method: "POST", body: JSON.stringify({ initials: "MO", score: 9 }) });
check("score posted", r.status === 200);
r = await phones[1]("/api/score", { method: "POST", body: JSON.stringify({ initials: "X", score: 8 }) });
check("1-letter initials → 400", r.status === 400);
snap = await control("goto", 15);
check("ring board shows MO 9/10", (snap.scoreboard ?? []).some((s) => s.initials === "MO" && s.best === 9));

// THE BOARD: AAA = time 10 + price1 10 + podium 100 + ring 90 = 210.
check(
  "THE BOARD crowns AAA at 210",
  (snap.standings ?? [])[0]?.initials === "AAA" && (snap.standings ?? [])[0]?.points === 210,
  JSON.stringify((snap.standings ?? []).slice(0, 3))
);
check("THE BOARD lists all three jerseys", (snap.standings ?? []).length === 3);
r = await phones[0]("/api/state");
check("phone sees its own rank and points", r.body.board?.myRank === 1 && r.body.board?.myPoints === 210,
  JSON.stringify(r.body.board));

// Jump to the ladder poll, run the capture flow.
const ladderStep = 18; // host 1 · comfort 2 · using 3 · floor 4 · time 5 · price 9 · stump 12 · seed 14 · board 15 · ladder 18
snap = await control("goto", ladderStep);
check("on ladder slide", snap.step === ladderStep);
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

// The always-on join QR: presenter mints it, the console knows the PIN,
// and a scanned ?pin= URL actually joins.
check("console snapshot carries the PIN", snap.pin === PIN, String(snap.pin));
const qrRes = await fetch(`${BASE}/api/qr?key=${encodeURIComponent(KEY)}`);
check("QR mints for the presenter", qrRes.status === 200 && (qrRes.headers.get("content-type") ?? "").includes("image/png"));
check("QR without key → 401", (await fetch(`${BASE}/api/qr`)).status === 401);
{
  const res = await fetch(`${BASE}/api/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pin: PIN }),
  });
  check("scan-link PIN joins (the ?pin= path)", res.status === 200);
}

// Assistant To Go: build a pack, fetch it publicly, wrong code 404s.
r = await phones[0]("/api/pack", {
  method: "POST",
  body: JSON.stringify({ name: "Jordan Test", brokerage: "Test Realty", area: "Johns Island", specialty: "", tone: "warm" }),
});
const packCode = r.body?.code;
check("pack minted", r.status === 200 && typeof packCode === "string" && packCode.length === 6, packCode);
r = await phones[0](`/api/pack?code=${packCode}`);
check("pack fetch by code", r.status === 200 && r.body.pack?.name === "Jordan Test");
check("pack fetch omits device", r.body.pack?.deviceId === undefined);
check("bad pack code → 404", (await phones[0]("/api/pack?code=ZZZZZZ")).status === 404);
const packPage = await fetch(`${BASE}/pack/${packCode}`);
check("pack page renders", packPage.status === 200 && (await packPage.text()).includes("Jordan Test"));

// With a live key, Stump proves grounding end-to-end (states facts, refuses unknowns).
if (process.env.ANTHROPIC_API_KEY) {
  await control("goto", 12);
  r = await phones[0]("/api/stump", {
    method: "POST",
    body: JSON.stringify({ question: "How many bedrooms, and what year was the roof replaced?" }),
  });
  const reply = r.body?.answer ?? "";
  check("stump replies", r.status === 200 && reply.length > 0);
  check("states the fact (4 bed)", /4 bed|four bed/i.test(reply), reply.slice(0, 160));
  check("refuses the unknown (roof)", r.body?.refused === true, reply.slice(0, 160));
}

// Back to the top for a clean room.
await control("goto", 0);

console.log(failures === 0 ? "\nall green" : `\n${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
