import { THEME_PRESETS } from "./themes";
import { TEMPLATES, type InvitationData } from "./types";

export const DEFAULT_INVITATION: InvitationData = {
  bride: "Sana",
  groom: "Tofik",
  nameOrder: "groom-first",
  brideFamily: "",
  groomFamily: "",
  date: "2027-01-07T21:00",
  venue: "Sahil Park",
  address: "Viramgam",
  city: "Viramgam",
  message: "With the blessings of our families, we invite you to celebrate the wedding of Tofik and Sana.",
  story: "The celebrations are in Viramgam, with the nikaah at Bundi Jn. and the reception at Sahil Park.",
  hashtag: "#TofikWedsSana",
  rsvpBy: "2027-01-10",
  events: [
    {
      id: "baraat",
      title: "Baraat",
      date: "2027-01-07",
      time: "21:00",
      venue: "Viramgam",
      address: "Viramgam",
    },
    {
      id: "nikaah",
      title: "Nikaah",
      date: "2027-01-08",
      time: "21:00",
      venue: "Bundi Jn.",
      address: "Bundi Jn.",
    },
    {
      id: "pithi",
      title: "Pithi, Bhaat, Ratijagah",
      date: "2027-01-09",
      time: "14:00",
      venue: "The residence",
      address: "",
      note: "From 2 PM",
    },
    {
      id: "reception",
      title: "Reception",
      date: "2027-01-11",
      time: "",
      venue: "Sahil Park",
      address: "Viramgam",
      note: "Main reception",
    },
  ],
  photos: [],
  music: { src: null, volume: 0.7 },
  sounds: {
    "train2.announce": { src: "/announcement.mp3", name: "Announcement" },
  },
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
