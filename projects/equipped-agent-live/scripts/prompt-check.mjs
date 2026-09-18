// THE PROMPTS ARE THE PRODUCT, SO THEY GET A TEST.
//
// Three of these go out to strangers who will paste them into Claude with no
// one watching: the audit that builds an agent their own Val, the orb build
// brief, and the ready-made skill. If one of them is subtly wrong, the person
// gets garbage and the invitation is worse than if we had offered nothing.
//
// These assertions encode the defects actually found while building them —
// each one is a bug that existed, not a hypothetical:
//  · the skill template used angle-bracket placeholders in a file whose own
//    rules forbid angle brackets, so a model would emit an invalid skill;
//  · the orb brief told the reader to draw the sphere's nearest-neighbour
//    links during a shape, which turns a house into a ball of spaghetti;
//  · neither told the model to check its own output before handing it over,
//    and the orb one never forbade abbreviating the file.
//
// Run: node scripts/prompt-check.mjs

import { readFileSync } from "node:fs";

const src = readFileSync(new URL("../src/lib/prompts.ts", import.meta.url), "utf8");
const skill = readFileSync(new URL("../src/lib/val-skill.ts", import.meta.url), "utf8");

// Take the RETURNED template literal, not the first one in the function.
// starterPrompt builds an `intro` template above its return, and grabbing the
// first backtick silently tested that 251-character string instead of the
// 12,000-character prompt — every assertion below would have been measuring
// the wrong text.
function body(fn) {
  const i = src.indexOf(`export function ${fn}`);
  if (i < 0) throw new Error(`${fn} is gone from prompts.ts`);
  const r = src.indexOf("return `", i);
  if (r < 0) throw new Error(`${fn} has no returned template literal`);
  const s = r + "return `".length;
  const e = src.indexOf("`;", s);
  const t = src.slice(s, e);
  if (t.length < 1000) throw new Error(`${fn} extracted only ${t.length} chars — the extractor is wrong, not the prompt`);
  return t;
}

const audit = body("starterPrompt");
const orb = body("orbPrompt");

const checks = [
  // --- both ---
  ["audit: no angle-bracket placeholders", !/<[^>\n]{3,400}>/.test(audit)],
  ["orb: no angle-bracket placeholders", !/<[^>\n]{3,400}>/.test(orb)],
  ["audit: checks its own output first", /check your own output/i.test(audit)],
  ["orb: checks its own work first", /check your own work/i.test(orb)],

  // --- the audit ---
  ["audit: one question per message", /ONE question per message/.test(audit)],
  ["audit: refuses to invent a figure", /Do not invent a figure/i.test(audit)],
  ["audit: states the name slug rule", /lowercase letters, numbers and hyphens/i.test(audit)],
  ["audit: states the reserved words", /must NOT contain the words/i.test(audit)],
  ["audit: states the 1024 limit", /1024 characters or fewer/.test(audit)],
  ["audit: carries fair housing into the skill", /Fair housing is absolute/i.test(audit)],
  ["audit: carries never-rule-on-the-contract", /Never rule on the contract/i.test(audit)],
  ["audit: carries never-invent-a-fact", /Never invent a fact\./i.test(audit)],
  ["audit: carries never-promise-an-outcome", /Never promise an outcome/i.test(audit)],
  ["audit: carries no-regulated-advice", /regulated advice/i.test(audit)],
  // It goes on a personal feed, so most readers are not agents.
  ["audit: asks the trade before assuming one", /PHASE 0 — WHO AM I/.test(audit)],
  ["audit: names non-real-estate trades", /lender, a contractor/i.test(audit)],
  ["audit: keeps fair housing conditional on real estate", /If I am in real estate/.test(audit)],
  ["audit: says the skill is theirs, in their account", /lives in MY account/.test(audit)],
  ["audit: carries the mark method", /Building my mark/.test(audit)],
  ["audit: carries never-claim-an-action", /Never claim an action was taken/i.test(audit)],
  ["audit: says a paid plan is needed to install", /paid plan/i.test(audit)],

  // --- the orb ---
  ["orb: the group rule is stated", /group rule/i.test(orb)],
  ["orb: warns about the spaghetti failure", /spaghetti/i.test(orb)],
  ["orb: cross-fades sphere and shape links", /1 - morph/.test(orb)],
  ["orb: forbids abbreviating the file", /never abbreviate/i.test(orb)],
  ["orb: asks for one self-contained file", /no libraries/i.test(orb)],
  ["orb: handles device pixel ratio", /devicePixelRatio/.test(orb)],
  ["orb: respects reduced motion", /prefers-reduced-motion/.test(orb)],
  ["orb: pauses when hidden", /document\.hidden/.test(orb)],
  ["orb: has the swagger layer", /HUD ring/.test(orb)],
  ["orb: keeps the mark the loud thing", /overdone is worse than plain/i.test(orb)],

  // --- the ready-made skill must satisfy the same spec it teaches ---
  ["skill: name is a valid slug", /VAL_SKILL_NAME = "[a-z0-9-]{1,64}"/.test(skill)],
  ["skill: name avoids the reserved words",
    !/VAL_SKILL_NAME = "[^"]*(claude|anthropic)/i.test(skill)],
];

let bad = 0;
for (const [name, ok] of checks) {
  if (!ok) bad++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
}

// The description in the shipped skill is bounded by the spec, so measure it.
const desc = /const DESCRIPTION =\s*"((?:[^"\\]|\\.)*)"/s.exec(skill)?.[1] ?? "";
const descOk = desc.length > 0 && desc.length <= 1024 && !/[<>]/.test(desc);
if (!descOk) bad++;
console.log(`${descOk ? "PASS" : "FAIL"}  skill: description is ${desc.length}/1024 chars, no angle brackets`);

console.log(bad ? `\n${bad} FAILING — do not ship` : `\nall ${checks.length + 1} prompt checks pass`);
process.exit(bad ? 1 : 0);
