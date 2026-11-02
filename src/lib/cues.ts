/**
 * Cue sheet for each opening sequence (seconds).
 * The GSAP master timelines are built from these numbers and the generative
 * score places its sound effects on the same marks, so picture and sound stay
 * in sync both in the browser and in the exported MP4.
 */
export const NIKAH_CUES = {
  skyIn: 0.2,
  archDraw: 0.8,
  lanterns: 1.6,
  calligraphy: 2.8,
  pushIn: 3.6,
  doorsOpen: 5.0,
  doorsOpenEnd: 6.7,
  flythrough: 6.4,
  flash: 7.6,
  names: 8.0,
  date: 10.6,
  duration: 13.5,
} as const;

export const TRAIN_CUES = {
  fadeIn: 0,
  title: 0.6,
  approachStart: 1.4,
  whistle: 3.4,
  approachEnd: 8.2,
  steamEngulf: 7.7,
  board: 8.6,
  flaps: 8.75,
  dateReveal: 10.9,
  ticket: 12.4,
  duration: 14.5,
} as const;

export const OPENING_DURATION = {
  nikah: NIKAH_CUES.duration,
  train: TRAIN_CUES.duration,
} as const;
