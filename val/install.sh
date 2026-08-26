#!/usr/bin/env sh
# Makes Val a Claude Code skill: auto-loads on matching tasks, /val on demand.
set -e
mkdir -p "$HOME/.claude/skills"
ln -sfn "$(cd "$(dirname "$0")" && pwd)" "$HOME/.claude/skills/val"
echo "linked $HOME/.claude/skills/val -> $(cd "$(dirname "$0")" && pwd)"
