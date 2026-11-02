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



/* ------------------------------------------------------------------ v2 */

export const TRAIN2_CUES = {
  chime: 0.3,
  announce: 0.5,
  enter: 1.2,
  horn: 1.5,
  stop: 9.6,
  doorOpen: 10.0,
  flood: 10.5,
  hero: 11.4,
  sign: 11.7,
  date: 12.8,
  duration: 15,
} as const;

export const NIKAH2_CUES = {
  chime: 0.2,
  title: 0.5,
  pan: 1.2,
  panEnd: 8.6,
  doorsOpen: 9.0,
  flood: 9.8,
  hero: 10.6,
  plaque: 10.9,
  date: 12.0,
  duration: 14,
} as const;

export const OPENING_DURATION = {
  nikah: NIKAH_CUES.duration,
  train: TRAIN_CUES.duration,
  nikah2: NIKAH2_CUES.duration,
  train2: TRAIN2_CUES.duration,
} as const;
