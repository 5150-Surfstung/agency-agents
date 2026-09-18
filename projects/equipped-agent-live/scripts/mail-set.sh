#!/usr/bin/env bash
# Takes the two Resend values on STDIN and writes .env.local, then proves the
# wiring. Values arrive on stdin rather than as arguments on purpose — an
# argument shows up in the process list and in shell history; stdin does not.
#
#   printf '%s\n%s\n' "re_xxx" "Name <you@domain.com>" | scripts/mail-set.sh you@domain.com
set -euo pipefail
cd "$(dirname "$0")/.."
read -r KEY
read -r FROM
TO="${1:-}"
{
  echo "# Written by scripts/mail-set.sh — gitignored, never committed."
  echo "RESEND_API_KEY=${KEY}"
  echo "RESEND_FROM=${FROM}"
} > .env.local
chmod 600 .env.local
echo "wrote .env.local (mode 600)"
[ -n "$TO" ] && node scripts/mail-test.mjs "$TO"
