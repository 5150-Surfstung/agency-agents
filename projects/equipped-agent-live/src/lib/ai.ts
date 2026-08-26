// The arcade engine. Same philosophy as the Track to Keys turn engine:
// haiku-class default (the room is volume — model-routing rule), short replies,
// small history window, hard caps checked BEFORE the call, cost tracked per
// event. No key → an honest "offline" — the UI never fakes a working tool.

import Anthropic from "@anthropic-ai/sdk";
import { getStore } from "./store";

export const ARCADE_MODEL = "claude-haiku-4-5";
const MAX_REPLY_TOKENS = 400;
const HISTORY_WINDOW = 24; // messages sent to the model (12 exchanges)

// $ per million tokens — keep in sync with the pricing table when models move.
const PRICING: Record<string, { input: number; output: number }> = {
  "claude-haiku-4-5": { input: 1, output: 5 },
};

export function engineOnline(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function spendCapUsd(): number {
  return Number(process.env.LIVE_SPEND_CAP_USD || 15);
}

function deviceMsgCap(): number {
  return Number(process.env.LIVE_DEVICE_MSG_CAP || 40);
}

export type ChatMsg = { role: "user" | "assistant"; content: string };

export type ArcadeResult =
  | { ok: true; reply: string }
  | { ok: false; reason: "offline" | "device_cap" | "room_cap" | "error" };

export async function runArcadeTurn(opts: {
  deviceId: string;
  tool: "listing" | "sparring" | "mine";
  system: string;
  messages: ChatMsg[];
}): Promise<ArcadeResult> {
  if (!engineOnline()) return { ok: false, reason: "offline" };

  const store = getStore();
  // Caps first — a call that shouldn't happen is cheaper never made.
  const [deviceCount, spend] = await Promise.all([
    store.deviceToolCount(opts.deviceId, 24 * 60 * 60 * 1000),
    store.totalSpendUsd(),
  ]);
  if (deviceCount >= deviceMsgCap()) return { ok: false, reason: "device_cap" };
  if (spend >= spendCapUsd()) return { ok: false, reason: "room_cap" };

  const client = new Anthropic();
  const history = opts.messages.slice(-HISTORY_WINDOW);

  try {
    const resp = await client.messages.create({
      model: ARCADE_MODEL,
      max_tokens: MAX_REPLY_TOKENS,
      system: [{ type: "text", text: opts.system, cache_control: { type: "ephemeral" } }],
      messages: history,
    });

    const text = resp.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    const rate = PRICING[ARCADE_MODEL];
    const inTokens = resp.usage.input_tokens ?? 0;
    const outTokens = resp.usage.output_tokens ?? 0;
    await store.addToolEvent({
      deviceId: opts.deviceId,
      tool: opts.tool,
      inTokens,
      outTokens,
      costUsd: (inTokens * rate.input + outTokens * rate.output) / 1_000_000,
      at: Date.now(),
    });

    if (!text) return { ok: false, reason: "error" };
    return { ok: true, reply: text };
  } catch {
    return { ok: false, reason: "error" };
  }
}
