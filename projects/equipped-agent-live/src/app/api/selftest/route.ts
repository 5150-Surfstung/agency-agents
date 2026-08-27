// The room proves itself. One GET runs the whole store protocol end-to-end
// inside production — state roundtrip, vote, tally, presence, lead add/list/
// delete, pack save/get — and reports pass/fail per step plus which backend
// carried it. Run it before every real room.

import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { engineOnline, runArcadeTurn } from "@/lib/ai";
import { DECK, STUMP_FACTS, STUMP_NOTES, opensOnArrival } from "@/lib/deck";
import { listingAssistantSystem } from "@/lib/prompts";
import { isRefusal } from "@/lib/refusal";
import { getStore } from "@/lib/store";

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
  }

  const allOk = results.every((r) => r.ok);
  return NextResponse.json(
    { ok: allOk, backend: store.backend(), engineOnline: engineOnline(), results },
    { status: allOk ? 200 : 500 }
  );
}
