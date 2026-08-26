// The presenter's hand on the wheel. Slides move; poll state cycles
// closed → open → revealed on the current slide. Also serves the console's
// heartbeat: live tallies (even before reveal), leads, presence, spend.

import { NextRequest, NextResponse } from "next/server";
import { engineOnline } from "@/lib/ai";
import { ARCADE_FROM_STEP, DECK } from "@/lib/deck";
import { isPresenter } from "@/lib/room";
import { getStore } from "@/lib/store";
import type { PollState } from "@/lib/types";

async function snapshot() {
  const store = getStore();
  const state = await store.getState();
  const slide = DECK[state.step] ?? DECK[0];

  let counts: number[] | null = null;
  if (slide.poll) counts = await store.tally(slide.poll.key, slide.poll.options.length);

  const [leads, present, spend] = await Promise.all([
    store.listLeads(),
    store.activeDevices(2 * 60 * 1000),
    store.totalSpendUsd(),
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
  };
}

export async function GET(req: NextRequest) {
  if (!isPresenter(req.nextUrl.searchParams.get("key"))) {
    return NextResponse.json({ ok: false, error: "not_presenter" }, { status: 401 });
  }
  return NextResponse.json(await snapshot());
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

  if (!isPresenter(key)) {
    return NextResponse.json({ ok: false, error: "not_presenter" }, { status: 401 });
  }

  const store = getStore();
  const state = await store.getState();
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

  await store.setState(next, pollState);
  return NextResponse.json(await snapshot());
}
