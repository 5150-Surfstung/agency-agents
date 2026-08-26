// The presenter's hand on the wheel. Slides move; poll state cycles
// closed → open → revealed on the current slide. Opening a price game also
// locks THE MACHINE's guess (same facts the room sees, never the answer);
// revealing one pays the podium onto THE BOARD. Also serves the console's
// heartbeat: live tallies, leads, presence, spend, standings, house score.

import { NextRequest, NextResponse } from "next/server";
import { engineOnline, runArcadeTurn } from "@/lib/ai";
import { ALL_POLL_KEYS, DECK } from "@/lib/deck";
import { smsOnline } from "@/lib/notify";
import { machineGuessSystem } from "@/lib/prompts";
import { getStore } from "@/lib/store";
import type { PollState, PriceDef } from "@/lib/types";

// The machine plays under one fixed jersey-less device id (for cost metering).
const MACHINE_DEVICE = "00000000-0000-4000-8000-00000000c0de";
const PODIUM = [100, 50, 25];

async function isPresenterKey(key: string | null | undefined): Promise<boolean> {
  if (!key) return false;
  try {
    return (await getStore().checkKey(key)) === "presenter";
  } catch {
    return false;
  }
}

/** Locks the machine's price call at OPEN. Idempotent: an existing guess
 *  stands (rehearsals don't re-spend). Engine offline → no guess, honestly. */
async function lockMachineGuess(key: string, price: PriceDef) {
  const store = getStore();
  if (!engineOnline()) return;
  if (await store.aiGuessGet(key, price.key)) return;
  const r = await runArcadeTurn({
    roomKey: key,
    deviceId: MACHINE_DEVICE,
    tool: "listing",
    system: machineGuessSystem(price.facts, price.minK, price.maxK, price.anchorK, price.anchorLabel),
    messages: [{ role: "user", content: "Lock in your call." }],
  });
  if (!r.ok) return;
  const guess = Number(/GUESS:\s*\$?(\d{2,5})/i.exec(r.reply)?.[1]);
  const why = /WHY:\s*(.+)/i.exec(r.reply)?.[1]?.trim() ?? "";
  if (Number.isInteger(guess) && guess >= price.minK && guess <= price.maxK) {
    await store.aiGuessSet(key, price.key, guess, why.slice(0, 300));
  }
}

/** Pays 100/50/25 onto THE BOARD at reveal, closest first. Runs against the
 *  loaded closing, or honestly against the arithmetic anchor when none is
 *  loaded. Award writes are idempotent per (device, reason) in the DB. */
async function awardPodium(key: string, price: PriceDef) {
  const store = getStore();
  const target = price.soldK ?? price.anchorK;
  if (target === null) return;
  const entries = await store.priceEntries(key, price.key);
  entries.sort((a, b) => Math.abs(a.value - target) - Math.abs(b.value - target));
  for (let i = 0; i < Math.min(PODIUM.length, entries.length); i++) {
    await store.awardAdd(key, entries[i].deviceId, PODIUM[i], `podium:${price.key}:${i + 1}`);
  }
}

/** The reveal's podium, with jerseys, computed fresh from the same math. */
async function podiumWithJerseys(key: string, price: PriceDef) {
  const store = getStore();
  const target = price.soldK ?? price.anchorK;
  if (target === null) return null;
  const entries = await store.priceEntries(key, price.key);
  entries.sort((a, b) => Math.abs(a.value - target) - Math.abs(b.value - target));
  const top = entries.slice(0, 3);
  return Promise.all(
    top.map(async (e, i) => {
      const p = await store.profileGet(key, e.deviceId);
      return {
        initials: p?.initials || "???",
        emoji: p?.emoji || "",
        value: e.value,
        offBy: Math.abs(e.value - target),
        points: PODIUM[i],
      };
    })
  );
}

async function snapshot(key: string) {
  const store = getStore();
  const state = await store.getState(key);
  const slide = DECK[state.step] ?? DECK[0];

  let counts: number[] | null = null;
  if (slide.poll) counts = await store.tally(key, slide.poll.key, slide.poll.options.length);

  let priceValues: { value: number; n: number }[] | null = null;
  let aiGuess = null;
  let podium = null;
  if (slide.price) {
    priceValues = await store.rawTally(key, slide.price.key);
    if (state.pollState !== "closed") aiGuess = await store.aiGuessGet(key, slide.price.key);
    if (state.pollState === "revealed") podium = await podiumWithJerseys(key, slide.price);
  }

  let stumpFeed = null;
  let stumpStats = null;
  if (slide.kind === "stump") {
    stumpFeed = await store.stumpList(key, 8);
    stumpStats = await store.stumpStats(key);
  }

  let scoreboard = null;
  let standings = null;
  if (slide.kind === "leaderboard" || slide.kind === "close") {
    scoreboard = await store.scoresTop(key);
    standings = await store.standings(key, ALL_POLL_KEYS);
  }

  const [leads, present, spend] = await Promise.all([
    store.listLeads(key),
    store.activeDevices(key, 2 * 60 * 1000),
    store.totalSpendUsd(key),
  ]);
  const pin = await store.roomPin(key);

  return {
    ok: true,
    step: state.step,
    total: DECK.length,
    pollState: state.pollState,
    counts,
    leads,
    present,
    spendUsd: Math.round(spend * 100) / 100,
    pin,
    engineOnline: engineOnline(),
    smsOnline: smsOnline(),
    backend: store.backend(),
    priceValues,
    aiGuess,
    podium,
    stumpFeed,
    stumpStats,
    scoreboard,
    standings,
  };
}

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (!(await isPresenterKey(key))) {
    return NextResponse.json({ ok: false, error: "not_presenter" }, { status: 401 });
  }
  try {
    return NextResponse.json(await snapshot(key as string));
  } catch {
    return NextResponse.json({ ok: false, error: "store_error" }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  let key = "";
  let action = "";
  let step = -1;
  try {
    const body = await req.json();
    key = String(body?.key ?? "");
    action = String(body?.action ?? "");
    step = Number(body?.step);
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  if (!(await isPresenterKey(key))) {
    return NextResponse.json({ ok: false, error: "not_presenter" }, { status: 401 });
  }

  try {
    const store = getStore();
    const state = await store.getState(key);
    let next = state.step;
    let pollState: PollState = state.pollState;

    switch (action) {
      case "next":
        next = Math.min(DECK.length - 1, state.step + 1);
        pollState = "closed";
        break;
      case "prev":
        next = Math.max(0, state.step - 1);
        pollState = "closed";
        break;
      case "goto":
        if (!Number.isInteger(step) || step < 0 || step >= DECK.length) {
          return NextResponse.json({ ok: false, error: "bad_step" }, { status: 400 });
        }
        next = step;
        pollState = "closed";
        break;
      case "poll": {
        // Space bar on a poll OR price slide: closed → open → revealed.
        const slide = DECK[state.step];
        if (!slide?.poll && !slide?.price) {
          return NextResponse.json({ ok: false, error: "not_a_poll" }, { status: 409 });
        }
        const to: PollState = state.pollState === "closed" ? "open" : "revealed";
        if (slide.price && to === "open") await lockMachineGuess(key, slide.price);
        if (slide.price && to === "revealed" && state.pollState === "open") await awardPodium(key, slide.price);
        pollState = to;
        break;
      }
      case "reset_poll":
        pollState = "closed";
        break;
      default:
        return NextResponse.json({ ok: false, error: "bad_action" }, { status: 400 });
    }

    await store.setState(key, next, pollState);
    return NextResponse.json(await snapshot(key));
  } catch {
    return NextResponse.json({ ok: false, error: "store_error" }, { status: 502 });
  }
}
