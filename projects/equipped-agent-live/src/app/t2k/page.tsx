import type { Metadata } from "next";
import { fromQuery } from "@/lib/t2k";
import { T2kClient } from "./t2k-client";

export const metadata: Metadata = {
  title: "Track to Keys — the deal that keeps its own promises",
  description:
    "Two dates and six terms in; the whole milestone chain out, with what each one actually costs if it slips. Share it with your client as a link.",
};

/** The whole deal rides in the querystring, so a link IS the deal — that is
 *  what makes this demoable from the stage and sendable to a client. */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) if (typeof v === "string") params.set(k, v);
  return <T2kClient initial={fromQuery(params)} />;
}
