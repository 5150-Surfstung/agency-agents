import { notFound } from "next/navigation";
import { getStore } from "@/lib/store";
import { PresentClient } from "./present-client";

export const dynamic = "force-dynamic";

export default async function PresentPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  // A wrong key 404s — the presenter URL should look like nothing to a guesser.
  let role = null;
  try {
    role = await getStore().checkKey(key);
  } catch {
    notFound();
  }
  if (role !== "presenter") notFound();
  return <PresentClient presenterKey={key} />;
}
