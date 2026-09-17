# The Equipped Agent — 60-Minute Run Sheet

**Course:** The Equipped Agent — The Claude Course
**Sponsored by:** Mike Olson with The Agent Connection · built with Surfstung Systems
**Taught by:** Mike Olson, Technology & Innovation Director · REALTOR® · eXp Realty
**Guest segment:** Sean Jager (minute 54)
**Audience:** Working agents — new, experienced, and team leaders
**Job of the hour:** Teach three genuinely useful AI skills, run two games the room
plays on their own phones, hand every attendee an assistant they built themselves,
and end on the Agent Connection ladder. Teach first, recruit last — the teaching
*is* the recruiting.

---

## The room runs on the live app

| | |
|---|---|
| **Attendee room** | https://the-equipped-agent-surfstung-systems.vercel.app — one PIN at the door |
| **Presenter console** | `/present/<presenter-key>` — put this on your laptop, deck on the projector |
| **Seed page** (public, shareable after) | `/seed` |
| **Pre-room selftest** | `/api/selftest?key=<presenter-key>&deep=1` |

**Console keys:** `←` `→` move slides · `space` opens a poll, then reveals it (works
on the Price Is Right slider too) · `Q` throws the join QR up full-screen · `L`
opens the leads drawer.

**A join QR sits in the corner of every slide**, and the scan carries the PIN —
one scan and a phone is in the room mid-slide, no typing. That covers walk-ins,
late arrivals, and anyone virtual watching a shared screen: tell them once at
the top, *"see the code in the corner? Any time tonight, scan it and you're in."*
The QR reads the PIN from the database live, so it survives every PIN rotation
untouched.

**The HUD** (top right of the console) shows the live phone count, which slide
you're on, whether the AI engine is armed and what it has spent, and whether SMS
is live. If the engine is dark, the Stump slide says so honestly instead of
faking answers — skip it and keep moving.

---

## Pre-flight (before anyone is in the room)

- [ ] **Run the selftest with `&deep=1`.** Every line green. This makes one real
      AI call and fails unless the assistant states a fact from the sheet *and*
      refuses one that isn't on it. Green here means the Stump game will behave.
- [ ] **Rotate the PIN and presenter key** if the last room's are still live
      (one SQL statement — see `projects/equipped-agent-live/HANDOFF.md`).
- [ ] **Swap the Stump fact sheet** for a live listing's real sheet. (The price
      game is already loaded from the published Stonoview Index — nothing to do
      there unless the index gets a monthly refresh first, in which case re-check
      its numbers against slide 7.)
- [ ] Stonoview Neighborhood Index + the 29466 seven-hood plan open in tabs.
- [ ] Track to Keys staged on a real-shaped deal, with the client view on a phone.
- [ ] The AI listing assistant tested that morning — one real question through it,
      confirm the SMS lands. **Phone on loud.**
- [ ] Join QR tested from a cold phone (camera app, not a QR app).
- [ ] Follow-up templates loaded. A lead captured in this room gets a reply
      **before they leave the parking lot.**

---

## The hour, slide by slide

The deck order *is* the run sheet — twenty slides, each with its facilitator cue
printed on the console under the slide. Every phone mirrors the projector all
hour, so remote viewers and the back row ride along; the games take the phones
over when you open them.

**The meta-game**: every phone suits up at the door (three initials + an emoji).
Everything scores on THE BOARD — 10 a vote, 100/50/25 on the pricing podium,
15 a stump question, best ring round ×10. One crown at the end. Tell the room
this in the first two minutes and the whole hour has stakes.

### 0:00 — Title · doors open
PIN and corner QR on screen. Phones join → jersey picker. Say it out loud:
"Suit up — tonight is scored, and somebody's leaving with the crown."

### 0:02 — Your host (slide 2)
Thirty seconds, first person, numbers counting up behind you: 1,800 crawlspaces
taught you what agents miss, 346 doors taught you scale, two years of building
taught you leverage. Don't let it breathe — straight into the icebreaker.

### 0:04 — POLL: Real talk — where are you and AI right now? (slide 3)
The icebreaker and the first laugh ("my assistant has an assistant"). Bars climb
LIVE on screen and on every voted phone. Say the magic words: **votes are
anonymous — be honest.** Remember who's at the extremes for the open floor.

### 0:07 — POLL: What are you actually using AI for today? (slide 4)
Faster energy. On the reveal, narrate the split: listing copy is where everyone
starts, and it's the shallowest end of the pool. The "nothing yet" number is
your permission slip to keep everything hands-on.

### 0:09 — OPEN FLOOR: Brag or confess (slide 5)
Two to three minutes, no more. One brag from a power user, one fear from a
"be gentle" voter. Repeat every story back in one line. The fails are gold —
"a made-up comp? Hold that thought: in twenty minutes you'll watch an AI
REFUSE to do exactly that." This is where the room becomes a conversation.

### 0:12 — POLL: Where does your week actually go? (slide 6)
The expensive question. Whatever wins: "AI eats that first."

### 0:14 — The split (slide 7)
2025 NAR data: 60% sold zero homes · $58K average income · 120K gone. The line
isn't new vs. experienced — it's **equipped vs. unequipped**, and equipment is
now a decision, not a budget.

### 0:16 — Where AI actually pays (slide 8)
Speed to lead, neighborhood authority, reps. Name the hype too. Then the rule
of the hour: **never let AI say a number you can't defend.**

### 0:18 — DEMO: Farm like you have a research department (slide 9)
Switch to the live Stonoview Index. 466 closings, eleven years. The beat: 8.1
points of premium gone in twelve months — and it's NOT a speed problem (51.2
days vs 50.6). A 12-month report would have missed it entirely.

### 0:24 — GAME: The pricing showdown (slide 10)
Space opens the sliders AND locks the machine's guess — say it: "the AI just
made its call. Same facts you have. No feelings about granite." Space again:
the room's histogram vs. the $327/sq-ft arithmetic ($719K) vs. the machine vs.
the record ($797K — median of 22 real comparable closings). Podium takes
100/50/25; every phone shows its own rank with a card built to screenshot.
The lesson: the record beats the arithmetic by $78,000, and the bias always
runs against smaller homes.

### 0:29 — POLL: Which would you build first? (slide 11)
Reveal, then: "Good news — you're about to watch all four."

### 0:31 — DEMO: The listing that answers its own phone (slide 12)
Audience scans, asks, and the SMS lands on your phone in the room. Phone on
loud. "Capture the lead before the portal does." Sean can Break In.

### 0:36 — GAME: Stump the assistant (slide 13)
The wager, out loud: "if ANYONE makes it invent a fact tonight, lunch is on
me." Questions hit the projector wearing their asker's jersey; the honest-
refusal counter runs big. Call out the best question by name.

### 0:41 — DEMO: Track to Keys (slide 14)
Six dates in, the whole deal out. Client sees a porch light, not a password.

### 0:45 — THE SEED (slide 15) — five full minutes
The head-on-fire moment. They copy once, paste into their own free Claude, and
it interviews them — five questions with the payoff in the middle: their own
market written in three voices, and picking one IS the wow. It names itself,
prints an operating card built to screenshot, then hands them a first win
unprompted: a sendable text, a three-move morning, one hard coaching question.
Walk the room. When the first assistant introduces itself by name, have them
read it out loud. Then: "now say SPAR — your board move is waiting."

### 0:51 — THE BOARD (slide 16)
Two boards on screen: the night's standings and the ring scores feeding them.
Ring scores are on their honor. Crown the leader OUT LOUD by jersey. Tell the
room to screenshot their rank card — that screenshot is your marketing.

### 0:53 — The one-week playbook (slide 17)
Mon farm · Tue export · Wed index · Thu QR listing · Fri ten rounds in the
ring. "Everything I showed you, you can build yourself — the prompts are free."

### 0:54 — SEAN: Build alone, or build in a room (slide 18)
The only pitch of the hour, kept short. The ladder does the closing.

### 0:57 — The ladder (slide 19)
Votes are leads. Names land on the console live; the one-tap email routes to
Mike, cc Melanie. Watch the leads drawer fill while you talk.

### 0:59 — Close (slide 20)
Final board top three on every phone. Toolkit ships today; first replies
inside the hour — the standard you just spent an hour teaching.

---

## After the room (same day, non-negotiable)

1. Export the leads: `/api/leads.csv?key=<presenter-key>`.
2. Every ladder vote gets a same-hour text. That's the speed-to-lead lesson
   applied to the people who just watched you teach it.
3. Send the toolkit link and the `/seed` page to everyone, including the people
   who only voted for the toolkit rung.
4. Anyone who asked for coffee gets a calendar link, not a "let's find a time."

---

## Rules of engagement (non-negotiable)

- Never claim a number you can't defend on real data. No income promises, no
  "100%," no invented conversion stats.
- Every demo is real or clearly labeled a replay. **Never fake a confirmation the
  system didn't perform** — the app is built the same way, which is why the Stump
  slide goes dark instead of guessing and the price reveal admits when a closing
  isn't loaded.
- Leads captured in the room get a same-hour response. The funnel's job isn't
  finished at capture — it's finished at a booked conversation.
- Teach generously. The prompts are the ad.
