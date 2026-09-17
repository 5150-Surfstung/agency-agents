import type { Metadata } from "next";
import { SocialClient } from "./social-client";

export const metadata: Metadata = {
  title: "The Content Machine — one listing, a week of posts",
  description:
    "Paste a listing, pick a platform and an angle, and watch real content come out — grounded in your facts, fair-housing clean, with the hook doing the work.",
};

export default function Social() {
  return <SocialClient />;
}
