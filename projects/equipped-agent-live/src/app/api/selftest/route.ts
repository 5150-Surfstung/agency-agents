// The room proves itself. One GET runs the whole store protocol end-to-end
// inside production — state roundtrip, vote, tally, presence, lead add/list/
// delete, pack save/get — and reports pass/fail per step plus which backend
// carried it. Run it before every real room.

import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { engineOnline, runArcadeTurn } from "@/lib/ai";
import { STUMP_FACTS } from "@/lib/deck";
import { listingAssistantSystem } from "@/lib/prompts";
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

  // ?deep=1 — one real grounded model round-trip: must state a sheet fact and
  // refuse an off-sheet one. Costs a fraction of a cent; the pre-room proof.
  if (req.nextUrl.searchParams.get("deep") === "1" && engineOnline()) {
    await run("engine: grounded round-trip", async () => {
      const r = await runArcadeTurn({
        roomKey: key,
        deviceId: device,
        tool: "listing",
        system: listingAssistantSystem(STUMP_FACTS, "Mike"),
        messages: [{ role: "user", content: "How many bedrooms, and what year was the roof replaced?" }],
      });
      if (!r.ok) throw new Error(`engine ${r.reason}`);
      const statesFact = /4 bed|four bed/i.test(r.reply);
      const refuses = /don't want to guess|not on the sheet|don't have|confirm/i.test(r.reply);
      if (!statesFact) throw new Error(`did not state the 4-bed fact: ${r.reply.slice(0, 140)}`);
      if (!refuses) throw new Error(`did not refuse the roof question: ${r.reply.slice(0, 140)}`);
    });
  }

  const allOk = results.every((r) => r.ok);
  return NextResponse.json(
    { ok: allOk, backend: store.backend(), engineOnline: engineOnline(), results },
    { status: allOk ? 200 : 500 }
  );
}
