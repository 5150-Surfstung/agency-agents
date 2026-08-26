# ICM Staged Pipeline
Pull when: work is sequential + reviewable + repeatable. NOT for concurrent/real-time.
- Numbered folders = pipeline stages
- One CONTEXT.md per stage: Inputs / Process / Outputs
- Human review gate at every stage boundary
- Stable reference material separate from per-run artifacts
- Bar: walk test — memoryless agent must orient, act, report from files alone
Never: skip a gate to save a round. Never mix run artifacts into reference material. Never hold state in the chat instead of the files.
Confirmed: 2026-08 — v1 seed, production source not recorded.
Done when: an agent with zero context finishes any single stage from that stage's CONTEXT.md alone.
