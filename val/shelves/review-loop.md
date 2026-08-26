# Agentic Review Loop
Pull when: an agent is about to write code, or a diff needs a second pass.
- Reviewer agent on CLEAN context: bare diff first, builder context only after first pass
- Review every commit; findings convert into CI checks
- No auto-fix: verifier confirms each finding before anything is fixed
- Class stop rule: second finding of the same class = redesign, not another bounce
- Commit before any agent run. Smallest diff that solves the ask.
Never: let the builder review its own diff. Never fix an unverified finding. Never widen the diff past the ask.
Confirmed: 2026-08 — v1 seed, production source not recorded.
Done when: every finding is verified or dropped, repeat classes became CI checks, and the diff is no bigger than the ask.
