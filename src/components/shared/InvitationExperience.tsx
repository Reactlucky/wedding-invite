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
}

type Phase = "loading" | "gate" | "opening" | "invite";

function readMode() {
  if (typeof window === "undefined") return null;
  const q = new URLSearchParams(window.location.search);
  return { exportMode: q.get("export") === "1", preview: q.get("preview") === "1", view: q.get("view") };
}

export function InvitationExperience({ template, Gate, Opening, Invitation }: Props) {
  const { data } = useInvitation();
  // URL flags; pages are static shells so this is only known on the client.
  // Safe as lazy state: server and first client render both show the loading frame.
  const [mode] = useState(readMode);
  const [phase, setPhase] = useState<Phase>(() => (!mode ? "loading" : mode.exportMode ? "opening" : mode.view === "invitation" ? "invite" : "gate"));
  const [run, setRun] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [muted, setMuted] = useState(false);

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

  const beginOpening = useCallback(() => {
    engine.current?.dispose();
    if (data && mode && !mode.exportMode) {
      const e = new AudioEngine(template, resolveSounds(data, template));
      e.preload();
      engine.current = e;
      e.setMuted(muted);
      e.start().catch(() => {});
    }
    setLeaving(false);
    setRun((r) => r + 1);
    setPhase("opening");
  }, [data, mode, template, muted]);

  const finish = useCallback(
    (skipped: boolean) => {
      if (mode?.exportMode) return;
      if (skipped) engine.current?.stopSfx();
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

  const onSync = useCallback(
    (msg: SyncMessage) => {
      if (msg.type === "replay") beginOpening();
      if (msg.type === "show") {
        if (msg.view === "invitation") {
          setLeaving(false);
          setPhase("invite");
        } else {
          engine.current?.dispose();
          setPhase("gate");
        }
      }
    },
    [beginOpening],
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
          />
        </div>
      )}

      {phase === "gate" && <Gate data={data} onOpen={beginOpening} />}

      {!mode.exportMode && phase !== "gate" && <MuteButton muted={muted} onToggle={toggleMute} />}
      {!mode.exportMode && phase === "opening" && !leaving && <SkipButton onSkip={() => finish(true)} />}
    </div>
  );
}
