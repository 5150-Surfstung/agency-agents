#!/usr/bin/env sh
# Enforces the rules in catalog.md. Run before every commit.
cd "$(dirname "$0")" || exit 1
fail=0
for f in shelves/*.md; do
  grep -qF "$f" catalog.md || { echo "unrouted: $f not in catalog.md"; fail=1; }
  [ "$(wc -l < "$f")" -le 15 ] || { echo "too long: $f exceeds 15 lines"; fail=1; }
  for k in "Pull when:" "Never:" "Done when:"; do
    grep -q "^$k" "$f" || { echo "schema: $f missing '$k'"; fail=1; }
  done
done
grep -o 'shelves/[a-z0-9-]*\.md' catalog.md | sort -u | while read -r s; do
  [ -f "$s" ] || { echo "dead link: $s routed but missing"; exit 1; }
done || fail=1
[ $fail -eq 0 ] && echo "val ok — $(ls shelves/*.md | wc -l | tr -d ' ') shelves, all routed"
exit $fail
