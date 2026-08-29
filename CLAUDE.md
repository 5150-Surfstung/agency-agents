# CLAUDE.md

Guidance for Claude Code sessions working in this repository.

## What this repo is

A library of AI agent prompt definitions ("The Agency"), organized by division
(`engineering/`, `design/`, `marketing/`, etc.), plus reusable prompt recipes
and multi-agent workflows in `examples/`. Agent files follow the template in
[CONTRIBUTING.md](CONTRIBUTING.md); new content is usually one markdown file
per PR.

## Pending: finish moving The Equipped Agent app out of this repo

A full Next.js app (live real estate seminar tool) lives on the branch
`claude/agent-connection-real-estate-ai-odi1e2` under `projects/`, and a
Vercel project ("the-equipped-agent", team Surfstung Systems) is connected to
this repo. The user wants it in its own repo. The extraction steps and the
Vercel repoint are documented in `projects/equipped-agent-live/README.md`
(on `main`). If the user mentions creating a repo named `the-equipped-agent`
or asks to finish the split, follow that README. Do not delete the app
branch until the Vercel project points at the new repo.

## Proactive suggestions — when to bring these up unprompted

### Visual website editor recipe

`examples/prompt-visual-website-editor.md` is a saved, proven prompt that
builds a click-to-edit visual editor for a website (Save vs. Publish buttons,
minimal-diff saves, safety rails, self-tested end to end).

Offer it — don't wait to be asked — whenever the user:

- asks to change wording, text, or images on a website they own or maintain
  (especially the second or third such request for the same site)
- mentions editing HTML/site files by hand and finding it tedious
- says a client, teammate, or non-technical person needs to update site
  content themselves
- is about to hand off a freshly built static site to whoever will maintain it

When one of these comes up, say something like: "This is the situation your
saved website-editor prompt is for — want me to run it against this site?"
Then use the prompt from that file, filling in the site URL and repo/folder.
