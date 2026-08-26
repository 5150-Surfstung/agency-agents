import { redirect } from "next/navigation";
import { deviceFromCookies } from "@/lib/room";
import { RoomClient } from "./room-client";

export const dynamic = "force-dynamic";

export default async function RoomPage() {
  const deviceId = await deviceFromCookies();
  if (!deviceId) redirect("/");
  return <RoomClient />;
}
