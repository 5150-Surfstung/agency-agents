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
- [ ] **Load a real closing into the Price Is Right slide** — `soldK` plus the
      exact facts. Until you do, the reveal honestly says the closing isn't
      loaded and shows only the room vs. the index anchor. Never invent it.
- [ ] **Swap the Stump fact sheet** for a live listing's real sheet.
- [ ] Stonoview Neighborhood Index + the 29466 seven-hood plan open in tabs.
- [ ] Track to Keys staged on a real-shaped deal, with the client view on a phone.
- [ ] The AI listing assistant tested that morning — one real question through it,
      confirm the SMS lands. **Phone on loud.**
- [ ] Join QR tested from a cold phone (camera app, not a QR app).
- [ ] Follow-up templates loaded. A lead captured in this room gets a reply
      **before they leave the parking lot.**

---

## The hour, slide by slide

The deck order *is* the run sheet. Seventeen slides, and every one of them has
its facilitator cue printed on the console under the slide.

### 0:00 — Title · doors open

PIN on screen, QR ready on `Q`. Phones are welcome — tell them so out loud,
because phones are half the show.

### 0:02 — Your host (slide 2)

Thirty seconds, first person, no résumé voice: crawlspaces taught you what agents
miss, multifamily taught you scale, tech taught you leverage. Everything about to
run on screen was built from inside the business, not sold into it. Then straight
into the poll — don't let this slide breathe.

### 0:04 — Poll: where does your week actually go? (slide 3)

`space` to open. Let the bars climb while people are still joining — the climbing
bar is what gets the last three phones in the room. `space` again to reveal.
Whatever wins, the line is the same: **"AI eats that first."**

### 0:07 — The split (slide 4)

2025 NAR data: 60% of 1.3M agents sold zero homes · $58K average income on ~7
closings · 120K left the industry. The reframe: the line isn't new vs.
experienced, it's **equipped vs. unequipped** — and equipment is now a decision,
not a budget. Nobody in this room is on the wrong side by choice.

### 0:10 — Where AI actually pays (slide 5)

Three places it moves money today: speed to lead, neighborhood authority, reps.
Name the hype too — generic listing copy, autoresponders in a trench coat.
Then the rule that governs the whole hour: **never let AI say a number you can't
defend.**

### 0:13 — Demo: farm like you have a research department (slide 6)

Switch to the **Stonoview Neighborhood Index** and scroll it live. Beats in order:
134 months and 449 sales, not a 12-month snapshot → the finding a snapshot misses
(the premium over the island compressed 32% → 26% in twelve months) → the
kitchen-table payoff. Then the teach: an afternoon, not a data-science degree —
pick the farm, export solds, run the prompt, publish it.

Land it: *"When you hand a seller eleven years of their own street, you're not one
of three agents interviewing. You're the one who did the homework."*

### 0:20 — GAME ONE: The Price Is Right (slide 7)

`space` and every phone in the room gets a slider. They lock in a guess on a real
local closing. `space` again and the reveal draws the whole room as a histogram
against the actual sale price and against the index's trailing-12 median.

The point isn't the game, it's the gap: the room guesses from feel, the index
knows. Call out the closest guess by name if you can spot them.

> If you haven't loaded a real closing, the reveal says so on screen. Play it
> against the anchor only — never narrate a number the slide didn't show.

### 0:25 — Poll: which would you build first? (slide 8)

Open, reveal, then: **"Good news — you're about to watch all four."**

### 0:27 — Demo: the listing that answers its own phone (slide 9)

Switch to the live assistant. An audience member scans, asks a real question, the
assistant answers from the fact sheet and asks for a name and cell before the deep
stuff — and **the SMS lands on your phone in the room.** Let them hear it.

The three rules: one QR *per listing*, never one for the business · the assistant
never answers past the fact sheet · the lead routes to your phone in under a
minute, not into a Friday spreadsheet. Frame: *"Capture the lead before the portal
does."* Sean can Break In from the console.

### 0:33 — GAME TWO: Stump the assistant (slide 10)

Phones can now interrogate the demo listing's assistant directly, and the
questions and answers stream onto the projector live. Tell them plainly: **it
knows only the fact sheet — try to make it guess.**

Every honest refusal lights up gold on screen. That's the whole lesson: the
refusal is the feature. Read the best one out loud.

### 0:38 — Demo: Track to Keys (slide 11)

Six contract dates in, and the full milestone chain, client portal, and
notification schedule come out — under two minutes. Show the client view on a
phone: a porch light, not a password. Then the agent's attention queue: overdue,
waiting-on-others, quiet.

### 0:44 — THE SEED: build your own, on YOUR Claude (slide 12)

**The head-on-fire moment. Give it four full minutes and walk the room.**

There's a COPY button on every phone in the room. They tap it, open the free
Claude app or claude.ai, paste into a new chat — and it interviews *them*, six
questions, then becomes their assistant. Their account, their brand, free, theirs
to keep and change. Courtesy of The Agent Connection.

When the first person's assistant introduces itself by name, have them read it
out loud. That is the moment the room turns.

### 0:50 — The ring: leaderboard (slide 13)

Their new assistant has a sparring move. Ten rounds against the toughest version
of their next appointment, scored out of ten. They post initials and score from
their phone; the board fills on the projector. Crown the leader out loud.

### 0:52 — The one-week playbook (slide 14)

Mon pick the farm · Tue export the solds · Wed run the index prompt · Thu one
listing, one QR page · Fri ten rounds in the ring before your next appointment.

*"Everything I showed you, you can build yourself — that's why the prompts are
free."* The toolkit is the ad. Give it away like you mean it.

### 0:54 — SEAN'S SEGMENT: build alone, or build in a room (slide 15)

The only pitch of the hour, and it's short. The difference between having tools
and having systems is the room you're in. The Agent Connection is a room where all
of this is already running — the lunches, the mentorship, the systems, the people
who've done it. Keep it honest and keep it short; the ladder does the closing.

### 0:57 — The ladder (slide 16)

Open the last poll. Four rungs, no dead ends: send me the toolkit · save me a seat
at the next lunch · coffee and fifteen minutes · all of it. **Votes are leads** —
names land on your console in real time, and each attendee gets a one-tap button
that emails Mike (cc Melanie) with their choice already filled in.

Watch the leads drawer (`L`) fill while you're still talking.

### 0:59 — Close (slide 17)

Their assistant is already theirs. Toolkit ships today, first replies inside the
hour — which is the standard you just spent an hour teaching. Leave the QR up.

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
