// The attendee heartbeat. Phones ask every ~1.5s; the answer is everything a
// phone needs to render: the slide MIRRORED (public fields — cues stay with
// the presenter), poll state, my jersey, my vote, my rank, tallies once
// revealed, the machine's call, the house score, THE BOARD.

import { NextResponse } from "next/server";
import { engineOnline } from "@/lib/ai";
import { ALL_POLL_KEYS, DECK } from "@/lib/deck";
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
    const me = await store.profileGet(sess.roomKey, sess.deviceId);

    let myVote: number | null = null;
    let counts: number[] | null = null;
    let priceReveal: {
      values: { value: number; n: number }[];
      soldK: number | null;
      soldLabel: string;
      anchorK: number | null;
      anchorLabel: string;
      source: string | null;
      aiGuess: { guessK: number; reasoning: string } | null;
      myRank: number | null;
      guessers: number;
    } | null = null;

    if (slide.poll) {
      myVote = await store.getVote(sess.roomKey, slide.poll.key, sess.deviceId);
      // Live percentages the moment the poll opens — the room watches the
      // bars climb together. Votes stay anonymous; only totals ever leave.
      if (state.pollState !== "closed") {
        counts = await store.tally(sess.roomKey, slide.poll.key, slide.poll.options.length);
      }
    }
    if (slide.price) {
      myVote = await store.getVote(sess.roomKey, slide.price.key, sess.deviceId);
      if (state.pollState === "revealed") {
        const values = await store.rawTally(sess.roomKey, slide.price.key);
        const target = slide.price.soldK ?? slide.price.anchorK;
        const guessers = values.reduce((s, v) => s + v.n, 0);
        // My rank: 1 + how many guesses sit strictly closer to the target.
        let myRank: number | null = null;
        if (myVote !== null && target !== null) {
          const myDelta = Math.abs(myVote - target);
          myRank = 1 + values.reduce((s, v) => (Math.abs(v.value - target) < myDelta ? s + v.n : s), 0);
        }
        priceReveal = {
          values,
          soldK: slide.price.soldK,
          soldLabel: slide.price.soldLabel,
          anchorK: slide.price.anchorK,
          anchorLabel: slide.price.anchorLabel,
          source: slide.price.source ?? null,
          aiGuess: await store.aiGuessGet(sess.roomKey, slide.price.key),
          myRank,
          guessers,
        };
      }
    }

    // House score on the stump slide; THE BOARD on board/close slides.
    let stumpStats: { asked: number; refused: number } | null = null;
    if (slide.kind === "stump") stumpStats = await store.stumpStats(sess.roomKey);

    let board: { top: { initials: string; emoji: string; points: number; me: boolean }[]; myPoints: number; myRank: number | null } | null =
      null;
    if (slide.kind === "leaderboard" || slide.kind === "close") {
      const rows = await store.standings(sess.roomKey, ALL_POLL_KEYS);
      const idx = rows.findIndex((r) => r.deviceId === sess.deviceId);
      board = {
        top: rows.slice(0, 10).map((r) => ({ initials: r.initials, emoji: r.emoji, points: r.points, me: r.deviceId === sess.deviceId })),
        myPoints: idx >= 0 ? rows[idx].points : 0,
        myRank: idx >= 0 ? idx + 1 : null,
      };
    }

    return NextResponse.json({
      ok: true,
      step: state.step,
      total: DECK.length,
      slide: {
        id: slide.id,
        kind: slide.kind,
        eyebrow: slide.eyebrow ?? null,
        heading: slide.heading,
        // The phone mirrors the projector: lines, stats, and quote included.
        lines: slide.lines ?? null,
        stats: slide.stats ?? null,
        quote: slide.quote ?? null,
        poll: slide.poll
          ? { key: slide.poll.key, question: slide.poll.question, options: slide.poll.options, capture: !!slide.poll.capture }
          : null,
        // The sold price never leaves the server before the reveal.
        price: slide.price
          ? { key: slide.price.key, facts: slide.price.facts, minK: slide.price.minK, maxK: slide.price.maxK, stepK: slide.price.stepK }
          : null,
      },
      pollState: state.pollState,
      me: me && me.initials ? me : null,
      myVote,
      counts,
      priceReveal,
      stumpStats,
      board,
      engineOnline: engineOnline(),
    });
  } catch {
    // A key the DB no longer honors (rotated pin) reads as "join again".
    return NextResponse.json({ ok: false, error: "join_first" }, { status: 401 });
  }
}
