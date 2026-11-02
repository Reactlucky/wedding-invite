export type TemplateId = "nikah" | "train" | "nikah2" | "train2";

export const TEMPLATES: TemplateId[] = ["nikah", "train", "nikah2", "train2"];

/** Public route + label for each template (v1 routes are unchanged). */
export const TEMPLATE_INFO: Record<TemplateId, { route: string; label: string }> = {
  nikah: { route: "/nikah", label: "Nikah" },
  train: { route: "/train", label: "Train" },
  nikah2: { route: "/v2/nikah", label: "Nikah v2" },
  train2: { route: "/v2/train", label: "Train v2" },
};

export interface Palette {
  /** darkest background / shadows */
  deep: string;
  /** main background tone */
  base: string;
  /** metallic accent (gold / brass / silver) */
  accent: string;
  /** highlight of the accent, glows, sunset light */
  accentLight: string;
  /** body text colour (ivory / cream) */
  ink: string;
  /** secondary surface colour (door wood, train livery) */
  secondary: string;
}

export interface ThemeChoice {
  preset: string;
  palette: Palette;
}

export interface EventItem {
  id: string;
  title: string;
  /** YYYY-MM-DD */
  date: string;
  /** HH:mm (24h) */
  time: string;
  venue: string;
  address: string;
  note?: string;
}

export interface Photo {
  id: string;
  src: string;
  caption?: string;
  width?: number;
  height?: number;
}

export interface MusicChoice {
  /** null → use the template's original generative score */
  src: string | null;
  name?: string;
  volume: number;
}

/** An uploaded audio file placed in a template's sound slot. */
export interface SoundChoice {
  src: string;
  name?: string;
}

export interface InvitationData {
  bride: string;
  groom: string;
  nameOrder: "bride-first" | "groom-first";
  brideFamily: string;
  groomFamily: string;
  /** Main ceremony date & time, local: YYYY-MM-DDTHH:mm */
  date: string;
  venue: string;
  address: string;
  city: string;
  message: string;
  /** "How we met" story (v2 templates) */
  story: string;
  hashtag: string;
  rsvpBy: string;
  events: EventItem[];
  photos: Photo[];
  music: MusicChoice;
  /** Per-template sound overrides keyed "<template>.<slot>", e.g. "train2.horn" or "nikah2.music". */
  sounds: Record<string, SoundChoice>;
  theme: Record<TemplateId, ThemeChoice>;
  updatedAt: number;
}

export interface Rsvp {
  id: string;
  name: string;
  phone?: string;
  attending: "yes" | "no" | "maybe";
  guests: number;
  events: string[];
  message?: string;
  createdAt: number;
}
