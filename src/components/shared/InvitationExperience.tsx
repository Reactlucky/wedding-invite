"use client";

import { useCallback, useEffect, useRef, useState, type ComponentType } from "react";
import { AudioEngine } from "@/lib/audio/engine";
import { resolveSounds } from "@/lib/sounds";
import { gsap } from "@/lib/gsap";
import { useInvitation, useSyncMessages, type SyncMessage } from "@/lib/sync";
import { paletteToCss } from "@/lib/themes";
import type { InvitationData, TemplateId } from "@/lib/types";
import { MuteButton, SkipButton } from "./Controls";
import type { OpeningProps } from "./useCinematicTimeline";

export interface GateProps {
  data: InvitationData;
  onOpen: () => void;
}

export interface InvitationProps {
  data: InvitationData;
  template: TemplateId;
}

interface Props {
  template: TemplateId;
  Gate: ComponentType<GateProps>;
  Opening: ComponentType<OpeningProps<InvitationData>>;
  Invitation: ComponentType<InvitationProps>;
  /**
   * When set, the opening plays on load and pauses at this time (seconds).
   * The guest taps to board, and the sequence continues from there.
   */
  holdAt?: number;
  /** Seek here when the guest taps, so the doors open immediately. */
  continueAt?: number;
}

type Phase = "loading" | "gate" | "opening" | "invite";

function readMode() {
  if (typeof window === "undefined") return null;
  const q = new URLSearchParams(window.location.search);
  return { exportMode: q.get("export") === "1", preview: q.get("preview") === "1", view: q.get("view") };
}

export function InvitationExperience({ template, Gate, Opening, Invitation, holdAt, continueAt }: Props) {
  const { data } = useInvitation();
  // URL flags; pages are static shells so this is only known on the client.
  // Safe as lazy state: server and first client render both show the loading frame.
  const [mode] = useState(readMode);
  const [phase, setPhase] = useState<Phase>(() => {
    if (!mode) return "loading";
    if (mode.exportMode) return "opening";
    if (mode.view === "invitation") return "invite";
    if (holdAt != null) return "opening";
    return "gate";
  });
  const [run, setRun] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [muted, setMuted] = useState(false);
  const [awaitingBoard, setAwaitingBoard] = useState(false);
  const [holdReleased, setHoldReleased] = useState(false);
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  const engine = useRef<AudioEngine | null>(null);
  const openingLayer = useRef<HTMLDivElement>(null);

  // Audio engine follows the chosen music; pre-renders the score in a worker
  const sounds = data ? resolveSounds(data, template) : null;
  const musicKey = sounds ? JSON.stringify(sounds) : "";
  useEffect(() => {
    if (!data || !mode || mode.exportMode) return;
    const e = new AudioEngine(template, resolveSounds(data, template));
    e.preload();
    engine.current = e;
    return () => {
      e.dispose();
      if (engine.current === e) engine.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [musicKey, mode, template]);

  // The announcement is its own audio element, started on its cue. A browser that
  // blocks autoplay gets another play() from the tap, which is allowed to make sound.
  useEffect(() => {
    if (holdAt == null || !mode || mode.exportMode || mode.view === "invitation") return;
    const e = engine.current;
    if (!e) return;
    e.setMuted(mutedRef.current);
    e.playSamples();
    e.start({ gesture: false }).catch(() => {});
  }, [holdAt, musicKey, mode]);

  const beginOpening = useCallback(() => {
    setHoldReleased(false);
    setAwaitingBoard(false);
    engine.current?.dispose();
    if (data && mode && !mode.exportMode) {
      const e = new AudioEngine(template, resolveSounds(data, template));
      e.preload();
      engine.current = e;
      e.setMuted(muted);
      e.playSamples();
      e.start({ gesture: true }).catch(() => {});
    }
    setLeaving(false);
    setRun((r) => r + 1);
    setPhase("opening");
  }, [data, mode, template, muted]);

  const onHold = useCallback(() => {
    setAwaitingBoard(true);
    engine.current?.suspend();
  }, []);

  const onBoard = useCallback(() => {
    setAwaitingBoard(false);
    setHoldReleased(true);
    if (!data || !mode || mode.exportMode) return;
    let e = engine.current;
    if (!e) {
      e = new AudioEngine(template, resolveSounds(data, template));
      e.preload();
      engine.current = e;
    }
    e.setMuted(muted);
    // Inside the tap, so a browser that blocked the arrival can start the recording.
    e.playSamples({ immediate: true });
    e.armInviteMusic();
    e.resume();
    const jump = continueAt != null && holdAt != null && continueAt > holdAt + 0.05;
    if (jump) e.playScoreFrom(continueAt).catch(() => {});
    else if (e.contextState() === "running" || e.contextState() === "suspended") e.resume();
    else e.start({ offset: holdAt ?? 0, gesture: true }).catch(() => {});
  }, [data, mode, muted, holdAt, continueAt, template]);

  const finish = useCallback(
    (skipped: boolean) => {
      if (mode?.exportMode) return;
      if (skipped) engine.current?.stopSfx();
      engine.current?.playInviteMusic();
      setLeaving(true);
      setPhase("invite");
    },
    [mode],
  );

  // Cinematic hand-off: the opening dissolves while the invitation fades in beneath it
  useEffect(() => {
    if (!leaving || !openingLayer.current) return;
    const tw = gsap.to(openingLayer.current, {
      opacity: 0,
      scale: 1.04,
      filter: "blur(6px)",
      duration: 1.3,
      ease: "power2.inOut",
      onComplete: () => setLeaving(false),
    });
    return () => {
      tw.kill();
    };
  }, [leaving]);

  useEffect(() => {
    if (phase !== "opening" || mode?.exportMode) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && finish(true);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, finish, mode]);

  useEffect(() => {
    const lock = phase === "gate" || phase === "opening" || phase === "loading";
    document.documentElement.style.overflow = lock ? "hidden" : "";
    if (phase === "invite") window.scrollTo(0, 0);
  }, [phase]);

  // The wedding track starts with the invitation and keeps looping. A direct
  // visit that never got a tap can start it on the next touch.
  useEffect(() => {
    if (phase !== "invite" || mode?.exportMode) return;
    const start = () => engine.current?.playInviteMusic();
    start();
    window.addEventListener("pointerdown", start);
    return () => window.removeEventListener("pointerdown", start);
  }, [phase, mode, musicKey]);

  const onSync = useCallback(
    (msg: SyncMessage) => {
      if (msg.type === "replay") beginOpening();
      if (msg.type === "show") {
        if (msg.view === "invitation") {
          setLeaving(false);
          setPhase("invite");
        } else if (holdAt != null) {
          beginOpening();
        } else {
          engine.current?.dispose();
          setPhase("gate");
        }
      }
    },
    [beginOpening, holdAt],
  );
  useSyncMessages(onSync);

  const toggleMute = () => {
    setMuted((m) => {
      engine.current?.setMuted(!m);
      return !m;
    });
  };

  if (!data || !mode || phase === "loading") {
    return <div className="fixed inset-0 bg-black" aria-busy="true" />;
  }

  const palette = data.theme[template].palette;
  const showOpening = phase === "opening" || leaving;

  return (
    <div style={paletteToCss(palette)} className="relative min-h-dvh bg-deep text-ink">
      {phase === "invite" && <Invitation data={data} template={template} />}

      {showOpening && (
        <div ref={openingLayer} className="fixed inset-0 z-40 overflow-hidden bg-black">
          <Opening
            key={run}
            data={data}
            exportMode={mode.exportMode}
            started={phase === "opening" || leaving}
            onComplete={() => finish(false)}
            holdAt={mode.exportMode ? undefined : holdAt}
            continueAt={mode.exportMode ? undefined : continueAt}
            holdReleased={holdReleased}
            onHold={onHold}
          />
        </div>
      )}

      {phase === "gate" && <Gate data={data} onOpen={beginOpening} />}

      {awaitingBoard && !holdReleased && phase === "opening" && !leaving && (
        <button
          type="button"
          onClick={onBoard}
          className="board-pill font-v2-sans fixed left-1/2 z-50 rounded-full bg-white px-6 py-2.5 text-sm font-medium shadow-[0_8px_24px_-8px_rgba(0,0,0,.45)]"
          style={{ color: "#3a2a22", bottom: "max(9%, calc(env(safe-area-inset-bottom) + 4.5rem))" }}
        >
          Tap to board 🎟️
          <style>{`@keyframes board-in{from{opacity:0;transform:translateX(-50%) translateY(14px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}.board-pill{animation:board-in .45s ease both, board-pulse .9s ease-in-out 1s infinite alternate}@keyframes board-pulse{from{transform:translateX(-50%) scale(1)}to{transform:translateX(-50%) scale(1.05)}}`}</style>
        </button>
      )}

      {!mode.exportMode && phase !== "gate" && <MuteButton muted={muted} onToggle={toggleMute} />}
      {!mode.exportMode && phase === "opening" && !leaving && <SkipButton onSkip={() => finish(true)} />}
    </div>
  );
}
