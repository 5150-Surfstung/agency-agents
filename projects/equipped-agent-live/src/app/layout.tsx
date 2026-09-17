import type { Metadata, Viewport } from "next";
import { Archivo, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// ONE GROTESQUE AND ONE MONO.
//
// This used to be a warm editorial serif over a friendly sans, which was a
// reasonable look for a printed flyer and the wrong one for this: the whole
// show is a machine drawing wireframes on a projector, and the type was
// apologising for it. Archivo is a variable grotesque with a WIDTH axis, so
// the same family carries a 90px headline pushed wide and heavy AND the body
// copy under it — one voice, enormous contrast, nothing decorative.
//
// JetBrains Mono appears only where the content is genuinely data or a
// readout: slide eyebrows, the standby tagline, small figures. That is the
// "digital" note, and it is deliberately a note — the canvas HUD already
// speaks monospace, so the page and the engine finally agree, and anything
// more than this would read as a hacker poster.
const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-jet",
  display: "swap",
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
    <html lang="en" className={`${archivo.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
