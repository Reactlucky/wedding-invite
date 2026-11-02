import { renderBed, renderSfx } from "./score";
import type { TemplateId } from "../types";

self.onmessage = (e: MessageEvent<{ template: TemplateId; omit?: string[] }>) => {
  const { template, omit = [] } = e.data;
  const bed = renderBed(template);
  const sfx = renderSfx(template, omit);
  const payload = {
    sampleRate: bed.sampleRate,
    bed: [bed.left.slice(), bed.right.slice()],
    sfx: [sfx.left.slice(), sfx.right.slice()],
  };
  (self as unknown as Worker).postMessage(payload, [
    payload.bed[0].buffer,
    payload.bed[1].buffer,
    payload.sfx[0].buffer,
    payload.sfx[1].buffer,
  ]);
};
