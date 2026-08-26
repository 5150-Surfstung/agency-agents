// The room proves itself. One GET runs the whole store protocol end-to-end
// inside production — state roundtrip, vote, tally, presence, lead add/list/
// delete, pack save/get — and reports pass/fail per step plus which backend
// carried it. Run it before every real room.

import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { engineOnline } from "@/lib/ai";
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

  await run("spend + caps read", async () => {
    await store.totalSpendUsd(key);
    await store.deviceToolCount(key, device, 60 * 1000);
  });

  const allOk = results.every((r) => r.ok);
  return NextResponse.json(
    { ok: allOk, backend: store.backend(), engineOnline: engineOnline(), results },
    { status: allOk ? 200 : 500 }
  );
}
