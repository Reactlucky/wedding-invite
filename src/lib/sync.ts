"use client";

import { useEffect, useState } from "react";
import { normalizeInvitation } from "./defaults";
import type { InvitationData } from "./types";

const CHANNEL = "ever-after-sync";

export type SyncMessage =
  | { type: "data"; data: InvitationData }
  | { type: "replay" }
  | { type: "show"; view: "opening" | "invitation" };

export function broadcast(msg: SyncMessage) {
  if (typeof BroadcastChannel === "undefined") return;
  const ch = new BroadcastChannel(CHANNEL);
  ch.postMessage(msg);
  ch.close();
}

export function useSyncMessages(handler: (msg: SyncMessage) => void) {
  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const ch = new BroadcastChannel(CHANNEL);
    ch.onmessage = (e) => handler(e.data as SyncMessage);
    return () => ch.close();
  }, [handler]);
}

export function editorHeaders(): Record<string, string> {
  if (typeof localStorage === "undefined") return {};
  try {
    const token = localStorage.getItem("editor-token");
    return token ? { "x-editor-token": token } : {};
  } catch {
    return {};
  }
}

/** Loads the saved invitation and live-updates it from the editor (same browser). */
export function useInvitation() {
  const [data, setData] = useState<InvitationData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/invitation", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d) => alive && setData(normalizeInvitation(d)))
      .catch((e) => {
        if (!alive) return;
        setError(String(e));
        setData(normalizeInvitation(null));
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const ch = new BroadcastChannel(CHANNEL);
    ch.onmessage = (e) => {
      const msg = e.data as SyncMessage;
      if (msg.type === "data") setData(normalizeInvitation(msg.data));
    };
    return () => ch.close();
  }, []);

  return { data, error };
}
