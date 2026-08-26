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

/** The Price Is Right: guesses ride the votes table as whole $thousands. */
export interface PriceDef {
  key: string;
  /** Listing facts shown on screen and phones — only what's defensible. */
  facts: string[];
  minK: number;
  maxK: number;
  stepK: number;
  /** The answer, in $thousands — null until a defensible number is loaded. */
  soldK: number | null;
  /** What that number IS, on the projector. Never label a median "SOLD". */
  soldLabel: string;
  /** The grounded anchor (e.g. the index's trailing-12 median), in $thousands. */
  anchorK: number | null;
  anchorLabel: string;
  /** Where both numbers come from — rendered under the reveal, always. */
  source?: string;
}

export interface Slide {
  id: string;
  kind: "title" | "content" | "demo" | "poll" | "price" | "stump" | "arcade" | "seed" | "leaderboard" | "close";
  eyebrow?: string;
  heading: string;
  lines?: string[];
  stats?: { value: string; label: string }[];
  quote?: string;
  poll?: PollDef;
  price?: PriceDef;
  /** Presenter-only cue line, never rendered to attendees. */
  cue?: string;
}

export interface StumpEntry {
  id: number;
  question: string;
  answer: string;
  refused: boolean;
  at: number;
}

export interface ScoreRow {
  initials: string;
  best: number;
  rounds: number;
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
