import { Doto, Hind, Outfit, Playfair_Display } from "next/font/google";
import type { ReactNode } from "react";

const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"] });
const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });
const doto = Doto({ variable: "--font-led", subsets: ["latin"], weight: ["700", "900"] });
const hind = Hind({ variable: "--font-hind", subsets: ["devanagari", "latin"], weight: ["400", "600"] });

/** Type pairing for the Wedding Express. v1 routes do not load these fonts. */
export function V2Fonts({ children }: { children: ReactNode }) {
  return <div className={`${playfair.variable} ${outfit.variable} ${hind.variable} ${doto.variable}`}>{children}</div>;
}
