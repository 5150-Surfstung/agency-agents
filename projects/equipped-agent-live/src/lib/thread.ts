// Turning a stored conversation into something the model can read, and back.
// One place, because /api/ask, the switchboard and the selftest all need the
// same answer to "what has been said here so far".

import type { ChatMsg } from "./ai";
import type { ThreadMsg } from "./types";

/** A thread id is minted by the visitor's browser and is the only thing
 *  needed to read that thread — so it must actually look like a v4 uuid. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isThreadId(v: unknown): v is string {
  return typeof v === "string" && UUID_RE.test(v);
}

/** Stored roles → Anthropic roles.
 *  · `system` lines are ours, not anyone's words — they never go to the model.
 *  · `agent` is a HUMAN who broke in. It reads as an assistant turn, so when
 *    the AI takes the wheel back it knows what the human already promised.
 *  · the API needs strictly alternating roles starting with the visitor, so
 *    consecutive same-role turns collapse and a leading non-visitor is cut. */
export function toChat(messages: ThreadMsg[], limit = 20): ChatMsg[] {
  const out: ChatMsg[] = [];
  for (const m of messages) {
    if (m.role === "system") continue;
    const role: ChatMsg["role"] = m.role === "visitor" ? "user" : "assistant";
    const last = out[out.length - 1];
    if (last && last.role === role) last.content = `${last.content}\n${m.body}`;
    else out.push({ role, content: m.body });
  }
  while (out.length && out[0].role !== "user") out.shift();
  return out.slice(-limit);
}
