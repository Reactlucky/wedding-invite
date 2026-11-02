/* Split-flap departure board text. Characters are written imperatively from
 * the opening's render(t) so the flipping is deterministic per frame. */

export const FLAP_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789&·";

export function hash(i: number) {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export function FlapRow({ text, className = "" }: { text: string; className?: string }) {
  return (
    <div className={`flex gap-[3px] ${className}`} aria-label={text}>
      {Array.from(text).map((c, i) => (
        <span
          key={i}
          data-final={c}
          className="t-flap relative grid place-items-center overflow-hidden rounded-[3px] bg-[#16130f] font-mono font-semibold text-[#ffd98f] shadow-[inset_0_1px_0_rgba(255,255,255,.06),0_2px_3px_rgba(0,0,0,.6)]"
          style={{ width: "var(--cell)", height: "calc(var(--cell) * 1.38)", fontSize: "calc(var(--cell) * 0.82)" }}
          aria-hidden
        >
          <span className="t-flap-ch relative z-0 leading-none">{c === " " ? " " : c}</span>
          <span className="absolute inset-x-0 top-1/2 z-10 h-px bg-black/80" />
          <span className="t-flap-leaf absolute inset-x-0 top-0 z-20 h-1/2 origin-bottom bg-[#211c16]" style={{ transform: "scaleY(0)" }} />
        </span>
      ))}
    </div>
  );
}

/** Update every flap cell inside `root` for timeline time t. */
export function renderFlaps(root: HTMLElement, t: number, start: number) {
  const cells = root.querySelectorAll<HTMLElement>(".t-flap");
  cells.forEach((cell, i) => {
    const final = cell.dataset.final ?? " ";
    const ch = cell.firstElementChild as HTMLElement;
    const leaf = cell.children[2] as HTMLElement;
    // every cell settles within ~1.2s so the board reads before it exits
    const settle = start + 0.2 + i * 0.018 + hash(i) * 0.35;
    let shown: string;
    let leafScale = 0;
    if (t < start) shown = " ";
    else if (t >= settle || final === " ") shown = final;
    else {
      const tick = Math.floor(t * 28 + i * 3);
      shown = FLAP_CHARS[(tick * 7 + i * 13) % FLAP_CHARS.length];
      leafScale = 1 - ((t * 28 + i * 3) % 1);
    }
    const txt = shown === " " ? " " : shown;
    if (ch.textContent !== txt) ch.textContent = txt;
    leaf.style.transform = `scaleY(${leafScale.toFixed(3)})`;
  });
}
