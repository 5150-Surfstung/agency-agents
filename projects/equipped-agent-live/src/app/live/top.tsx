"use client";

// The top of the invite, held together as one piece because the orb and the
// desk share a nerve: what the desk is doing is what the orb is doing. While
// nobody is typing, the orb runs its own reel — winding up to a blur and
// braking to land a line about what this hour actually teaches. The moment a
// client's message goes into the desk, the reel stands down and the orb is
// listening, thinking and answering for real.
//
// The stamped header between them is passed in from the server page so the
// headline, the date and the address are in the HTML a crawler and a share
// card preview actually read.

import { useState } from "react";
import { Desk } from "./desk";
import { ValReel, type Mode } from "./val-reel";
import { LEARNS } from "./learns";

/** `head` is the name of the thing and one sentence about it; `details` is the
 *  byline and the stamp. They sit either side of the desk on purpose: a
 *  stranger has to know what they are looking at, then be paid for looking,
 *  and only then be told where to park. */
export function Top({ head, details }: { head: React.ReactNode; details: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>(null);
  return (
    <>
      <ValReel facts={LEARNS} mode={mode} busy={mode !== null} />
      {head}
      <Desk onMode={setMode} />
      {details}
    </>
  );
}
