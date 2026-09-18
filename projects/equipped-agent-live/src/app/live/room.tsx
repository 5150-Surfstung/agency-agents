"use client";

// WHO IS IN THE ROOM.
//
// The strongest reason a working agent gives up a Friday hour is not the
// content — content is free and infinite — it is the other people. This is
// the only part of the page that shows them.
//
// Everything here is consented and minimal: a first name and a brokerage,
// from people who tapped yes AFTER their seat was already booked. No full
// names, no numbers, nobody who did not ask to be here.
//
// Like the seat count, it stays silent under a floor. Three names reads as a
// room filling up; one name reads as nobody came, and a wall of one is worse
// than no wall.

import { useEffect, useState } from "react";

type Row = { who: string; brokerage: string; bringing: boolean };
const FLOOR = 3;

export function Room() {
  const [wall, setWall] = useState<Row[] | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/room")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (alive && j?.ok && Array.isArray(j.wall)) setWall(j.wall);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const showing = wall && wall.length >= FLOOR ? wall : null;
  const builders = showing ? showing.filter((r) => r.bringing).length : 0;

  return (
    <section className="room">
      <h2 className="display">The people are the point.</h2>
      <p>
        This is not a webinar you half-watch with the sound off. It is a room
        of agents who are already building things, in an office, with the
        coffee on — and the reason to give up the hour is the other people in
        it. You will see what someone else wired up last month, and somebody
        will ask you how you did yours.
      </p>

      {/* The line that actually gets people through the door, because the
          real reason they stay home is not the date — it is not knowing
          whether they will be the only one who does not get it. */}
      <p className="room-risk">
        And so nobody has to wonder: <b>half this room has never used any of
        this.</b> The other half will show you something. Nobody is going to
        ask you a question you cannot answer, and there is no level you are
        supposed to be at already. Come be the person who asks.
      </p>

      {showing && (
        <>
          <p className="room-tag">Already coming</p>
          <ul className="room-wall">
            {showing.map((r, i) => (
              <li key={`${r.who}-${i}`}>
                <b>{r.who}</b>
                {r.brokerage && <span>{r.brokerage}</span>}
                {r.bringing && <em>bringing a build</em>}
              </li>
            ))}
          </ul>
          {builders > 0 && (
            <p className="room-builders">
              {builders} of them {builders === 1 ? "is" : "are"} bringing
              something they made to put on the screen.
            </p>
          )}
          <p className="room-fine">
            Only people who asked to be listed are here, first name and
            brokerage only.
          </p>
        </>
      )}
    </section>
  );
}
