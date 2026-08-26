import { notFound } from "next/navigation";
import { isPresenter } from "@/lib/room";
import { PresentClient } from "./present-client";

export const dynamic = "force-dynamic";

export default async function PresentPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  // A wrong key 404s — the presenter URL should look like nothing to a guesser.
  if (!isPresenter(key)) notFound();
  return <PresentClient presenterKey={key} />;
}
