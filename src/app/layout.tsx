import type { Metadata, Viewport } from "next";
import { Amiri, Cinzel, Cormorant_Garamond, Great_Vibes, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const cinzel = Cinzel({ variable: "--font-cinzel", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
});
const vibes = Great_Vibes({ variable: "--font-vibes", subsets: ["latin"], weight: "400" });
const amiri = Amiri({ variable: "--font-amiri", subsets: ["arabic", "latin"], weight: ["400", "700"] });
const plexMono = IBM_Plex_Mono({ variable: "--font-mono", subsets: ["latin"], weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  title: "Ever After Studio — Cinematic Wedding Invitations",
  description: "Cinematic digital wedding invitations with animated openings, RSVP, maps and gallery.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#050505",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${cinzel.variable} ${cormorant.variable} ${vibes.variable} ${amiri.variable} ${plexMono.variable} antialiased`}
    >
      <body>{children}</body>
    </html>
  );
}
