# CLAUDE.md

Guidance for Claude Code sessions working in this repository.

## What this repo is

A library of AI agent prompt definitions ("The Agency"), organized by division
(`engineering/`, `design/`, `marketing/`, etc.), plus reusable prompt recipes
and multi-agent workflows in `examples/`. Agent files follow the template in
[CONTRIBUTING.md](CONTRIBUTING.md); new content is usually one markdown file
per PR.

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
