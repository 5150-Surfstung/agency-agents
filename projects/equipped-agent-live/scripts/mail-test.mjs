// DOES THE EMAIL ACTUALLY GO?
//
// Every email path in this app is written to no-op honestly when Resend is
// not configured — the kit link, the lead alert, the selftest's emailOnline
// flag. That is the right behaviour and it is also why a misconfiguration is
// quiet: nothing breaks, nothing sends, and you find out on the day somebody
// was supposed to get a lead.
//
// This sends ONE real email and reports exactly what Resend said, so the
// wiring is proved in two seconds instead of assumed. It reads .env.local,
// which is gitignored, so a key used here can never be committed.
//
//   node scripts/mail-test.mjs you@yourdomain.com
//
// It never prints the key. It prints the first few characters so you can tell
// WHICH key is loaded when you have more than one, and nothing more.

import { readFileSync } from "fs";

/** Minimal .env parser — enough for KEY=value and quoted values, and it does
 *  not overwrite anything already in the real environment. */
function loadEnvLocal() {
  let raw = "";
  try {
    raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  } catch {
    return;
  }
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/i);
    if (!m) continue;
    const key = m[1];
    let val = m[2].trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

loadEnvLocal();

const to = process.argv[2];
const key = process.env.RESEND_API_KEY ?? "";
const from = process.env.RESEND_FROM ?? "";

const mask = (s) => (s.length > 8 ? `${s.slice(0, 6)}…${s.length} chars` : "(too short to be a key)");

console.log("");
console.log("  RESEND_API_KEY :", key ? mask(key) : "MISSING");
console.log("  RESEND_FROM    :", from || "MISSING");
console.log("  sending to     :", to || "MISSING");
console.log("");

if (!to) {
  console.log("  Give it a recipient:  node scripts/mail-test.mjs you@yourdomain.com");
  process.exit(1);
}
if (!key || !from) {
  console.log("  Put both in .env.local next to package.json, then run this again:");
  console.log("");
  console.log("    RESEND_API_KEY=re_your_key_here");
  console.log('    RESEND_FROM=Mike Olson <mike@yourdomain.com>');
  console.log("");
  console.log("  That file is gitignored, so nothing you put in it can be committed.");
  process.exit(1);
}

const res = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    from,
    to,
    subject: "The Equipped Agent — mail wiring test",
    text:
      "If you are reading this, the sender is verified and the key works.\n\n" +
      "That means two things are now live: the kit link that goes out when somebody books, " +
      "and the alert that reaches an agent the moment their listing assistant catches a name " +
      "and a number.\n\nNothing else was sent. This is a wiring test.",
  }),
});

const body = await res.json().catch(() => null);

if (res.ok && body?.id) {
  console.log("  SENT. Resend accepted it, id:", body.id);
  console.log("  Check the inbox — and the spam folder, which is where a brand new sender lands first.");
  console.log("");
  console.log("  Now put the SAME two values in Vercel (Settings, Environment Variables,");
  console.log("  ticked for Production) and redeploy. This test proves the key and the");
  console.log("  sender; only the deployment's own environment makes production send.");
  process.exit(0);
}

// The failures worth naming, because each has a different fix and the raw
// message is not always obvious about which one you hit.
const msg = String(body?.message ?? body?.name ?? `HTTP ${res.status}`);
console.log("  REFUSED:", msg);
console.log("");
if (/domain is not verified|not verified/i.test(msg)) {
  console.log("  The sender domain is not verified in Resend. Either verify it");
  console.log("  (Resend, Domains, Add, then the DNS records), or prove the rest of the");
  console.log("  wiring right now with RESEND_FROM=onboarding@resend.dev and swap it after.");
} else if (res.status === 401 || res.status === 403) {
  console.log("  The key was rejected. Check it was copied whole, and that it has not");
  console.log("  been revoked in Resend.");
} else if (/from/i.test(msg)) {
  console.log("  RESEND_FROM is malformed. Use either mike@yourdomain.com or the");
  console.log('  full form: Mike Olson <mike@yourdomain.com>');
} else if (res.status === 429) {
  console.log("  Rate limited. Wait a moment and run it again.");
}
console.log("");
process.exit(1);
