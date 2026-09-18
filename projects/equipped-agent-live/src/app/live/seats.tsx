"use client";

// REAL SOCIAL PROOF, OR NONE.
//
// This draws the number of people who have actually reserved a seat. It is a
// count of rows in a table — it cannot be flattering and wrong, and nothing
// is seeded, padded or rounded up.
//
// The one deliberate rule: below a floor it renders nothing at all. "2 people
// have booked" is a weaker signal than silence, and a marketing page that
// announces 2 is telling on itself. This is not the page lying — it is the
// page declining to make a weak claim. Above the floor the figure is exact.

import { useEffect, useState } from "react";

const FLOOR = 5;

export function Seats() {
  const [booked, setBooked] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/seats")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (alive && j?.ok && typeof j.booked === "number") setBooked(j.booked);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (booked === null || booked < FLOOR) return null;

  return (
    <p className="seats">
      <b>{booked}</b> {booked === 1 ? "agent has" : "agents have"} booked a seat
      so far. The room is our office, not a ballroom.
    </p>
  );
}
