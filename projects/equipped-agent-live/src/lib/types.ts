// Shared shapes for the room. The deck drives everything: a slide either is a
// poll or it isn't, and the whole attendee experience derives from
// (current slide, poll state, arcade open).

export type PollState = "closed" | "open" | "revealed";

export interface PollDef {
  key: string;
  question: string;
  options: string[];
  /** The ladder poll also captures a lead after the vote. */
  capture?: boolean;
}

export interface Slide {
  id: string;
  kind: "title" | "content" | "demo" | "poll" | "arcade" | "seed" | "close";
  eyebrow?: string;
  heading: string;
  lines?: string[];
  stats?: { value: string; label: string }[];
  quote?: string;
  poll?: PollDef;
  /** Presenter-only cue line, never rendered to attendees. */
  cue?: string;
}

export interface Vote {
  pollKey: string;
  deviceId: string;
  choice: number;
  at: number;
}

export interface Lead {
  deviceId: string;
  name: string;
  cell: string;
  rung: string;
  at: number;
}

export interface ToolEvent {
  deviceId: string;
  tool: "listing" | "sparring" | "mine";
  inTokens: number;
  outTokens: number;
  costUsd: number;
  at: number;
}

export interface RoomState {
  step: number;
  pollState: PollState;
  /** deviceId -> last time we heard from it; presence for the HUD. */
  updatedAt: number;
}

/** An agent's take-home assistant: the profile that generates their pack. */
export interface Pack {
  code: string;
  deviceId: string;
  name: string;
  brokerage: string;
  area: string;
  specialty: string;
  tone: "warm" | "luxury" | "energy";
  createdAt: number;
}
