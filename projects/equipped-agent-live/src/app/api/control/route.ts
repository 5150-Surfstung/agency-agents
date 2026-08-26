// The presenter's hand on the wheel. Slides move; poll state cycles
// closed → open → revealed on the current slide. Also serves the console's
// heartbeat: live tallies (even before reveal), leads, presence, spend.

import { NextRequest, NextResponse } from "next/server";
import { engineOnline } from "@/lib/ai";
import { ARCADE_FROM_STEP, DECK } from "@/lib/deck";
import { getStore } from "@/lib/store";
import type { PollState } from "@/lib/types";

async function isPresenterKey(key: string | null | undefined): Promise<boolean> {
  if (!key) return false;
  try {
    return (await getStore().checkKey(key)) === "presenter";
  } catch {
    return false;
  }
}

async function snapshot(key: string) {
  const store = getStore();
  const state = await store.getState(key);
  const slide = DECK[state.step] ?? DECK[0];

  let counts: number[] | null = null;
  if (slide.poll) counts = await store.tally(key, slide.poll.key, slide.poll.options.length);

  const [leads, present, spend] = await Promise.all([
    store.listLeads(key),
    store.activeDevices(key, 2 * 60 * 1000),
    store.totalSpendUsd(key),
  ]);

  return {
    ok: true,
    step: state.step,
    total: DECK.length,
    pollState: state.pollState,
    counts,
    leads,
    present,
    spendUsd: Math.round(spend * 100) / 100,
    arcadeOpen: state.step >= ARCADE_FROM_STEP,
    engineOnline: engineOnline(),
    backend: store.backend(),
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
        // Space bar on a poll slide: closed → open → revealed → (stays revealed).
        if (!DECK[state.step]?.poll) {
          return NextResponse.json({ ok: false, error: "not_a_poll" }, { status: 409 });
        }
        pollState = state.pollState === "closed" ? "open" : "revealed";
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
