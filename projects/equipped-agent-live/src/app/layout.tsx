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
  title: "The Equipped Agent — Live",
  description:
    "The live room for The Equipped Agent: one hour, live polls, and AI tools you build on the spot. The AGENT Connection × Surfstung Systems.",
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
