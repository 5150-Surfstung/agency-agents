// The attendee heartbeat. Phones ask every ~1.5s; the answer is everything a
// phone needs to render: current slide (public fields only — cues stay with
// the presenter), poll state, my vote, tallies once revealed, arcade status.

import { NextResponse } from "next/server";
import { engineOnline } from "@/lib/ai";
import { ARCADE_FROM_STEP, DECK } from "@/lib/deck";
import { sessionFromCookies } from "@/lib/room";
import { getStore } from "@/lib/store";

export async function GET() {
  const sess = await sessionFromCookies();
  if (!sess) {
    return NextResponse.json({ ok: false, error: "join_first" }, { status: 401 });
  }

  try {
    const store = getStore();
    const state = await store.getState(sess.roomKey);
    const slide = DECK[state.step] ?? DECK[0];

    await store.touchDevice(sess.roomKey, sess.deviceId);

    let myVote: number | null = null;
    let counts: number[] | null = null;
    if (slide.poll) {
      myVote = await store.getVote(sess.roomKey, slide.poll.key, sess.deviceId);
      if (state.pollState === "revealed") {
        counts = await store.tally(sess.roomKey, slide.poll.key, slide.poll.options.length);
      }
    }

    return NextResponse.json({
      ok: true,
      step: state.step,
      slide: {
        id: slide.id,
        kind: slide.kind,
        eyebrow: slide.eyebrow ?? null,
        heading: slide.heading,
        poll: slide.poll
          ? { key: slide.poll.key, question: slide.poll.question, options: slide.poll.options, capture: !!slide.poll.capture }
          : null,
      },
      pollState: state.pollState,
      myVote,
      counts,
      arcadeOpen: state.step >= ARCADE_FROM_STEP,
      engineOnline: engineOnline(),
    });
  } catch {
    // A key the DB no longer honors (rotated pin) reads as "join again".
    return NextResponse.json({ ok: false, error: "join_first" }, { status: 401 });
  }
}
