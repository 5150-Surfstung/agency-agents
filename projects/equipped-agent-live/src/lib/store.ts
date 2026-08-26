// One store interface, two homes. Memory carries dev and any single-node
// deploy; Supabase carries serverless, where lambdas share nothing. The
// selector is env-presence — no config flag to forget.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Lead, PollState, RoomState, ToolEvent, Vote } from "./types";

export interface Store {
  getState(): Promise<RoomState>;
  setState(step: number, pollState: PollState): Promise<void>;

  /** Upsert — a device may change its vote while the poll is open. */
  castVote(v: Vote): Promise<void>;
  getVote(pollKey: string, deviceId: string): Promise<number | null>;
  tally(pollKey: string, optionCount: number): Promise<number[]>;

  addLead(l: Lead): Promise<void>;
  listLeads(): Promise<Lead[]>;

  addToolEvent(e: ToolEvent): Promise<void>;
  deviceToolCount(deviceId: string, sinceMs: number): Promise<number>;
  totalSpendUsd(): Promise<number>;

  /** Presence: called on every state poll; counted for the HUD. */
  touchDevice(deviceId: string): Promise<void>;
  activeDevices(withinMs: number): Promise<number>;
}

// ---------------------------------------------------------------- memory

class MemoryStore implements Store {
  private state: RoomState = { step: 0, pollState: "closed", updatedAt: Date.now() };
  private votes = new Map<string, Vote>(); // `${pollKey}:${deviceId}`
  private leads: Lead[] = [];
  private events: ToolEvent[] = [];
  private seen = new Map<string, number>();

  async getState() {
    return this.state;
  }
  async setState(step: number, pollState: PollState) {
    this.state = { step, pollState, updatedAt: Date.now() };
  }
  async castVote(v: Vote) {
    this.votes.set(`${v.pollKey}:${v.deviceId}`, v);
  }
  async getVote(pollKey: string, deviceId: string) {
    return this.votes.get(`${pollKey}:${deviceId}`)?.choice ?? null;
  }
  async tally(pollKey: string, optionCount: number) {
    const counts = new Array<number>(optionCount).fill(0);
    for (const v of this.votes.values()) {
      if (v.pollKey === pollKey && v.choice >= 0 && v.choice < optionCount) counts[v.choice]++;
    }
    return counts;
  }
  async addLead(l: Lead) {
    // One lead per device — a resubmit updates rather than duplicates.
    const i = this.leads.findIndex((x) => x.deviceId === l.deviceId);
    if (i >= 0) this.leads[i] = l;
    else this.leads.push(l);
  }
  async listLeads() {
    return [...this.leads].sort((a, b) => b.at - a.at);
  }
  async addToolEvent(e: ToolEvent) {
    this.events.push(e);
  }
  async deviceToolCount(deviceId: string, sinceMs: number) {
    const cutoff = Date.now() - sinceMs;
    return this.events.filter((e) => e.deviceId === deviceId && e.at >= cutoff).length;
  }
  async totalSpendUsd() {
    return this.events.reduce((s, e) => s + e.costUsd, 0);
  }
  async touchDevice(deviceId: string) {
    this.seen.set(deviceId, Date.now());
  }
  async activeDevices(withinMs: number) {
    const cutoff = Date.now() - withinMs;
    let n = 0;
    for (const t of this.seen.values()) if (t >= cutoff) n++;
    return n;
  }
}

// -------------------------------------------------------------- supabase

const ROOM = "big-reveal"; // single-room product; the slug scopes every row

class SupabaseStore implements Store {
  constructor(private sb: SupabaseClient) {}

  async getState(): Promise<RoomState> {
    const { data } = await this.sb
      .from("live_state")
      .select("step, poll_state, updated_at")
      .eq("room", ROOM)
      .maybeSingle();
    if (!data) return { step: 0, pollState: "closed", updatedAt: Date.now() };
    return {
      step: data.step,
      pollState: data.poll_state as PollState,
      updatedAt: new Date(data.updated_at).getTime(),
    };
  }
  async setState(step: number, pollState: PollState) {
    await this.sb
      .from("live_state")
      .upsert({ room: ROOM, step, poll_state: pollState, updated_at: new Date().toISOString() });
  }
  async castVote(v: Vote) {
    await this.sb.from("live_votes").upsert(
      {
        room: ROOM,
        poll_key: v.pollKey,
        device_id: v.deviceId,
        choice: v.choice,
        at: new Date(v.at).toISOString(),
      },
      { onConflict: "room,poll_key,device_id" }
    );
  }
  async getVote(pollKey: string, deviceId: string) {
    const { data } = await this.sb
      .from("live_votes")
      .select("choice")
      .eq("room", ROOM)
      .eq("poll_key", pollKey)
      .eq("device_id", deviceId)
      .maybeSingle();
    return data?.choice ?? null;
  }
  async tally(pollKey: string, optionCount: number) {
    const { data } = await this.sb
      .from("live_votes")
      .select("choice")
      .eq("room", ROOM)
      .eq("poll_key", pollKey);
    const counts = new Array<number>(optionCount).fill(0);
    for (const row of data ?? []) {
      if (row.choice >= 0 && row.choice < optionCount) counts[row.choice]++;
    }
    return counts;
  }
  async addLead(l: Lead) {
    await this.sb.from("live_leads").upsert(
      {
        room: ROOM,
        device_id: l.deviceId,
        name: l.name,
        cell: l.cell,
        rung: l.rung,
        at: new Date(l.at).toISOString(),
      },
      { onConflict: "room,device_id" }
    );
  }
  async listLeads(): Promise<Lead[]> {
    const { data } = await this.sb
      .from("live_leads")
      .select("device_id, name, cell, rung, at")
      .eq("room", ROOM)
      .order("at", { ascending: false });
    return (data ?? []).map((r) => ({
      deviceId: r.device_id,
      name: r.name,
      cell: r.cell,
      rung: r.rung,
      at: new Date(r.at).getTime(),
    }));
  }
  async addToolEvent(e: ToolEvent) {
    await this.sb.from("live_tool_events").insert({
      room: ROOM,
      device_id: e.deviceId,
      tool: e.tool,
      in_tokens: e.inTokens,
      out_tokens: e.outTokens,
      cost_usd: e.costUsd,
      at: new Date(e.at).toISOString(),
    });
  }
  async deviceToolCount(deviceId: string, sinceMs: number) {
    const cutoff = new Date(Date.now() - sinceMs).toISOString();
    const { count } = await this.sb
      .from("live_tool_events")
      .select("*", { count: "exact", head: true })
      .eq("room", ROOM)
      .eq("device_id", deviceId)
      .gte("at", cutoff);
    return count ?? 0;
  }
  async totalSpendUsd() {
    const { data } = await this.sb.from("live_tool_events").select("cost_usd").eq("room", ROOM);
    return (data ?? []).reduce((s, r) => s + Number(r.cost_usd || 0), 0);
  }
  async touchDevice(deviceId: string) {
    await this.sb
      .from("live_presence")
      .upsert({ room: ROOM, device_id: deviceId, at: new Date().toISOString() }, { onConflict: "room,device_id" });
  }
  async activeDevices(withinMs: number) {
    const cutoff = new Date(Date.now() - withinMs).toISOString();
    const { count } = await this.sb
      .from("live_presence")
      .select("*", { count: "exact", head: true })
      .eq("room", ROOM)
      .gte("at", cutoff);
    return count ?? 0;
  }
}

// -------------------------------------------------------------- selector

declare global {
  // eslint-disable-next-line no-var
  var __eaStore: Store | undefined;
}

export function getStore(): Store {
  if (!globalThis.__eaStore) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    globalThis.__eaStore =
      url && key
        ? new SupabaseStore(createClient(url, key, { auth: { persistSession: false } }))
        : new MemoryStore();
  }
  return globalThis.__eaStore;
}
