#!/usr/bin/env sh
# Enforces the rules in catalog.md. Run before every commit.
cd "$(dirname "$0")" || exit 1
fail=0
[ -f doctrine.md ] || { echo "missing: doctrine.md (always-on, required)"; fail=1; }
for f in shelves/*.md; do
  grep -qF "$f" catalog.md || { echo "unrouted: $f not in catalog.md"; fail=1; }
  [ "$(wc -l < "$f")" -le 15 ] || { echo "too long: $f exceeds 15 lines"; fail=1; }
  for k in "Pull when:" "Never:" "Confirmed:" "Done when:"; do
    grep -q "^$k" "$f" || { echo "schema: $f missing '$k'"; fail=1; }
  done
  grep -q '^Confirmed: 20[0-9][0-9]-[01][0-9] ' "$f" || { echo "provenance: $f needs 'Confirmed: YYYY-MM — where'"; fail=1; }
done
for s in $(grep -o 'shelves/[a-z0-9-]*\.md' catalog.md | sort -u); do
  [ -f "$s" ] || { echo "dead link: $s routed but missing"; fail=1; }
done
[ $fail -eq 0 ] && echo "val ok — $(ls shelves/*.md | wc -l | tr -d ' ') shelves, all routed, all dated"
exit $fail
