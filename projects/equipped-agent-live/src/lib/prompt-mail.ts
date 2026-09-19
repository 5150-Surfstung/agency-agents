// THE EMAIL MIKE FIRES FROM THE STAGE.
//
// It is the keepsake, not the mechanism. By the time it lands the address is
// already on the wall and on every phone in the room, so this one has exactly
// one job: still be findable on Saturday morning when they want to finish the
// thing they started. Short, one button, no explaining.

import { HOST } from "./contact";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://the-equipped-agent.vercel.app";
const GOLD = "#d9ae64";
const CREAM = "#f2efe7";
const SHEET = "#0e1519";
const SOFT = "#b9c2c6";

export const PROMPT_SUBJECT = "Your prompt — build your own Val";

export function promptText(name: string): string {
  const first = name.trim().split(/\s+/)[0] || "there";
  return [
    `${first} — here it is, as promised.`,
    ``,
    `${SITE}/prompt`,
    ``,
    `One button copies the prompt. Paste it into Claude and press enter.`,
    `A free account is fine.`,
    ``,
    `It writes you an HTML file. Save it as my-val.html and double-click it —`,
    `that is your own mark, running on your own machine. Then it asks you`,
    `three questions and turns into your assistant.`,
    ``,
    `Keep this email. The page does not expire and neither does what it builds.`,
    ``,
    `— ${HOST.full}`,
  ].join("\n");
}

export function promptHtml(name: string): string {
  const first = (name.trim().split(/\s+/)[0] || "there").replace(/[&<>"]/g, "");
  return `<div style="margin:0;padding:0;background:${SHEET};background-image:radial-gradient(900px 420px at 78% -8%, rgba(217,174,100,.18), transparent 62%)">
<div style="max-width:560px;margin:0 auto;padding:40px 26px 34px;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif;color:${CREAM}">
  <p style="margin:0 0 18px;font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:${GOLD};font-weight:800">The Equipped Agent</p>
  <h1 style="margin:0 0 12px;font-size:36px;line-height:1.04;font-weight:800;letter-spacing:-.025em;color:${CREAM}">${first}, here it is.</h1>
  <p style="margin:0 0 28px;font-size:17px;line-height:1.55;color:${SOFT}">One button copies the prompt. Paste it into Claude and press enter — a free account is fine.</p>
  <p style="margin:0 0 28px">
    <a href="${SITE}/prompt" style="display:block;text-align:center;background:${GOLD};color:${SHEET};text-decoration:none;font-weight:800;font-size:17px;padding:18px 22px;border-radius:14px">Build my Val</a>
  </p>
  <p style="margin:0 0 10px;font-size:15px;line-height:1.6;color:${SOFT}">It writes you a file. Save it as <b style="color:${CREAM}">my-val.html</b> and double-click it — that is your own mark, running on your own machine. Then it asks you three questions and becomes your assistant.</p>
  <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:${SOFT}">Keep this email. The page does not expire and neither does what it builds.</p>
  <p style="margin:0;padding-top:20px;border-top:1px solid rgba(217,174,100,.22);font-size:15px;font-weight:800;color:${CREAM}">${HOST.full}</p>
</div></div>`;
}
