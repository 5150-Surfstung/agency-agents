"use client";

// THE OTHER SIDE OF THE DESK.
//
// While Val asks a stranger four questions, this shows what the business
// owner sees — the record assembling itself, field by field, as each answer
// lands. It is the whole product argument made without a paragraph: you are
// not filling in a form, you are watching an assistant take an intake and
// write it down, and the thing on the right is what would be waiting for you
// in the morning.
//
// Every row here is REAL. A field appears when its value has actually been
// captured, the status is the true state of the request, and the reference
// and timestamp are the ones the database handed back. Nothing is mocked, no
// row is pre-filled to look busy, and nothing appears before it exists —
// which is the only reason it is worth showing at all.

type Row = { k: string; v: string; hot?: boolean };

export function Console({
  rows,
  status,
  note,
  hit = false,
}: {
  rows: Row[];
  status: "listening" | "writing" | "saved";
  note: string;
  /** True for the moment the big version of the name collapses into here, so
   *  the panel visibly catches it. Presentation only — the row it lands on was
   *  already written from real state before this ever goes true. */
  hit?: boolean;
}) {
  const light =
    status === "saved" ? "Saved" : status === "writing" ? "Writing" : "Listening";

  return (
    <aside className="cons" data-hit={hit ? "yes" : "no"} aria-label="What the business owner sees">
      <div className="cons-bar">
        <span className="cons-who">val · intake</span>
        <span className={`cons-led ${status}`}>{light}</span>
      </div>

      <div className="cons-body">
        {rows.length === 0 ? (
          <p className="cons-idle">
            Waiting. Nothing here until somebody says something.
          </p>
        ) : (
          <dl className="cons-rows">
            {rows.map((r) => (
              <div key={r.k} className={r.hot ? "hot" : undefined}>
                <dt>{r.k}</dt>
                <dd>{r.v}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      <p className="cons-note">{note}</p>
    </aside>
  );
}
