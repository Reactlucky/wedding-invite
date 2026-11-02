import { Doto, Hind, Outfit, Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"] });
const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });
const doto = Doto({ variable: "--font-led", subsets: ["latin"], weight: ["700", "900"] });
const hind = Hind({ variable: "--font-hind", subsets: ["devanagari", "latin"], weight: ["400", "600"] });

/** v2 templates use their own type pairing; v1 routes don't load these fonts. */
export default function V2Layout({ children }: LayoutProps<"/v2">) {
  return <div className={`${playfair.variable} ${outfit.variable} ${hind.variable} ${doto.variable}`}>{children}</div>;
}
