import type { Palette, TemplateId } from "./types";

export interface ThemePreset {
  id: string;
  name: string;
  palette: Palette;
}

export const THEME_PRESETS: Record<TemplateId, ThemePreset[]> = {
  nikah: [
    {
      id: "emerald",
      name: "Emerald & Antique Gold",
      palette: {
        deep: "#03201a",
        base: "#0a3b2c",
        accent: "#c9a24a",
        accentLight: "#f1d892",
        ink: "#f8f1e0",
        secondary: "#0f5038",
      },
    },
    {
      id: "sapphire",
      name: "Royal Sapphire",
      palette: {
        deep: "#060d26",
        base: "#10224f",
        accent: "#c8a352",
        accentLight: "#f3dc9b",
        ink: "#f6f0e2",
        secondary: "#1a336e",
      },
    },
    {
      id: "maroon",
      name: "Mughal Maroon",
      palette: {
        deep: "#25050e",
        base: "#4a0c1d",
        accent: "#d4a25c",
        accentLight: "#f5d29a",
        ink: "#fbefe4",
        secondary: "#64142b",
      },
    },
    {
      id: "plum",
      name: "Midnight Plum",
      palette: {
        deep: "#160923",
        base: "#311547",
        accent: "#cfae6b",
        accentLight: "#f2deb0",
        ink: "#f7efe6",
        secondary: "#47215f",
      },
    },
  ],
  train: [
    {
      id: "sunset",
      name: "Sunset Royale",
      palette: {
        deep: "#160a08",
        base: "#7a2e1a",
        accent: "#c8963e",
        accentLight: "#ffb35c",
        ink: "#fdf3e1",
        secondary: "#5c0f16",
      },
    },
    {
      id: "midnight",
      name: "Midnight Express",
      palette: {
        deep: "#050914",
        base: "#1b2a4a",
        accent: "#c3ccdc",
        accentLight: "#8fb8ff",
        ink: "#eef2fa",
        secondary: "#14254a",
      },
    },
    {
      id: "heritage",
      name: "Heritage Green",
      palette: {
        deep: "#0a120d",
        base: "#55603c",
        accent: "#c9a24a",
        accentLight: "#f2c46b",
        ink: "#f6f1e3",
        secondary: "#123d2b",
      },
    },
  ],
  // v2: flat illustrated templates on light backgrounds (base = page background)
  train2: [
    {
      id: "classic",
      name: "Classic Express",
      palette: { deep: "#2b0f0f", base: "#f6efe3", accent: "#f2c230", accentLight: "#ffb21a", ink: "#3a2a22", secondary: "#c4242f" },
    },
    {
      id: "rajdhani",
      name: "Royal Blue",
      palette: { deep: "#0f1b33", base: "#f3f0e8", accent: "#f2c230", accentLight: "#ffb21a", ink: "#24324a", secondary: "#1f4e9c" },
    },
    {
      id: "heritage",
      name: "Heritage Green",
      palette: { deep: "#13261d", base: "#f4efe2", accent: "#e9b949", accentLight: "#ffb21a", ink: "#2c3a2f", secondary: "#1f6b4a" },
    },
  ],
  nikah2: [
    {
      id: "ivory-emerald",
      name: "Ivory & Emerald",
      palette: { deep: "#123b30", base: "#f6f0e4", accent: "#c99a3d", accentLight: "#e8c77a", ink: "#33291f", secondary: "#1f5c4a" },
    },
    {
      id: "rose",
      name: "Rose Garden",
      palette: { deep: "#4a1426", base: "#f8eee9", accent: "#c9974a", accentLight: "#ecc58a", ink: "#3b2328", secondary: "#8c2f4b" },
    },
    {
      id: "teal",
      name: "Peacock Teal",
      palette: { deep: "#0f3338", base: "#eff3ef", accent: "#c49a45", accentLight: "#e6c27c", ink: "#22343a", secondary: "#1d5f6b" },
    },
  ],
};

export function paletteToCss(p: Palette): React.CSSProperties {
  return {
    ["--c-deep" as string]: p.deep,
    ["--c-base" as string]: p.base,
    ["--c-accent" as string]: p.accent,
    ["--c-accent-light" as string]: p.accentLight,
    ["--c-ink" as string]: p.ink,
    ["--c-secondary" as string]: p.secondary,
  };
}
