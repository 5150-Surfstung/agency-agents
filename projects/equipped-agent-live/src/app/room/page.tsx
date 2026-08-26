import { redirect } from "next/navigation";
import { sessionFromCookies } from "@/lib/room";
import { RoomClient } from "./room-client";

export const dynamic = "force-dynamic";

export default async function RoomPage() {
  const sess = await sessionFromCookies();
  if (!sess) redirect("/");
  return <RoomClient />;
}
