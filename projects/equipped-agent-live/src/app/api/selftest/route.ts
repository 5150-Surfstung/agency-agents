// The room proves itself. One GET runs the whole store protocol end-to-end
// inside production — state roundtrip, vote, tally, presence, lead add/list/
// delete, pack save/get — and reports pass/fail per step plus which backend
// carried it. Run it before every real room.

import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { engineOnline, runArcadeTurn } from "@/lib/ai";
import { emailOnline } from "@/lib/mailer";
import { bragSystem, orbPrompt, starterPrompt } from "@/lib/prompts";
import { DECK, STUMP_FACTS, STUMP_NOTES, opensOnArrival } from "@/lib/deck";
import { listingAssistantSystem } from "@/lib/prompts";
import { isRefusal } from "@/lib/refusal";
import { SELFTEST_REF, getStore } from "@/lib/store";

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key") ?? "";
  const store = getStore();

  try {
    if ((await store.checkKey(key)) !== "presenter") {
      return NextResponse.json({ ok: false, error: "not_presenter" }, { status: 401 });
    }
  } catch (e) {
    return NextResponse.json({ ok: false, error: `store_unreachable: ${String(e).slice(0, 200)}` }, { status: 502 });
  }

  const device = randomUUID();
  const results: { step: string; ok: boolean; note?: string }[] = [];
  const run = async (step: string, fn: () => Promise<void>) => {
    try {
      await fn();
      results.push({ step, ok: true });
    } catch (e) {
      results.push({ step, ok: false, note: String(e).slice(0, 200) });
    }
  };

  await run("state roundtrip", async () => {
    const before = await store.getState(key);
    await store.setState(key, before.step, before.pollState); // no-op write
    const after = await store.getState(key);
    if (after.step !== before.step) throw new Error("state did not persist");
  });

  await run("vote + tally", async () => {
    await store.castVote(key, { pollKey: "selftest", deviceId: device, choice: 2, at: Date.now() });
    const mine = await store.getVote(key, "selftest", device);
    if (mine !== 2) throw new Error(`vote read back ${mine}`);
    const counts = await store.tally(key, "selftest", 4);
    if ((counts[2] ?? 0) < 1) throw new Error("tally missed the vote");
  });

  await run("presence", async () => {
    await store.touchDevice(key, device);
    const n = await store.activeDevices(key, 60 * 1000);
    if (n < 1) throw new Error("presence not counted");
  });

  await run("lead add/list/delete", async () => {
    await store.addLead(key, { deviceId: device, name: "· selftest ·", cell: "000", rung: "selftest", at: Date.now() });
    const listed = (await store.listLeads(key)).some((l) => l.deviceId === device);
    if (!listed) throw new Error("lead not listed");
    await store.deleteLead(key, device);
    const still = (await store.listLeads(key)).some((l) => l.deviceId === device);
    if (still) throw new Error("lead not deleted");
  });

  await run("pack save/get", async () => {
    await store.savePack(key, {
      code: "SELFTS",
      deviceId: device,
      name: "Self Test",
      brokerage: "",
      area: "",
      specialty: "",
      tone: "warm",
      createdAt: Date.now(),
    });
    const p = await store.getPack("SELFTS");
    if (p?.name !== "Self Test") throw new Error("pack roundtrip failed");
  });

  await run("raw tally (price game)", async () => {
    const rows = await store.rawTally(key, "selftest");
    if (!rows.some((r) => r.value === 2)) throw new Error("raw tally missed the vote");
  });

  await run("score post/top", async () => {
    // Blank initials keep selftest off the public board by design.
    await store.scorePost(key, device, "", 7);
    await store.scoresTop(key);
  });

  await run("spend + caps read", async () => {
    await store.totalSpendUsd(key);
    await store.deviceToolCount(key, device, 60 * 1000);
  });

  await run("room pin (join QR)", async () => {
    const pin = await store.roomPin(key);
    if (!pin) throw new Error("presenter key could not read the pin");
  });

  await run("jersey + THE BOARD", async () => {
    await store.profileSet(key, device, "ST", "🧪");
    const p = await store.profileGet(key, device);
    if (p?.initials !== "ST") throw new Error(`jersey read back ${JSON.stringify(p)}`);
    // The selftest vote from above should count for 10 on the board.
    const rows = await store.standings(key, ["selftest"]);
    const mine = rows.find((r) => r.deviceId === device);
    if (!mine || mine.points < 10) throw new Error(`board points ${mine?.points}`);
  });

  await run("podium award (idempotent)", async () => {
    await store.awardAdd(key, device, 100, "selftest:podium");
    await store.awardAdd(key, device, 100, "selftest:podium"); // must not double
    const rows = await store.standings(key, ["selftest"]);
    const mine = rows.find((r) => r.deviceId === device);
    // 10 (vote) + 100 (one podium, not two) + 70 (ring best 7 × 10) = 180.
    if (!mine || mine.points !== 180) throw new Error(`expected 180, got ${mine?.points}`);
    const entries = await store.priceEntries(key, "selftest");
    if (!entries.some((e) => e.deviceId === device && e.value === 2)) throw new Error("price entries missed the vote");
  });

  await run("machine guess roundtrip", async () => {
    await store.aiGuessSet(key, "selftest-price", 815, "selftest reasoning");
    const g = await store.aiGuessGet(key, "selftest-price");
    if (g?.guessK !== 815) throw new Error(`guess read back ${JSON.stringify(g)}`);
  });

  await run("duel stats", async () => {
    await store.duelStats(key);
  });

  await run("game slides open on arrival (no dead 'armed' slide)", async () => {
    // The bug this replaced: a poll slide sat closed until someone pressed a
    // second button, so phones showed nothing. Every poll/price slide must
    // report that it opens the floor the moment the presenter lands on it.
    const games = DECK.map((s, i) => i).filter((i) => DECK[i].poll || DECK[i].price);
    if (games.length < 4) throw new Error(`only ${games.length} game slides found`);
    const dead = games.filter((i) => !opensOnArrival(i));
    if (dead.length) throw new Error(`slides ${dead.join(",")} would sit armed`);
    const wrong = DECK.map((s, i) => i).filter((i) => !DECK[i].poll && !DECK[i].price && opensOnArrival(i));
    if (wrong.length) throw new Error(`non-game slides ${wrong.join(",")} claim to open`);
  });

  await run("selftest jersey benched (board stays clean)", async () => {
    // Blank initials pull the selftest device off THE BOARD — standings only
    // list suited-up players, so the test leaves no trace on the projector.
    await store.profileSet(key, device, "", "");
    const rows = await store.standings(key, ["selftest"]);
    if (rows.some((r) => r.deviceId === device)) throw new Error("selftest player still on the board");
  });

  // THE PUBLIC METERING PATH, which is the one a stranger from a Facebook
  // post actually travels. The original metering RPCs use their key as an
  // auth token and raise on anything that is not the presenter key or the
  // PIN, so every public surface — the invite's desk, a listing assistant
  // reached by QR — failed in the cap check before a model was ever called.
  // This asserts the keyless functions count, sum and write, and that they
  // partition away from the room's own budget. It runs on every selftest,
  // not just deep ones, because it costs nothing and it is the check whose
  // absence let a broken desk ship.
  await run("public metering works without a room key", async () => {
    const probe = randomUUID();
    const before = await store.meterSpendUsd("selftest-public");
    const roomBefore = await store.meterSpendUsd("big-reveal");
    const n0 = await store.meterCount("selftest-public", probe, 60 * 1000);
    if (n0 !== 0) throw new Error(`fresh device already has ${n0} events`);
    await store.meterLog("selftest-public", {
      deviceId: probe, tool: "sparring", inTokens: 1, outTokens: 1, costUsd: 0.000001, at: Date.now(),
    });
    const n1 = await store.meterCount("selftest-public", probe, 60 * 1000);
    if (n1 !== 1) throw new Error(`logged one turn, counted ${n1}`);
    const after = await store.meterSpendUsd("selftest-public");
    if (!(after > before)) throw new Error("spend did not move after a logged turn");
    // And the partition has to be real: the desk must never be able to spend
    // the room's allowance, or a busy Friday and a busy Facebook post would
    // starve each other.
    if (await store.meterCount("selftest-public-other", probe, 60 * 1000) !== 0) {
      throw new Error("a turn logged to one budget was counted against another");
    }
    if ((await store.meterSpendUsd("big-reveal")) !== roomBefore) {
      throw new Error("a public turn moved the room's own spend");
    }
  });

  // THE BOOKING — the only thing on the public invite a visitor can press, and
  // for a long time the only public path with no step here. That is exactly
  // the shape of the metering bug above: sixteen green steps, and none of them
  // ran the route a stranger actually runs.
  //
  // Covering it means writing a REAL reservation, which runs straight into the
  // rule the whole invite is built on — never claim a number you cannot
  // defend. The seat count on the page is live_rsvp_count(). So the test books
  // under a reference the count benches and the cleanup is the only thing
  // allowed to delete, then proves the seat count never moved.
  await run("booking: reserve, read back, clean up (seat count untouched)", async () => {
    // live_rsvp_add caps a reference at 24 characters, so the device id gets
    // trimmed to fit under the prefix rather than rejected as a bad ref.
    const ref = `${SELFTEST_REF}${device.replace(/-/g, "").slice(0, 12)}`;
    const seatsBefore = await store.rsvpCount();
    try {
      const at = await store.rsvpAdd({
        ref, name: "· selftest ·", cell: "000", attend: "zoom", note: "selftest",
      });
      if (!at) throw new Error("no timestamp came back from the write");

      // What /kit/[ref] greets somebody with has to be the row, not an echo of
      // what the browser sent — that is the whole reason the confirmation is
      // allowed to exist.
      const got = await store.rsvpGet(ref);
      if (!got) throw new Error("the reservation did not read back by its reference");
      if (got.who !== "·") throw new Error(`read back the wrong name: ${got.who}`);
      if (got.attend !== "zoom") throw new Error(`read back the wrong attendance: ${got.attend}`);

      // Idempotent: a retry from a flaky phone is the same seat, not a second.
      const again = await store.rsvpAdd({
        ref, name: "· selftest ·", cell: "000", attend: "zoom", note: "selftest",
      });
      if (again !== at) throw new Error("a retry on the same reference minted a second seat");

      if ((await store.rsvpCount()) !== seatsBefore) {
        throw new Error("a selftest booking moved the public seat count");
      }
    } finally {
      // Runs even when an assertion above threw, so a failure reports a
      // failure instead of leaving a row behind that looks like a guest.
      await store.rsvpSelftestClear(ref).catch(() => {});
    }
    if (await store.rsvpGet(ref)) {
      throw new Error("the selftest reservation survived its own cleanup");
    }
    if ((await store.rsvpCount()) !== seatsBefore) {
      throw new Error("the seat count did not come back to where it started");
    }
  });

  // And the cleanup has to be narrow, because anon can call it: there must be
  // no argument that deletes somebody's actual seat.
  await run("booking cleanup refuses a real reference", async () => {
    let refused = false;
    try {
      await store.rsvpSelftestClear("EA-ABC234");
    } catch {
      refused = true;
    }
    if (!refused) throw new Error("the cleanup accepted a real reference");
  });

  // ?deep=1 — one real grounded model round-trip: must state a sheet fact and
  // refuse an off-sheet one. Costs a fraction of a cent; the pre-room proof.
  // If the engine is dark, this FAILS rather than quietly skipping — a green
  // deep run has to mean the check actually ran.
  if (req.nextUrl.searchParams.get("deep") === "1") {
    await run("engine: grounded round-trip", async () => {
      if (!engineOnline()) throw new Error("ANTHROPIC_API_KEY not present in this deployment");
      const r = await runArcadeTurn({
        roomKey: key,
        deviceId: device,
        tool: "listing",
        system: listingAssistantSystem(STUMP_FACTS, "Mike", "warm", "eXp Realty", STUMP_NOTES),
        // The roof IS on the sheet now; the water heater deliberately is not.
        messages: [{ role: "user", content: "How many bedrooms, and when was the water heater last replaced?" }],
      });
      if (!r.ok) throw new Error(`engine ${r.reason}`);
      const statesFact = /4 bed|four bed/i.test(r.reply);
      const refuses = isRefusal(r.reply);
      if (!statesFact) throw new Error(`did not state the 4-bed fact: ${r.reply.slice(0, 140)}`);
      if (!refuses) throw new Error(`did not decline the water-heater question: ${r.reply.slice(0, 140)}`);
    });

    // THE OPEN FLOOR, end to end, against the real model. This is the one
    // segment where Val answers a live human in front of the room, so a green
    // deep run has to mean she actually answered — and answered inside the
    // rules. The claim check is the one that matters: she has none of their
    // data, so a dollar figure or a percentage about their business is the
    // exact failure this whole hour teaches against.
    await run("open floor: Val answers a confession, and claims no numbers", async () => {
      if (!engineOnline()) throw new Error("ANTHROPIC_API_KEY not present in this deployment");
      const r = await runArcadeTurn({
        roomKey: key,
        deviceId: device,
        tool: "sparring",
        system: bragSystem("confess", "an agent in the room"),
        messages: [{ role: "user", content: "I let it write a CMA and it invented a comp that does not exist." }],
      });
      if (!r.ok) throw new Error(`engine ${r.reason}`);
      if (r.reply.trim().length < 80) throw new Error(`answer too thin: ${r.reply}`);
      const claimsFigure = /\$\s?\d|\d+\s?%|\d+\s?(percent|hours? a week|deals?|leads?)\b/i.test(r.reply);
      if (claimsFigure) throw new Error(`claimed a number it cannot know: ${r.reply.slice(0, 200)}`);
      // And it has to end pointing at a conversation with Mike, because that
      // is the entire reason this segment exists.
      if (!/mike/i.test(r.reply)) throw new Error(`never invited them to sit down with Mike: ${r.reply.slice(0, 200)}`);
    });



    // THE TWO PROMPTS WE HAND TO STRANGERS, PUT IN FRONT OF A REAL MODEL.
    //
    // scripts/prompt-check.mjs asserts what the text says; these assert how a
    // model behaves when it reads it, which is the part that actually decides
    // whether an agent gets something good or gets garbage. One turn each,
    // capped at 400 output tokens — about a cent for the pair, which is the
    // cheapest insurance on this whole page.
    //
    // Both are USER turns, because that is how they are handed over: pasted
    // into a fresh conversation.
    await run("audit prompt: opens with one question, not a form", async () => {
      if (!engineOnline()) throw new Error("ANTHROPIC_API_KEY not present in this deployment");
      const r = await runArcadeTurn({
        roomKey: key,
        meterRoom: "prompt-check",
        tool: "sparring",
        deviceId: device,
        system: "Follow the user's message exactly as written.",
        messages: [{ role: "user", content: starterPrompt("", "") }],
      });
      if (!r.ok) throw new Error(`engine ${r.reason}`);
      // Phase 0 asks what they do. If it instead dumps the interview, the
      // whole thing reads as a form and people bail.
      if (!/\bwork\b|\bdo\b|\bjob\b|living/i.test(r.reply)) {
        throw new Error(`did not open by asking what they do: ${r.reply.slice(0, 160)}`);
      }
      if (/^\s*(Q?1[.)]|·|-)\s.*\n.*(Q?2[.)]|·|-)\s/m.test(r.reply)) {
        throw new Error(`dumped a list of questions instead of asking one: ${r.reply.slice(0, 200)}`);
      }
      if (r.reply.trim().length > 700) {
        throw new Error(`opened with a wall of text (${r.reply.length} chars), not one question`);
      }
    });

    await run("orb prompt: asks before it builds", async () => {
      if (!engineOnline()) throw new Error("ANTHROPIC_API_KEY not present in this deployment");
      const r = await runArcadeTurn({
        roomKey: key,
        meterRoom: "prompt-check",
        tool: "sparring",
        deviceId: device,
        system: "Follow the user's message exactly as written.",
        messages: [{ role: "user", content: orbPrompt("") }],
      });
      if (!r.ok) throw new Error(`engine ${r.reason}`);
      // It is told to ask four things first. Skipping straight to code means
      // somebody gets a generic mark in somebody else's colours.
      if (/<!doctype|<canvas|<html/i.test(r.reply)) {
        throw new Error(`started building before asking: ${r.reply.slice(0, 160)}`);
      }
      if (!r.reply.includes("?")) {
        throw new Error(`asked nothing: ${r.reply.slice(0, 160)}`);
      }
    });
  }

  const allOk = results.every((r) => r.ok);
  return NextResponse.json(
    {
      ok: allOk,
      backend: store.backend(),
      engineOnline: engineOnline(),
      // Whether this deployment can actually send the kit. Reported so the
      // question "is the mailer configured?" is answered by the deployment
      // rather than by somebody's memory of which env vars they pasted where.
      emailOnline: emailOnline(),
      results,
    },
    { status: allOk ? 200 : 500 }
  );
}
