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
    { key: "horn", label: "Train horn", hint: "First, as the train comes in", at: TRAIN2_CUES.horn },
    { key: "chime", label: "Station chime", hint: "After the horn", at: TRAIN2_CUES.chime },
    { key: "announce", label: "Platform announcement", hint: "After the chime", at: TRAIN2_CUES.announce },
  ],
};

/** Templates with no background music/ambience unless that template gets its own music upload. */
const NO_BACKGROUND: TemplateId[] = ["train2"];

export interface ResolvedSounds {
  music: MusicChoice;
  /** uploaded one-shot sounds with their start times */
  samples: { key: string; src: string; at: number }[];
  /** synthesized SFX parts to leave out because an upload replaces them */
  omit: string[];
  /** play the generated looping score when no music is uploaded */
  bed: boolean;
}

/** Work out what a template should play: per-template music override, uploaded one-shots, and synth parts to skip. */
export function resolveSounds(data: InvitationData, template: TemplateId): ResolvedSounds {
  const own = data.sounds?.[`${template}.music`];
  const quiet = NO_BACKGROUND.includes(template);
  const music: MusicChoice = own ? { ...data.music, src: own.src, name: own.name } : quiet ? { ...data.music, src: null } : data.music;
  const samples: ResolvedSounds["samples"] = [];
  const omit: string[] = [];
  for (const slot of SOUND_SLOTS[template] ?? []) {
    const s = data.sounds?.[`${template}.${slot.key}`];
    if (s?.src) {
      samples.push({ key: slot.key, src: s.src, at: slot.at });
      omit.push(slot.key);
    }
  }
  return { music, samples, omit, bed: !quiet };
}
