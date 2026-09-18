// READING BACK WHAT THEIR OWN VAL WROTE.
//
// The agent's assistant interviews them about one listing and hands them a
// block. This turns that block into the fields the setup needs, so the room
// step is "paste this" instead of five text boxes filled in under time
// pressure by somebody who would rather be talking.
//
// TOLERANT ON PURPOSE. The block comes out of a language model, so the shape
// is a strong convention and not a guarantee: the dashes drift, a heading
// gets bolded, the fences come along for the ride. Every one of those should
// still produce a working assistant. And the last resort is never an error —
// a paste we cannot parse becomes the fact sheet verbatim, because the worst
// honest outcome is an assistant with an unstructured sheet, and the worst
// dishonest one is telling somebody their twenty minutes produced nothing.

export type Sheet = {
  headline: string;
  voice: "warm" | "luxury" | "energy";
  facts: string;
  notes: string;
  /** False when nothing recognisable was found and the whole paste was taken
   *  as the fact sheet. The page says so rather than quietly pretending it
   *  understood the structure. */
  structured: boolean;
};

const VOICES = new Set(["warm", "luxury", "energy"]);

/** Strips a markdown fence if the model wrapped the block in one, which it
 *  usually does, and which is not part of what they meant to paste. */
function unfence(raw: string): string {
  const t = raw.trim();
  const fenced = t.match(/^```[a-z]*\s*\n([\s\S]*?)\n?```$/i);
  return (fenced ? fenced[1] : t).trim();
}

/** Finds a section heading however it was punctuated. The decoration around
 *  it is not stable and never was: hyphens become em-dashes, the heading gets
 *  bolded, the case changes, a stray colon appears. A test caught this the
 *  first time it ran — "**— Fact Sheet —**" matched nothing, and the price,
 *  the beds and the HOA were dropped without a word. So the decoration is
 *  stripped from both ends and only the words are matched. */
const TRIM = /^[\s\-\u2010-\u2015=#*_`:.]+|[\s\-\u2010-\u2015=#*_`:.]+$/g;

function sectionAt(lines: string[], label: RegExp): number {
  return lines.findIndex((l) => label.test(l.replace(TRIM, "")));
}

export function parseSheet(raw: string): Sheet {
  const body = unfence(raw)
    // Drop the outer banner lines; they carry no content.
    .replace(/^===\s*LISTING ASSISTANT\s*===\s*$/gim, "")
    .replace(/^===\s*END\s*===\s*$/gim, "")
    .trim();

  const lines = body.split(/\r?\n/);

  const headline = (body.match(/^\s*(?:ADDRESS|HEADLINE)\s*:\s*(.+)$/im)?.[1] ?? "")
    .replace(/[*_`]/g, "")
    .trim()
    .slice(0, 80);

  const voiceRaw = (body.match(/^\s*VOICE\s*:\s*(.+)$/im)?.[1] ?? "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
  const voice = (VOICES.has(voiceRaw) ? voiceRaw : "warm") as Sheet["voice"];

  const factsAt = sectionAt(lines, /^FACT SHEET$/i);
  const notesAt = sectionAt(lines, /^WHAT (TO )?SAY FREELY$/i);

  const clean = (from: number, to: number) =>
    lines
      .slice(from + 1, to === -1 ? lines.length : to)
      .join("\n")
      .replace(/^===\s*END\s*===\s*$/gim, "")
      .trim();

  if (factsAt === -1 && notesAt === -1) {
    // Nothing recognisable. Their work is not thrown away — it becomes the
    // sheet as written, and the caller is told the structure was not found.
    return {
      headline,
      voice,
      facts: body.slice(0, 4000),
      notes: "",
      structured: false,
    };
  }

  const facts =
    factsAt === -1
      ? ""
      : clean(factsAt, notesAt > factsAt ? notesAt : -1).slice(0, 4000);
  const notes =
    notesAt === -1
      ? ""
      : clean(notesAt, factsAt > notesAt ? factsAt : -1).slice(0, 4000);

  return { headline, voice, facts, notes, structured: true };
}
