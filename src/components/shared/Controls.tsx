"use client";

export function MuteButton({ muted, onToggle }: { muted: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={muted ? "Unmute music" : "Mute music"}
      aria-pressed={muted}
      className="glass fixed right-4 top-4 z-50 grid h-11 w-11 place-items-center rounded-full text-accent-light transition hover:scale-105 active:scale-95"
      style={{ top: "max(1rem, env(safe-area-inset-top))" }}
    >
      {muted ? (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M4 9h3l5-4v14l-5-4H4z" strokeLinejoin="round" />
          <path d="M16 9l5 6M21 9l-5 6" strokeLinecap="round" />
        </svg>
      ) : (
        <span className="flex h-5 items-end gap-[3px]" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="w-[3px] rounded-full bg-current"
              style={{ height: "100%", animation: `eq 1s ${i * 0.15}s ease-in-out infinite alternate`, transformOrigin: "bottom" }}
            />
          ))}
          <style>{`@keyframes eq{from{transform:scaleY(.25)}to{transform:scaleY(1)}}`}</style>
        </span>
      )}
    </button>
  );
}

export function SkipButton({ onSkip }: { onSkip: () => void }) {
  return (
    <button
      type="button"
      onClick={onSkip}
      className="glass fixed bottom-6 right-4 z-50 flex items-center gap-2 rounded-full px-5 py-2.5 font-display text-[11px] tracking-[0.3em] text-ink/90 uppercase transition hover:text-accent-light active:scale-95"
      style={{ bottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
    >
      Skip
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
        <path d="M5 5l9 7-9 7zM15 5h3v14h-3z" />
      </svg>
    </button>
  );
}
