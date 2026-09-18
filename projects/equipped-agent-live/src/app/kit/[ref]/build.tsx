"use client";

// THE THING THEY BRING TO CLASS.
//
// They book, their own assistant interviews them about one listing, and this
// turns that sheet into a live page with a QR code on it — before Friday,
// from their kitchen table, off the private link we already gave them.
//
// Every claim on this screen is one the server actually performed. The code
// and the live link come back from the database; the alert line says whether
// the address was really stored, not whether they typed one; and if the paste
// did not carry the structure, it says so instead of implying it read
// something it did not. A page that tells somebody their listing assistant is
// live has to be right, because the next thing they do is print the QR.

import { useCallback, useEffect, useState } from "react";

type Mine = { code: string; headline: string; agentName: string; hasEmail: boolean };
type Lead = { code: string; headline: string; name: string; cell: string; question: string; at: number };

const TROUBLE: Record<string, string> = {
  not_yours: "That code was not built on this booking, so it cannot be changed from here.",
  bad_email: "That address does not look right — check it and try again.",
  nothing_to_do: "Nothing was changed. Paste a new sheet, or put an address in.",
  no_booking: "That reference is not on the list. Use the link from your booking — it is the one with your reference in it.",
  too_many: "That booking has already built three. Bring one of those on Friday, or text Mike and he will clear one.",
  need_name: "Your name goes on this — put it in.",
  need_facts:
    "That sheet is too thin to stand on. Run the listing interview with your own assistant first and paste the whole block it gives you — an assistant with nothing on it would have to guess, and yours never will.",
  bad_ref: "That link is missing its reference. Open your kit from the link in your booking.",
  store_error: "That did not save. Nothing was recorded, so try it again.",
};

export function Build({ ref: bookingRef, name }: { ref: string; name: string }) {
  const [mine, setMine] = useState<Mine[] | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  // Fixing one they already built. Everybody gets the sheet wrong once.
  const [fixing, setFixing] = useState<string | null>(null);
  const [fixSheet, setFixSheet] = useState("");
  const [fixEmail, setFixEmail] = useState("");
  const [fixed, setFixed] = useState<string | null>(null);
  const [agentName, setAgentName] = useState(name);
  const [brokerage, setBrokerage] = useState("");
  const [cell, setCell] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [sheet, setSheet] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [made, setMade] = useState<{ code: string; alerts: boolean; structured: boolean } | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/prebuild?ref=${encodeURIComponent(bookingRef)}`, { cache: "no-store" });
      const j = await r.json();
      setMine(r.ok && j?.ok ? (j.mine as Mine[]) : []);
      setLeads(r.ok && j?.ok && Array.isArray(j.leads) ? (j.leads as Lead[]) : []);
    } catch {
      setMine([]);
    }
  }, [bookingRef]);

  useEffect(() => {
    void load();
  }, [load]);

  async function build() {
    if (busy) return;
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/prebuild", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ref: bookingRef, sheet, agentName, brokerage, cell, ownerEmail }),
      });
      const j = await r.json();
      if (r.ok && j?.ok) {
        setMade({ code: j.code, alerts: Boolean(j.alerts), structured: Boolean(j.structured) });
        setSheet("");
        await load();
      } else {
        setErr(TROUBLE[j?.error] ?? TROUBLE.store_error);
      }
    } catch {
      setErr(TROUBLE.store_error);
    } finally {
      setBusy(false);
    }
  }

  async function fix(code: string) {
    if (busy) return;
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/prebuild", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ref: bookingRef, code, sheet: fixSheet, ownerEmail: fixEmail }),
      });
      const j = await r.json();
      if (r.ok && j?.ok) {
        setFixed(code);
        setFixing(null);
        setFixSheet("");
        setFixEmail("");
        await load();
      } else {
        setErr(TROUBLE[j?.error] ?? TROUBLE.store_error);
      }
    } catch {
      setErr(TROUBLE.store_error);
    } finally {
      setBusy(false);
    }
  }

  const live = made ? `/a/${made.code}` : "";

  return (
    <div className="pb">
      {made ? (
        <div className="pb-done">
          <p className="pb-code">{made.code}</p>
          <p className="pb-live">
            It is live now at <a href={live}>{live}</a> &mdash; open it on your phone and ask it something
            about the house.
          </p>
          <img
            className="pb-qr"
            src={`/api/qr?a=${encodeURIComponent(made.code)}`}
            alt={`QR code for your listing assistant, ${made.code}`}
            width={220}
            height={220}
          />
          <p className="pb-note">
            {made.alerts
              ? "Leads will be emailed to the address you gave. Nothing is sent to the buyer on your behalf — you get told, you call them back."
              : "No alert address was saved, so leads will sit on the page until you collect them. Add one on Friday and they start landing in your inbox."}
          </p>
          {!made.structured && (
            <p className="pb-note">
              Your paste did not carry the section headings, so all of it went in as the fact sheet.
              It works — it is just less sorted than it would be. Bring it Friday and we will tidy it.
            </p>
          )}
          <p className="pb-note">
            Print the code, put it on the rider, and bring it on the 2nd. We will point the MLS at it
            and put it in front of the room.
          </p>
        </div>
      ) : (
        <>
          <div className="pb-grid">
            <input
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              placeholder="Your name"
              aria-label="Your name"
              autoComplete="name"
            />
            <input
              value={brokerage}
              onChange={(e) => setBrokerage(e.target.value)}
              placeholder="Brokerage — optional"
              aria-label="Brokerage"
            />
            <input
              value={cell}
              onChange={(e) => setCell(e.target.value)}
              placeholder="Your cell — goes on the page"
              aria-label="Your cell"
              inputMode="tel"
              autoComplete="tel"
            />
            <input
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              placeholder="Where leads get emailed"
              aria-label="Where leads get emailed"
              type="email"
              inputMode="email"
              autoComplete="email"
            />
          </div>
          <textarea
            value={sheet}
            onChange={(e) => setSheet(e.target.value)}
            rows={6}
            placeholder="Paste the whole block your assistant wrote — the one that starts === LISTING ASSISTANT ==="
            aria-label="Paste your listing sheet"
          />
          <button type="button" onClick={build} disabled={busy || sheet.trim().length < 40}>
            {busy ? "Putting it up…" : "Put it live"}
          </button>
          {err && <p className="pb-err">{err}</p>}
        </>
      )}

      {mine && mine.length > 0 && !made && (
        <div className="pb-mine">
          <p className="pb-mine-h">Already built on this booking</p>
          <ul>
            {mine.map((m) => (
              <li key={m.code}>
                <a href={`/a/${m.code}`}>
                  <b>{m.code}</b> {m.headline || "your listing"}
                </a>
                <span>
                  {m.hasEmail ? "leads emailed" : "no alert address yet"}
                  {" · "}
                  <button
                    type="button"
                    className="pb-fixlink"
                    onClick={() => {
                      setFixing(fixing === m.code ? null : m.code);
                      setFixed(null);
                      setErr(null);
                    }}
                  >
                    {fixing === m.code ? "never mind" : "fix it"}
                  </button>
                </span>
                {fixing === m.code && (
                  <div className="pb-fix">
                    <p>
                      Paste a new sheet to replace what it knows, or just put an address in to
                      start getting the leads. <b>The code stays {m.code}</b> &mdash; whatever you
                      already printed keeps working.
                    </p>
                    <textarea
                      value={fixSheet}
                      onChange={(e) => setFixSheet(e.target.value)}
                      rows={4}
                      placeholder="A new === LISTING ASSISTANT === block — or leave this empty"
                      aria-label="Replacement sheet"
                    />
                    <input
                      value={fixEmail}
                      onChange={(e) => setFixEmail(e.target.value)}
                      placeholder="Where leads get emailed"
                      aria-label="Where leads get emailed"
                      type="email"
                      inputMode="email"
                    />
                    <button
                      type="button"
                      onClick={() => fix(m.code)}
                      disabled={busy || (!fixSheet.trim() && !fixEmail.trim())}
                    >
                      {busy ? "Saving…" : "Save it"}
                    </button>
                  </div>
                )}
                {fixed === m.code && <span className="pb-ok">Saved. It is live with that now.</span>}
              </li>
            ))}
          </ul>
          {err && <p className="pb-err">{err}</p>}
        </div>
      )}

      {/* WHO IT CAUGHT. Until the alert email is switched on this is the only
          place these appear, and it stays the list they work from after. */}
      {leads.length > 0 && (
        <div className="pb-leads">
          <p className="pb-mine-h">
            {leads.length === 1 ? "One person" : `${leads.length} people`} your assistant has caught
          </p>
          <ul>
            {leads.map((l, i) => (
              <li key={`${l.code}-${i}`}>
                <p className="pb-lead-who">
                  <b>{l.name}</b> <a href={`tel:${l.cell.replace(/[^\d+]/g, "")}`}>{l.cell}</a>
                </p>
                {l.question && <p className="pb-lead-q">&ldquo;{l.question}&rdquo;</p>}
                <p className="pb-lead-at">
                  {l.headline || l.code} &middot;{" "}
                  {new Date(l.at).toLocaleString(undefined, {
                    weekday: "short", month: "short", day: "numeric",
                    hour: "numeric", minute: "2-digit",
                  })}
                </p>
              </li>
            ))}
          </ul>
          <p className="pb-note">
            Nobody was answered on your behalf beyond what your sheet says. Call them back &mdash;
            that is the whole edge.
          </p>
        </div>
      )}
    </div>
  );
}
