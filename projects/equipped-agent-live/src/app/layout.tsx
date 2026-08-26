import type { Metadata, Viewport } from "next";
import { Figtree, Fraunces } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-fraunces",
});

const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "800"],
  variable: "--font-figtree",
});

export const metadata: Metadata = {
  title: "The Equipped Agent — The Claude Course",
  description:
    "The Claude Course, live: polls, games, and an AI assistant you build on your own account. Sponsored by Mike Olson with The Agent Connection. Mike Olson, REALTOR® · eXp Realty.",
  robots: { index: false },
};

export const viewport: Viewport = {
  themeColor: "#071320",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${figtree.variable}`}>
      <body>{children}</body>
    </html>
  );
}
