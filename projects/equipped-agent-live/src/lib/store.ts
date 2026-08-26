// One store interface, two homes. Memory carries local dev; the database
// carries production — reached ONLY through security-definer functions, so
// the app ships zero secrets: every call proves itself with the key a human
// typed (room PIN for attendees, presenter key for the console), checked
// inside Postgres against the sealed live_config row.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { presenterKey, roomPin } from "./room";
import type { Lead, Pack, PollState, RoomState, ToolEvent, Vote } from "./types";

export type Role = "presenter" | "attendee" | null;

export interface Store {
  backend(): "memory" | "supabase";
  checkKey(key: string): Promise<Role>;

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
