"use client";

// THE SECOND THING THE INVITE HANDS OVER, AND THE ONE THEY KEEP.
//
// Two dates in, every deadline in the deal out, with the day count on each and
// the ones the math thinks are wrong called out. No model, no network, no
// cost: this is pure date arithmetic from lib/t2k, which is why it answers the
// instant they tab out of the second field and why it is safe to put in front
// of a stranger.
//
// It is also the highest-utility thing on the page. An agent with a live file
// will use this tonight, and the share link carries the whole deal in the URL
// so they can send it to their client without an account existing anywhere.
//
// What it is not, said on the page and not only in this comment: the contract
// governs. The value is that the dates get counted and surfaced, not that any
// number here is the law.

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { DEFAULT_DEAL, buildChain, prettyDate, toQuery } from "@/lib/t2k";

/** yyyy-mm-dd, n days from today, at local noon so a timezone can never shift
 *  the date by one. */
function dayFromNow(n: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function Deadlines() {
  // Prefilled, not blank. A deal signed today closing in thirty days is the
  // commonest shape there is, so the chain is already on screen when the page
  // arrives and changing the dates is an edit rather than a chore.
  const [binding, setBinding] = useState(() => dayFromNow(0));
  const [closing, setClosing] = useState(() => dayFromNow(30));
  const [copied, setCopied] = useState(false);

  const deal = useMemo(() => ({ ...DEFAULT_DEAL, binding, closing }), [binding, closing]);
  const chain = useMemo(() => buildChain(deal), [deal]);
  const ready = Boolean(binding && closing && chain.milestones.length);

  // THE HALF NOBODY HANDS AN AGENT.
  //
  // The table above is for them. This is for their client — the same dates,
  // said the way a nervous buyer needs to hear them, ready to paste into a
  // text thread. lib/t2k already carries a client sentence on every
  // milestone, so this costs nothing and cannot drift from the table.
  const forClient = useMemo(() => {
    if (!ready) return "";
    const lines = chain.milestones
      .filter((m) => m.key !== "binding")
      .map((m) => `${prettyDate(m.date)} — ${m.client}`);
    return [
      "Here is our timeline, in plain English:",
      "",
      ...lines,
      "",
      "I am watching all of these. If anything moves, you will hear it from me first.",
    ].join("\n");
  }, [chain.milestones, ready]);

  const copyClient = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(forClient);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }, [forClient]);

  return (
    <div className="chain">
      <h2 className="chain-ask display">Two dates. Every deadline in the deal.</h2>
      <p className="chain-sub">
        This is already running on a deal signed today that closes in thirty
        days. Put in the two real dates off a file you are working right now and
        watch it redraw. Nothing leaves your phone — the whole thing is
        arithmetic.
      </p>

      <div className="chain-in">
        <label>
          <span>Binding agreement</span>
          <input type="date" value={binding} onChange={(e) => setBinding(e.target.value)} />
        </label>
        <label>
          <span>Closing</span>
          <input type="date" value={closing} onChange={(e) => setClosing(e.target.value)} />
        </label>
      </div>

      {ready ? (
        <>
          <table className="chain-table">
            <caption>
              {chain.span} days from binding to keys, on common term lengths — your
              contract sets the real ones.
            </caption>
            <tbody>
              {chain.milestones.map((m) => (
                <tr key={m.key} data-urgency={m.urgency}>
                  <th scope="row">{m.label}</th>
                  <td className="chain-date">{prettyDate(m.date)}</td>
                  <td className="chain-days">
                    {m.daysOut === 0
                      ? "today"
                      : m.daysOut > 0
                        ? `${m.daysOut}d`
                        : `${Math.abs(m.daysOut)}d ago`}
                  </td>
                  <td className="chain-stake">{m.stake}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {chain.problems.length > 0 && (
            <ul className="chain-problems">
              {chain.problems.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          )}

          <div className="client-out">
            <h3 className="display">Now the part your client gets.</h3>
            <p>
              Same dates, said the way somebody who has never bought a house
              needs to hear them. Paste it into the text thread and you have
              just done the thing most agents apologise for not doing.
            </p>
            <pre className="client-text">{forClient}</pre>
            <button type="button" onClick={copyClient} className="client-copy">
              {copied ? "Copied" : "Copy the client message"}
            </button>
          </div>

          <p className="chain-foot">
            <Link href={`/t2k?${toQuery(deal)}`} className="chain-link">
              Open the full version
            </Link>
            — it takes your actual term lengths, says what each date costs if it
            slips, and the link you land on is the deal, so you can send it to your
            client as-is.
          </p>
        </>
      ) : (
        <p className="chain-empty">
          Fill both dates and the chain builds itself. It counts forward from
          binding and backward from closing, the way the contract does.
        </p>
      )}
    </div>
  );
}
