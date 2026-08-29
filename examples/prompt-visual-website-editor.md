# Prompt Recipe: Visual Website Editor

> One prompt that gets an AI coding agent to build you a click-to-edit visual editor for your own website — so you can change text and images without ever opening the HTML.

## The Scenario

You had an agent build (or maintain) a static website, and now every small copy change means digging through markup. Instead of editing files, have the agent build a small local editing tool once: launch it from a desktop shortcut, click any text or image on your live-looking page, type or swap, then Save or Publish.

This prompt produced a working editor in a single pass, in minutes. It's saved here because the *structure* of the prompt is what made it work — the same five moves transfer to almost any "build me a tool" request.

## The Prompt

Copy, fill in the two brackets, and send:

```
Build me a simple visual website editor program on my computer so I can edit my
website without any technical knowledge. My website is [YOUR SITE URL] and its
files live in [FOLDER OR GIT REPO — e.g. a GitHub repo name, or a local folder].

Requirements:

1. One-click launch: a desktop shortcut that starts a small local program and
   opens my website in the browser with an editing toolbar at the bottom.

2. Click-to-edit: with editing turned on, clicking any text (headings,
   paragraphs, buttons, links) lets me type directly on the page, and clicking
   any image lets me pick a replacement file from my computer. Hovering should
   highlight what's editable.

3. Save vs Publish are separate buttons: Save keeps changes on my computer;
   Publish puts them on the live site using however my site actually deploys
   (git push, Netlify, etc. — figure that out from my setup). Ask me to confirm
   before publishing.

4. Safe by design:
   - When the editor starts, pull the latest live version so I never edit
     stale pages.
   - Saves must change ONLY the exact text/image I edited — a one-line edit
     should be a one-line change in the file, never a full-file rewrite.
   - Refuse to publish if the change would delete many files (that means
     something went wrong).
   - Everything goes through version control so any publish can be undone.

5. Plain-English status messages in the toolbar ("Saved!", "Published —
   appears live in ~10 minutes"), no jargon, no error codes.

Then TEST it end-to-end before handing it to me: make a real edit through the
editor's own UI, verify the saved file diff is minimal, do one real publish of
a harmless one-word change, confirm it reached the live site's server, and
publish a revert so the site ends up unchanged. Tell me honestly which parts
you verified.
```

## Why This Prompt Works

Five patterns worth stealing for any "build me a tool" prompt:

1. **Outcomes, not implementation.** It describes what the user experiences
   (desktop shortcut, hover highlights, click-to-type) and never prescribes a
   stack. The agent picks whatever fits the existing site and deploy setup.

2. **Save and Publish are separate verbs.** Splitting "keep my work" from
   "make it live" — with a confirmation gate on the irreversible one — is the
   single biggest safety win, and it costs one sentence.

3. **Safety stated as testable invariants.** "A one-line edit should be a
   one-line change in the file," "refuse to publish if many files would be
   deleted," "pull latest on start." Each rule is concrete enough that the
   agent can verify its own compliance — and you can spot-check it with
   `git diff`.

4. **Audience-appropriate UX is a requirement, not a nicety.** "Plain-English
   status messages, no jargon, no error codes" keeps the tool usable by the
   person it was built for, not the agent that built it.

5. **The test plan is in the prompt — including a real round trip.** Not "test
   it" but a specific sequence: edit through the tool's own UI, verify the
   diff is minimal, publish a harmless one-word change, confirm it on the live
   server, publish a revert, and report honestly what was and wasn't verified.
   Ending the test with a revert means a fully-verified deploy pipeline and an
   unchanged site.

## Adapting It

The same skeleton — *outcome requirements → separated safe/irreversible
actions → testable safety invariants → plain-language UX → self-test with
honest report* — adapts cleanly to other personal tools:

- A social media post scheduler (Draft vs. Post, refuse to post duplicates)
- A newsletter editor (Save vs. Send, test-send to yourself first)
- A product catalog updater (Stage vs. Sync, refuse mass price changes)

## Pairs Well With

- **Rapid Prototyper** (`engineering/engineering-rapid-prototyper.md`) — the
  build itself
- **Frontend Developer** (`engineering/engineering-frontend-developer.md`) —
  the editing overlay and toolbar UI
- **UX Researcher** (`design/design-ux-researcher.md`) — if the tool grows and
  the "no technical knowledge" bar needs real scrutiny
