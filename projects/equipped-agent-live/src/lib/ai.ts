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
  roomKey: string;
  deviceId: string;
  tool: "listing" | "sparring" | "mine";
  system: string;
  messages: ChatMsg[];
  /** Set by a surface that has no room key — the public invite's desk, or a
   *  listing assistant somebody reached by QR. The room-key metering RPCs use
   *  the key as an auth token and raise on anything that is not one, so a
   *  stranger's turn used to die in the cap check before a model was ever
   *  called. With this set, the turn is metered against its own labelled
   *  budget instead, and `roomKey` is only used for logging context. */
  meterRoom?: string;
}): Promise<ArcadeResult> {
  if (!engineOnline()) return { ok: false, reason: "offline" };

  const store = getStore();
  const pub = opts.meterRoom;
  // Caps first — a call that shouldn't happen is cheaper never made. A store
  // that cannot answer is a "cap" we refuse rather than a crash: this runs on
  // a public page, so a broken read must not become a 500.
  let deviceCount = 0;
  let spend = 0;
  try {
    [deviceCount, spend] = await Promise.all([
      pub
        ? store.meterCount(pub, opts.deviceId, 24 * 60 * 60 * 1000)
        : store.deviceToolCount(opts.roomKey, opts.deviceId, 24 * 60 * 60 * 1000),
      pub ? store.meterSpendUsd(pub) : store.totalSpendUsd(opts.roomKey),
    ]);
  } catch {
    return { ok: false, reason: "error" };
  }
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
    const event = {
      deviceId: opts.deviceId,
      tool: opts.tool,
      inTokens,
      outTokens,
      costUsd: (inTokens * rate.input + outTokens * rate.output) / 1_000_000,
      at: Date.now(),
    };
    // The reply is already in hand, so a failed write must not throw the turn
    // away — it costs us the accounting for one message, not the answer.
    try {
      if (pub) await store.meterLog(pub, event);
      else await store.addToolEvent(opts.roomKey, event);
    } catch {}

    if (!text) return { ok: false, reason: "error" };
    return { ok: true, reply: text };
  } catch {
    return { ok: false, reason: "error" };
  }
}
