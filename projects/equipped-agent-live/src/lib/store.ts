// One store interface, two homes. Memory carries local dev; the database
// carries production — reached ONLY through security-definer functions, so
// the app ships zero secrets: every call proves itself with the key a human
// typed (room PIN for attendees, presenter key for the console), checked
// inside Postgres against the sealed live_config row.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { HOUSE_CODE } from "./deck";
import { presenterKey, roomPin } from "./room";
import type {
  AiGuess, Assistant, AssistantLead, Attack, Lead, Pack, Player, PollState,
  RosterEntry, RoomState, ScoreRow, StumpEntry, ToolEvent, Vote,
} from "./types";

export type Role = "presenter" | "attendee" | null;

export interface Store {
  backend(): "memory" | "supabase";
  checkKey(key: string): Promise<Role>;
  /** The current room PIN — presenter key only, for the join QR/badge. */
  roomPin(key: string): Promise<string | null>;

  getState(key: string): Promise<RoomState>;
  setState(key: string, step: number, pollState: PollState): Promise<void>;

  /** Upsert — a device may change its vote while the poll is open. */
  castVote(key: string, v: Vote): Promise<void>;
  getVote(key: string, pollKey: string, deviceId: string): Promise<number | null>;
  tally(key: string, pollKey: string, optionCount: number): Promise<number[]>;

  addLead(key: string, l: Lead): Promise<void>;
  listLeads(key: string): Promise<Lead[]>;
  deleteLead(key: string, deviceId: string): Promise<void>;

  addToolEvent(key: string, e: ToolEvent): Promise<void>;
  deviceToolCount(key: string, deviceId: string, sinceMs: number): Promise<number>;
  totalSpendUsd(key: string): Promise<number>;

  /** Presence: called on every state poll; counted for the HUD. */
  touchDevice(key: string, deviceId: string): Promise<void>;
  activeDevices(key: string, withinMs: number): Promise<number>;

  savePack(key: string, p: Pack): Promise<void>;
  /** Pack pages are the product an agent keeps — public read by code. */
  getPack(code: string): Promise<Pack | null>;

  /** Price-guess polls: every distinct guessed value with its count. */
  rawTally(key: string, pollKey: string): Promise<{ value: number; n: number }[]>;

  stumpAdd(key: string, deviceId: string, question: string): Promise<number>;
  stumpAnswer(key: string, id: number, answer: string, refused: boolean): Promise<void>;
  stumpList(key: string, limit: number): Promise<StumpEntry[]>;

  scorePost(key: string, deviceId: string, initials: string, score: number): Promise<void>;
  scoresTop(key: string): Promise<ScoreRow[]>;

  /** Jerseys: a device picks initials + emoji once; everything attributes. */
  profileSet(key: string, deviceId: string, initials: string, emoji: string): Promise<void>;
  profileGet(key: string, deviceId: string): Promise<{ initials: string; emoji: string } | null>;

  /** THE BOARD — derived points. pollKeys is the deck's real poll list. */
  standings(key: string, pollKeys: string[]): Promise<Player[]>;
  /** Podium bonuses etc. — presenter key required by the backend. */
  awardAdd(key: string, deviceId: string, points: number, reason: string): Promise<void>;
  /** Per-device price guesses for podium math — presenter key required. */
  priceEntries(key: string, pollKey: string): Promise<{ deviceId: string; value: number }[]>;

  /** The machine's locked guess — presenter writes at open, room reads at reveal. */
  aiGuessSet(key: string, pollKey: string, guessK: number, reasoning: string): Promise<void>;
  aiGuessGet(key: string, pollKey: string): Promise<AiGuess | null>;

  /** House score for Stump: questions asked, honest refusals witnessed. */
  stumpStats(key: string): Promise<{ asked: number; refused: number }>;

  // ---- THE TROPHY: a real deployed assistant per attendee ----
  assistantCreate(key: string, deviceId: string, a: Assistant & { cell: string }): Promise<void>;
  /** Public read — the assistant page is meant to be scanned by strangers. */
  assistantGet(code: string): Promise<Assistant | null>;
  assistantMine(key: string, deviceId: string): Promise<Assistant | null>;
  assistantRoster(key: string): Promise<RosterEntry[]>;
  assistantLeadAdd(
    code: string, name: string, cell: string, question: string,
    q?: { timeline?: string; financing?: string; hasAgent?: string }
  ): Promise<void>;
  /** Server-side only — routes a captured lead to the owner's phone. */
  assistantOwnerCell(code: string): Promise<string | null>;
  assistantLeadsMine(key: string, deviceId: string): Promise<AssistantLead[]>;

  // ---- THE DUEL ----
  attackAdd(key: string, deviceId: string, code: string, q: string, a: string, refused: boolean): Promise<number>;
  attackFlag(key: string, id: number): Promise<void>;
  attackList(key: string, limit: number): Promise<Attack[]>;
  duelStats(key: string): Promise<{ fired: number; held: number; flagged: number; built: number }>;
}

// ---------------------------------------------------------------- memory

class MemoryStore implements Store {
  private state: RoomState = { step: 0, pollState: "closed", updatedAt: Date.now() };
  private votes = new Map<string, Vote>(); // `${pollKey}:${deviceId}`
  private leads: Lead[] = [];
  private events: ToolEvent[] = [];
  private seen = new Map<string, number>();
  private packs = new Map<string, Pack>();

  backend() {
    return "memory" as const;
  }
  async checkKey(key: string): Promise<Role> {
    if (key === presenterKey()) return "presenter";
    if (key === roomPin()) return "attendee";
    return null;
  }
  async roomPin(key: string) {
    return key === presenterKey() ? roomPin() : null;
  }
  async getState() {
    return this.state;
  }
  async setState(_key: string, step: number, pollState: PollState) {
    this.state = { step, pollState, updatedAt: Date.now() };
  }
  async castVote(_key: string, v: Vote) {
    this.votes.set(`${v.pollKey}:${v.deviceId}`, v);
  }
  async getVote(_key: string, pollKey: string, deviceId: string) {
    return this.votes.get(`${pollKey}:${deviceId}`)?.choice ?? null;
  }
  async tally(_key: string, pollKey: string, optionCount: number) {
    const counts = new Array<number>(optionCount).fill(0);
    for (const v of this.votes.values()) {
      if (v.pollKey === pollKey && v.choice >= 0 && v.choice < optionCount) counts[v.choice]++;
    }
    return counts;
  }
  async addLead(_key: string, l: Lead) {
    const i = this.leads.findIndex((x) => x.deviceId === l.deviceId);
    if (i >= 0) this.leads[i] = l;
    else this.leads.push(l);
  }
  async listLeads() {
    return [...this.leads].sort((a, b) => b.at - a.at);
  }
  async deleteLead(_key: string, deviceId: string) {
    this.leads = this.leads.filter((l) => l.deviceId !== deviceId);
  }
  async addToolEvent(_key: string, e: ToolEvent) {
    this.events.push(e);
  }
  async deviceToolCount(_key: string, deviceId: string, sinceMs: number) {
    const cutoff = Date.now() - sinceMs;
    return this.events.filter((e) => e.deviceId === deviceId && e.at >= cutoff).length;
  }
  async totalSpendUsd() {
    return this.events.reduce((s, e) => s + e.costUsd, 0);
  }
  async touchDevice(_key: string, deviceId: string) {
    this.seen.set(deviceId, Date.now());
  }
  async activeDevices(_key: string, withinMs: number) {
    const cutoff = Date.now() - withinMs;
    let n = 0;
    for (const t of this.seen.values()) if (t >= cutoff) n++;
    return n;
  }
  async savePack(_key: string, p: Pack) {
    this.packs.set(p.code, p);
  }
  async getPack(code: string) {
    return this.packs.get(code) ?? null;
  }

  async rawTally(_key: string, pollKey: string) {
    const byValue = new Map<number, number>();
    for (const v of this.votes.values()) {
      if (v.pollKey === pollKey) byValue.set(v.choice, (byValue.get(v.choice) ?? 0) + 1);
    }
    return [...byValue.entries()].map(([value, n]) => ({ value, n })).sort((a, b) => a.value - b.value);
  }

  private stump: (StumpEntry & { deviceId: string })[] = [];
  private stumpSeq = 0;
  async stumpAdd(_key: string, deviceId: string, question: string) {
    const id = ++this.stumpSeq;
    this.stump.push({ id, deviceId, question, answer: "", refused: false, at: Date.now() });
    return id;
  }
  async stumpAnswer(_key: string, id: number, answer: string, refused: boolean) {
    const e = this.stump.find((s) => s.id === id);
    if (e) {
      e.answer = answer;
      e.refused = refused;
    }
  }
  async stumpList(_key: string, limit: number) {
    return [...this.stump]
      .sort((a, b) => b.at - a.at)
      .slice(0, limit)
      .map(({ deviceId, ...e }) => ({
        ...e,
        initials: this.players.get(deviceId)?.initials ?? "",
        emoji: this.players.get(deviceId)?.emoji ?? "",
      }));
  }
  async stumpStats(_key: string) {
    return { asked: this.stump.length, refused: this.stump.filter((s) => s.refused).length };
  }

  private players = new Map<string, { initials: string; emoji: string; at: number }>();
  private awards: { deviceId: string; points: number; reason: string }[] = [];
  private aiGuesses = new Map<string, AiGuess>();

  async profileSet(_key: string, deviceId: string, initials: string, emoji: string) {
    this.players.set(deviceId, {
      initials: initials.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase(),
      emoji: emoji.slice(0, 8),
      at: this.players.get(deviceId)?.at ?? Date.now(),
    });
  }
  async profileGet(_key: string, deviceId: string) {
    const p = this.players.get(deviceId);
    return p ? { initials: p.initials, emoji: p.emoji } : null;
  }
  // MUST match the database's live_standings exactly, or local and production
  // disagree about who is winning: 10/poll voted, 25/assistant shipped,
  // 10/shot fired (first 3), 15 per honest refusal YOUR assistant made,
  // best ring x10, plus awards from the stage.
  async standings(_key: string, pollKeys: string[]) {
    const rows: Player[] = [];
    for (const [deviceId, p] of this.players) {
      if (!p.initials) continue;
      const votedKeys = new Set(
        [...this.votes.values()].filter((v) => v.deviceId === deviceId && pollKeys.includes(v.pollKey)).map((v) => v.pollKey)
      );
      const built = [...this.assistants.values()].filter((a) => a.deviceId === deviceId && a.code !== HOUSE_CODE);
      const fired = Math.min(this.attacks.filter((t) => t.attacker === deviceId).length, 3);
      const myCodes = new Set(built.map((a) => a.code));
      const held = this.attacks.filter((t) => t.refused && myCodes.has(t.code)).length;
      const best = this.scores.get(deviceId)?.best ?? 0;
      const bonus = this.awards.filter((a) => a.deviceId === deviceId).reduce((s, a) => s + a.points, 0);
      rows.push({
        deviceId,
        initials: p.initials,
        emoji: p.emoji,
        points: votedKeys.size * 10 + built.length * 25 + fired * 10 + held * 15 + best * 10 + bonus,
      });
    }
    return rows.sort((a, b) => b.points - a.points).slice(0, 60);
  }
  async awardAdd(key: string, deviceId: string, points: number, reason: string) {
    if (key !== presenterKey()) throw new Error("not_presenter");
    // Same idempotency as the database: one award per (device, reason).
    if (this.awards.some((a) => a.deviceId === deviceId && a.reason === reason)) return;
    this.awards.push({ deviceId, points, reason });
  }
  async priceEntries(key: string, pollKey: string) {
    if (key !== presenterKey()) throw new Error("not_presenter");
    return [...this.votes.values()].filter((v) => v.pollKey === pollKey).map((v) => ({ deviceId: v.deviceId, value: v.choice }));
  }
  async aiGuessSet(key: string, pollKey: string, guessK: number, reasoning: string) {
    if (key !== presenterKey()) throw new Error("not_presenter");
    this.aiGuesses.set(pollKey, { guessK, reasoning });
  }
  async aiGuessGet(_key: string, pollKey: string) {
    return this.aiGuesses.get(pollKey) ?? null;
  }

  private assistants = new Map<string, Assistant & { deviceId: string; cell: string; at: number }>();
  private aLeads: (AssistantLead & { code: string })[] = [];
  private attacks: (Attack & { attacker: string })[] = [];
  private attackSeq = 0;

  async assistantCreate(_key: string, deviceId: string, a: Assistant & { cell: string }) {
    this.assistants.set(a.code.toUpperCase(), { ...a, code: a.code.toUpperCase(), deviceId, at: Date.now() });
  }
  async assistantGet(code: string) {
    const a = this.assistants.get(code.toUpperCase());
    if (!a) return null;
    const { deviceId, cell, at, ...pub } = a; // cell never leaves the server
    void deviceId; void cell; void at;
    return pub;
  }
  async assistantMine(_key: string, deviceId: string) {
    const mine = [...this.assistants.values()].filter((a) => a.deviceId === deviceId).sort((x, y) => y.at - x.at)[0];
    if (!mine) return null;
    const { deviceId: d, cell, at, ...pub } = mine;
    void d; void cell; void at;
    return pub;
  }
  async assistantRoster(_key: string): Promise<RosterEntry[]> {
    return [...this.assistants.values()]
      .sort((a, b) => Number(b.code === HOUSE_CODE) - Number(a.code === HOUSE_CODE) || a.at - b.at)
      .map((a) => ({
        code: a.code,
        agentName: a.agentName,
        headline: a.headline,
        initials: a.code === HOUSE_CODE ? "HOUSE" : this.players.get(a.deviceId)?.initials ?? "",
        emoji: a.code === HOUSE_CODE ? "🏛" : this.players.get(a.deviceId)?.emoji ?? "",
        deviceId: a.deviceId,
      }));
  }
  async assistantLeadAdd(
    code: string, name: string, cell: string, question: string,
    q?: { timeline?: string; financing?: string; hasAgent?: string }
  ) {
    if (!this.assistants.has(code.toUpperCase())) throw new Error("no_assistant");
    this.aLeads.push({
      code: code.toUpperCase(), name, cell, question,
      timeline: q?.timeline ?? "", financing: q?.financing ?? "", hasAgent: q?.hasAgent ?? "",
      at: Date.now(),
    });
  }
  async assistantOwnerCell(code: string) {
    return this.assistants.get(code.toUpperCase())?.cell ?? null;
  }
  async assistantLeadsMine(_key: string, deviceId: string) {
    const codes = new Set([...this.assistants.values()].filter((a) => a.deviceId === deviceId).map((a) => a.code));
    return this.aLeads.filter((l) => codes.has(l.code)).sort((a, b) => b.at - a.at).slice(0, 25)
      .map(({ code, ...l }) => { void code; return l; });
  }

  async attackAdd(_key: string, deviceId: string, code: string, q: string, a: string, refused: boolean) {
    const id = ++this.attackSeq;
    const target = this.assistants.get(code.toUpperCase());
    this.attacks.push({
      id, code: code.toUpperCase(), agentName: target?.agentName ?? "", question: q, answer: a,
      refused, flagged: false, initials: this.players.get(deviceId)?.initials ?? "",
      emoji: this.players.get(deviceId)?.emoji ?? "", at: Date.now(), attacker: deviceId,
    });
    return id;
  }
  async attackFlag(_key: string, id: number) {
    const t = this.attacks.find((x) => x.id === id);
    if (t) t.flagged = true;
  }
  async attackList(_key: string, limit: number): Promise<Attack[]> {
    return [...this.attacks].sort((a, b) => b.at - a.at).slice(0, limit)
      .map(({ attacker, ...t }) => { void attacker; return t; });
  }
  async duelStats(_key: string) {
    return {
      fired: this.attacks.length,
      held: this.attacks.filter((t) => t.refused).length,
      flagged: this.attacks.filter((t) => t.flagged).length,
      built: [...this.assistants.values()].filter((a) => a.code !== HOUSE_CODE).length,
    };
  }

  private scores = new Map<string, ScoreRow & { at: number }>();
  async scorePost(_key: string, deviceId: string, initials: string, score: number) {
    const prev = this.scores.get(deviceId);
    const ini = initials.trim().slice(0, 3).toUpperCase() || prev?.initials || "";
    this.scores.set(deviceId, {
      initials: ini,
      best: Math.max(prev?.best ?? 0, score),
      rounds: (prev?.rounds ?? 0) + 1,
      at: Date.now(),
    });
  }
  async scoresTop(_key: string) {
    return [...this.scores.values()]
      .filter((s) => s.initials)
      .sort((a, b) => b.best - a.best || a.at - b.at)
      .slice(0, 10)
      .map(({ initials, best, rounds }) => ({ initials, best, rounds }));
  }
}

// ------------------------------------------------------------------ rpc

class RpcStore implements Store {
  constructor(private sb: SupabaseClient) {}

  backend() {
    return "supabase" as const;
  }

  private async call<T>(fn: string, args: Record<string, unknown>): Promise<T> {
    const { data, error } = await this.sb.rpc(fn, args);
    if (error) throw new Error(`${fn}: ${error.message}`);
    return data as T;
  }

  async checkKey(key: string): Promise<Role> {
    const role = await this.call<string | null>("live_check_key", { p_key: key });
    return role === "presenter" || role === "attendee" ? role : null;
  }
  async roomPin(key: string) {
    const pin = await this.call<string | null>("live_room_pin", { p_key: key });
    return typeof pin === "string" && pin.length > 0 ? pin : null;
  }
  async getState(key: string): Promise<RoomState> {
    const rows = await this.call<{ step: number; poll_state: string }[]>("live_state_get", { p_key: key });
    const r = rows?.[0];
    if (!r) return { step: 0, pollState: "closed", updatedAt: Date.now() };
    return { step: r.step, pollState: r.poll_state as PollState, updatedAt: Date.now() };
  }
  async setState(key: string, step: number, pollState: PollState) {
    await this.call("live_state_set", { p_key: key, p_step: step, p_poll_state: pollState });
  }
  async castVote(key: string, v: Vote) {
    await this.call("live_vote_cast", { p_key: key, p_device: v.deviceId, p_poll: v.pollKey, p_choice: v.choice });
  }
  async getVote(key: string, pollKey: string, deviceId: string) {
    const v = await this.call<number | null>("live_vote_get", { p_key: key, p_device: deviceId, p_poll: pollKey });
    return typeof v === "number" ? v : null;
  }
  async tally(key: string, pollKey: string, optionCount: number) {
    const rows = await this.call<{ choice: number; n: number }[]>("live_tally", { p_key: key, p_poll: pollKey });
    const counts = new Array<number>(optionCount).fill(0);
    for (const r of rows ?? []) {
      if (r.choice >= 0 && r.choice < optionCount) counts[r.choice] = Number(r.n);
    }
    return counts;
  }
  async addLead(key: string, l: Lead) {
    await this.call("live_lead_add", {
      p_key: key,
      p_device: l.deviceId,
      p_name: l.name,
      p_cell: l.cell,
      p_rung: l.rung,
    });
  }
  async listLeads(key: string): Promise<Lead[]> {
    const rows = await this.call<{ device_id: string; name: string; cell: string; rung: string; at: string }[]>(
      "live_leads_list",
      { p_key: key }
    );
    return (rows ?? []).map((r) => ({
      deviceId: r.device_id,
      name: r.name,
      cell: r.cell,
      rung: r.rung,
      at: new Date(r.at).getTime(),
    }));
  }
  async deleteLead(key: string, deviceId: string) {
    await this.call("live_lead_delete", { p_key: key, p_device: deviceId });
  }
  async addToolEvent(key: string, e: ToolEvent) {
    await this.call("live_tool_event_add", {
      p_key: key,
      p_device: e.deviceId,
      p_tool: e.tool,
      p_in: e.inTokens,
      p_out: e.outTokens,
      p_cost: e.costUsd,
    });
  }
  async deviceToolCount(key: string, deviceId: string, sinceMs: number) {
    const n = await this.call<number>("live_tool_count", {
      p_key: key,
      p_device: deviceId,
      p_seconds: Math.max(1, Math.round(sinceMs / 1000)),
    });
    return Number(n) || 0;
  }
  async totalSpendUsd(key: string) {
    const s = await this.call<number>("live_spend", { p_key: key });
    return Number(s) || 0;
  }
  async touchDevice(key: string, deviceId: string) {
    await this.call("live_touch", { p_key: key, p_device: deviceId });
  }
  async activeDevices(key: string, withinMs: number) {
    const n = await this.call<number>("live_active", {
      p_key: key,
      p_seconds: Math.max(1, Math.round(withinMs / 1000)),
    });
    return Number(n) || 0;
  }
  async savePack(key: string, p: Pack) {
    await this.call("live_pack_save", {
      p_key: key,
      p_code: p.code,
      p_device: p.deviceId,
      p_name: p.name,
      p_brokerage: p.brokerage,
      p_area: p.area,
      p_specialty: p.specialty,
      p_tone: p.tone,
    });
  }
  async getPack(code: string): Promise<Pack | null> {
    const rows = await this.call<
      { code: string; device_id: string; name: string; brokerage: string; area: string; specialty: string; tone: string; created_at: string }[]
    >("live_pack_get", { p_code: code });
    const r = rows?.[0];
    if (!r) return null;
    return {
      code: r.code,
      deviceId: r.device_id,
      name: r.name,
      brokerage: r.brokerage,
      area: r.area,
      specialty: r.specialty,
      tone: r.tone as Pack["tone"],
      createdAt: new Date(r.created_at).getTime(),
    };
  }

  async rawTally(key: string, pollKey: string) {
    const rows = await this.call<{ value: number; n: number }[]>("live_tally_raw", { p_key: key, p_poll: pollKey });
    return (rows ?? []).map((r) => ({ value: Number(r.value), n: Number(r.n) }));
  }

  async stumpAdd(key: string, deviceId: string, question: string) {
    const id = await this.call<number>("live_stump_add", { p_key: key, p_device: deviceId, p_question: question });
    return Number(id);
  }
  async stumpAnswer(key: string, id: number, answer: string, refused: boolean) {
    await this.call("live_stump_answer", { p_key: key, p_id: id, p_answer: answer, p_refused: refused });
  }
  async stumpList(key: string, limit: number): Promise<StumpEntry[]> {
    const rows = await this.call<
      { id: number; question: string; answer: string; refused: boolean; at: string; initials: string; emoji: string }[]
    >("live_stump_list", { p_key: key, p_limit: limit });
    return (rows ?? []).map((r) => ({
      id: Number(r.id),
      question: r.question,
      answer: r.answer,
      refused: r.refused,
      at: new Date(r.at).getTime(),
      initials: r.initials ?? "",
      emoji: r.emoji ?? "",
    }));
  }
  async stumpStats(key: string) {
    const rows = await this.call<{ asked: number; refused: number }[]>("live_stump_stats", { p_key: key });
    const r = rows?.[0];
    return { asked: Number(r?.asked) || 0, refused: Number(r?.refused) || 0 };
  }

  async profileSet(key: string, deviceId: string, initials: string, emoji: string) {
    await this.call("live_profile_set", { p_key: key, p_device: deviceId, p_initials: initials, p_emoji: emoji });
  }
  async profileGet(key: string, deviceId: string) {
    const rows = await this.call<{ initials: string; emoji: string }[]>("live_profile_get", {
      p_key: key,
      p_device: deviceId,
    });
    const r = rows?.[0];
    return r ? { initials: r.initials ?? "", emoji: r.emoji ?? "" } : null;
  }
  async standings(key: string, pollKeys: string[]): Promise<Player[]> {
    const rows = await this.call<{ device_id: string; initials: string; emoji: string; points: number }[]>(
      "live_standings",
      { p_key: key, p_polls: pollKeys }
    );
    return (rows ?? []).map((r) => ({
      deviceId: r.device_id,
      initials: r.initials,
      emoji: r.emoji ?? "",
      points: Number(r.points) || 0,
    }));
  }
  async awardAdd(key: string, deviceId: string, points: number, reason: string) {
    await this.call("live_award_add", { p_key: key, p_device: deviceId, p_points: points, p_reason: reason });
  }
  async priceEntries(key: string, pollKey: string) {
    const rows = await this.call<{ device_id: string; choice: number }[]>("live_price_entries", {
      p_key: key,
      p_poll: pollKey,
    });
    return (rows ?? []).map((r) => ({ deviceId: r.device_id, value: Number(r.choice) }));
  }
  async aiGuessSet(key: string, pollKey: string, guessK: number, reasoning: string) {
    await this.call("live_ai_guess_set", { p_key: key, p_poll: pollKey, p_guess: guessK, p_reason: reasoning });
  }
  async aiGuessGet(key: string, pollKey: string): Promise<AiGuess | null> {
    const rows = await this.call<{ guess_k: number; reasoning: string }[]>("live_ai_guess_get", {
      p_key: key,
      p_poll: pollKey,
    });
    const r = rows?.[0];
    return r ? { guessK: Number(r.guess_k), reasoning: r.reasoning ?? "" } : null;
  }

  async assistantCreate(key: string, deviceId: string, a: Assistant & { cell: string }) {
    await this.call("live_assistant_create", {
      p_key: key, p_device: deviceId, p_code: a.code, p_name: a.agentName,
      p_brokerage: a.brokerage, p_cell: a.cell, p_headline: a.headline,
      p_facts: a.facts, p_voice: a.voice, p_notes: a.notes,
    });
  }
  private rowToAssistant(r: { code: string; agent_name: string; brokerage: string; headline: string; facts: string; voice: string; notes?: string }): Assistant {
    return {
      code: r.code, agentName: r.agent_name, brokerage: r.brokerage ?? "",
      headline: r.headline ?? "", facts: r.facts, notes: r.notes ?? "",
      voice: (r.voice as Assistant["voice"]) ?? "warm",
    };
  }
  async assistantGet(code: string) {
    const rows = await this.call<{ code: string; agent_name: string; brokerage: string; headline: string; facts: string; voice: string; notes: string }[]>(
      "live_assistant_get", { p_code: code }
    );
    return rows?.[0] ? this.rowToAssistant(rows[0]) : null;
  }
  async assistantMine(key: string, deviceId: string) {
    const rows = await this.call<{ code: string; agent_name: string; brokerage: string; headline: string; facts: string; voice: string; notes: string }[]>(
      "live_assistant_mine", { p_key: key, p_device: deviceId }
    );
    return rows?.[0] ? this.rowToAssistant(rows[0]) : null;
  }
  async assistantRoster(key: string): Promise<RosterEntry[]> {
    const rows = await this.call<{ code: string; agent_name: string; headline: string; initials: string; emoji: string; device_id: string }[]>(
      "live_assistant_roster", { p_key: key }
    );
    return (rows ?? []).map((r) => ({
      code: r.code, agentName: r.agent_name, headline: r.headline ?? "",
      initials: r.initials ?? "", emoji: r.emoji ?? "", deviceId: r.device_id,
    }));
  }
  async assistantLeadAdd(
    code: string, name: string, cell: string, question: string,
    q?: { timeline?: string; financing?: string; hasAgent?: string }
  ) {
    await this.call("live_assistant_lead_add", {
      p_code: code, p_name: name, p_cell: cell, p_question: question,
      p_timeline: q?.timeline ?? "", p_financing: q?.financing ?? "", p_has_agent: q?.hasAgent ?? "",
    });
  }
  async assistantOwnerCell(code: string) {
    const v = await this.call<string | null>("live_assistant_owner_cell", { p_code: code });
    return typeof v === "string" && v ? v : null;
  }
  async assistantLeadsMine(key: string, deviceId: string): Promise<AssistantLead[]> {
    const rows = await this.call<{ name: string; cell: string; question: string; timeline: string; financing: string; has_agent: string; at: string }[]>(
      "live_assistant_leads_mine", { p_key: key, p_device: deviceId }
    );
    return (rows ?? []).map((r) => ({
      name: r.name, cell: r.cell, question: r.question ?? "",
      timeline: r.timeline ?? "", financing: r.financing ?? "", hasAgent: r.has_agent ?? "",
      at: new Date(r.at).getTime(),
    }));
  }

  async attackAdd(key: string, deviceId: string, code: string, q: string, a: string, refused: boolean) {
    const id = await this.call<number>("live_attack_add", {
      p_key: key, p_device: deviceId, p_code: code, p_question: q, p_answer: a, p_refused: refused,
    });
    return Number(id);
  }
  async attackFlag(key: string, id: number) {
    await this.call("live_attack_flag", { p_key: key, p_id: id });
  }
  async attackList(key: string, limit: number): Promise<Attack[]> {
    const rows = await this.call<{ id: number; code: string; agent_name: string; question: string; answer: string; refused: boolean; flagged: boolean; initials: string; emoji: string; at: string }[]>(
      "live_attack_list", { p_key: key, p_limit: limit }
    );
    return (rows ?? []).map((r) => ({
      id: Number(r.id), code: r.code, agentName: r.agent_name ?? "", question: r.question,
      answer: r.answer ?? "", refused: r.refused, flagged: r.flagged,
      initials: r.initials ?? "", emoji: r.emoji ?? "", at: new Date(r.at).getTime(),
    }));
  }
  async duelStats(key: string) {
    const rows = await this.call<{ fired: number; held: number; flagged: number; built: number }[]>("live_duel_stats", { p_key: key });
    const r = rows?.[0];
    return { fired: Number(r?.fired) || 0, held: Number(r?.held) || 0, flagged: Number(r?.flagged) || 0, built: Number(r?.built) || 0 };
  }

  async scorePost(key: string, deviceId: string, initials: string, score: number) {
    await this.call("live_score_post", { p_key: key, p_device: deviceId, p_initials: initials, p_score: score });
  }
  async scoresTop(key: string): Promise<ScoreRow[]> {
    const rows = await this.call<{ initials: string; best: number; rounds: number }[]>("live_scores_top", {
      p_key: key,
    });
    return (rows ?? []).map((r) => ({ initials: r.initials, best: Number(r.best), rounds: Number(r.rounds) }));
  }
}

// -------------------------------------------------------------- selector

// The Supabase URL and anon key are publishable by design — safe as defaults.
// They only kick in on Vercel; local dev stays on memory unless env says so.
const DEFAULT_SUPABASE_URL = "https://iwotispqqcnkrbcnvozq.supabase.co";
const DEFAULT_SUPABASE_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3b3Rpc3BxcWNua3JiY252b3pxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5ODk5MTQsImV4cCI6MjA5NzU2NTkxNH0.cnvrHhZkrygCNuxMQitqsS9TBqC_1Uy0h6ymh9jmppY";

declare global {
  // eslint-disable-next-line no-var
  var __eaStore: Store | undefined;
}

export function getStore(): Store {
  if (!globalThis.__eaStore) {
    const onVercel = Boolean(process.env.VERCEL);
    const url = process.env.SUPABASE_URL || (onVercel ? DEFAULT_SUPABASE_URL : undefined);
    const key = process.env.SUPABASE_ANON_KEY || (onVercel ? DEFAULT_SUPABASE_ANON : undefined);
    globalThis.__eaStore =
      url && key
        ? new RpcStore(createClient(url, key, { auth: { persistSession: false } }))
        : new MemoryStore();
  }
  return globalThis.__eaStore;
}
