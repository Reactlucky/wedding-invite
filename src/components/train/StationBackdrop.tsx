/** Static sunset station silhouette used behind the gate and invitation hero. */
export function StationBackdrop({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, var(--c-deep) 0%, color-mix(in oklab, var(--c-base) 75%, var(--c-deep)) 38%, var(--c-base) 58%, var(--c-accent-light) 78%, color-mix(in oklab, var(--c-accent-light) 60%, white) 84%)",
        }}
      />
      <div
        className="absolute left-1/2 top-[72%] h-[38vmin] w-[38vmin] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: "radial-gradient(circle, #fff6df 0%, var(--c-accent-light) 35%, transparent 70%)" }}
      />
      <svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full">
        <g fill="var(--c-deep)">
          <path d="M0 470 Q120 440 240 455 T520 448 T780 452 T1000 445 V600 H0Z" opacity=".55" />
          <path d="M0 480 H1000 V600 H0Z" />
          {/* canopy on the right */}
          <path d="M620 300 L1000 260 V280 L620 318Z" />
          {[650, 720, 790, 860, 930].map((x, i) => (
            <g key={x}>
              <rect x={x} y={300 - i * 7} width="6" height={180 + i * 7} />
              <path d={`M${x + 3} ${312 - i * 7} q-26 4 -34 30`} stroke="var(--c-deep)" strokeWidth="4" fill="none" />
              <line x1={x - 30} y1={310 - i * 7} x2={x - 30} y2={335 - i * 7} stroke="var(--c-deep)" strokeWidth="1.5" />
              <circle cx={x - 30} cy={340 - i * 7} r="6" fill="var(--c-accent-light)" />
            </g>
          ))}
          {/* telegraph poles on the left */}
          {[60, 200, 300, 370].map((x, i) => (
            <g key={x}>
              <rect x={x} y={360 + i * 18} width={5 - i} height={120 - i * 18} />
              <rect x={x - 16 + i * 3} y={362 + i * 18} width={36 - i * 6} height="3" />
            </g>
          ))}
        </g>
        {/* rails converging to the horizon */}
        <g stroke="var(--c-accent)" strokeWidth="3" fill="none" opacity=".9">
          <path d="M500 482 L300 600" />
          <path d="M500 482 L560 600" />
        </g>
        <g stroke="var(--c-accent)" opacity=".45">
          {Array.from({ length: 10 }).map((_, i) => {
            const y = 486 + i * i * 1.25;
            const k = (y - 482) / 118;
            return <line key={i} x1={500 - 200 * k - 6} x2={500 + 60 * k + 6} y1={y} y2={y} strokeWidth={1 + k * 4} />;
          })}
        </g>
      </svg>
    </div>
  );
}
