import { TRAIN2_CUES } from "./cues";
import type { InvitationData, MusicChoice, TemplateId } from "./types";

/** A timed sound placed on a template's opening (replaces the synthesized one when uploaded). */
export interface SoundSlot {
  key: string;
  label: string;
  hint: string;
  /** seconds into the opening */
  at: number;
}

export const SOUND_SLOTS: Partial<Record<TemplateId, SoundSlot[]>> = {
  train2: [
    { key: "chime", label: "Station chime", hint: "Plays before the announcement", at: TRAIN2_CUES.chime },
    { key: "announce", label: "Platform announcement", hint: "Plays after the chime", at: TRAIN2_CUES.announce },
    { key: "horn", label: "Train horn", hint: "Plays as the train comes in", at: TRAIN2_CUES.horn },
  ],
};

export interface ResolvedSounds {
  music: MusicChoice;
  /** uploaded one-shot sounds with their start times */
  samples: { key: string; src: string; at: number }[];
  /** synthesized SFX parts to leave out because an upload replaces them */
  omit: string[];
}

/** Work out what a template should play: per-template music override, uploaded one-shots, and synth parts to skip. */
export function resolveSounds(data: InvitationData, template: TemplateId): ResolvedSounds {
  const own = data.sounds?.[`${template}.music`];
  const music: MusicChoice = own ? { ...data.music, src: own.src, name: own.name } : data.music;
  const samples: ResolvedSounds["samples"] = [];
  const omit: string[] = [];
  for (const slot of SOUND_SLOTS[template] ?? []) {
    const s = data.sounds?.[`${template}.${slot.key}`];
    if (s?.src) {
      samples.push({ key: slot.key, src: s.src, at: slot.at });
      omit.push(slot.key);
    }
  }
  return { music, samples, omit };
}
