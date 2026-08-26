#!/bin/bash
# Installs the Val pattern library (github.com/5150-Surfstung/val) as a skill
# in remote sessions. Never blocks a session: any failure degrades to a
# one-line instruction the agent can act on.
set -uo pipefail
[ "${CLAUDE_CODE_REMOTE:-}" = "true" ] || exit 0
[ -e "$HOME/.claude/skills/val/SKILL.md" ] && { echo "Val skill: already installed"; exit 0; }
if git clone -q --depth 1 https://github.com/5150-Surfstung/val "$HOME/val" 2>/dev/null; then
  sh "$HOME/val/install.sh" && echo "Val skill: installed from 5150-Surfstung/val"
else
  echo "Val skill unavailable: private repo not reachable from this session. To load it, run add_repo for 5150-Surfstung/val, clone it, then run its install.sh."
fi
exit 0
