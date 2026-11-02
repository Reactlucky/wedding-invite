import { THEME_PRESETS } from "./themes";
import { TEMPLATES, type InvitationData } from "./types";

export const DEFAULT_INVITATION: InvitationData = {
  bride: "Ayesha",
  groom: "Zayan",
  nameOrder: "bride-first",
  brideFamily: "Daughter of Mr. & Mrs. Imran Siddiqui",
  groomFamily: "Son of Mr. & Mrs. Faraz Rahman",
  date: "2027-02-14T17:00",
  venue: "The Grand Pearl Palace",
  address: "Banjara Hills, Hyderabad, Telangana, India",
  city: "Hyderabad",
  message:
    "With the blessings of Allah and the love of our families, we joyfully invite you to celebrate the beginning of our forever.",
  story:
    "We met over a borrowed umbrella on a rainy evening in Hyderabad. Years of chai, long walks and longer conversations later, two families became one, and the journey to forever begins here.",
  hashtag: "#ZayanWedsAyesha",
  rsvpBy: "2027-01-20",
  events: [
    {
      id: "mehndi",
      title: "Mehndi Night",
      date: "2027-02-12",
      time: "19:00",
      venue: "Siddiqui Residence Gardens",
      address: "Jubilee Hills, Hyderabad",
      note: "Dress code: shades of green & yellow",
    },
    {
      id: "nikah",
      title: "Nikah Ceremony",
      date: "2027-02-14",
      time: "17:00",
      venue: "The Grand Pearl Palace",
      address: "Banjara Hills, Hyderabad, Telangana, India",
      note: "Followed by Maghrib prayer",
    },
    {
      id: "walima",
      title: "Walima Reception",
      date: "2027-02-15",
      time: "20:00",
      venue: "Falaknuma Courtyard",
      address: "Falaknuma, Hyderabad",
      note: "Formal attire",
    },
  ],
  photos: [],
  music: { src: null, volume: 0.7 },
  sounds: {},
  theme: {
    nikah: { preset: "emerald", palette: THEME_PRESETS.nikah[0].palette },
    train: { preset: "sunset", palette: THEME_PRESETS.train[0].palette },
    nikah2: { preset: "ivory-emerald", palette: THEME_PRESETS.nikah2[0].palette },
    train2: { preset: "classic", palette: THEME_PRESETS.train2[0].palette },
  },
  updatedAt: 0,
};

/** Merge stored (possibly older-shaped) data over defaults so new fields always exist. */
export function normalizeInvitation(input: Partial<InvitationData> | null | undefined): InvitationData {
  const d = DEFAULT_INVITATION;
  if (!input) return structuredClone(d);
  return {
    ...d,
    ...input,
    events: Array.isArray(input.events) ? input.events : d.events,
    photos: Array.isArray(input.photos) ? input.photos : d.photos,
    music: { ...d.music, ...(input.music ?? {}) },
    sounds: input.sounds && typeof input.sounds === "object" ? input.sounds : {},
    theme: Object.fromEntries(
      TEMPLATES.map((t) => [t, { ...d.theme[t], ...(input.theme?.[t] ?? {}) }]),
    ) as InvitationData["theme"],
  };
}

export function orderedNames(data: InvitationData): [string, string] {
  return data.nameOrder === "groom-first" ? [data.groom, data.bride] : [data.bride, data.groom];
}
