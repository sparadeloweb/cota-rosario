"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Status = "unknown" | "installed" | "available" | "ios" | "manual";

const IOS_PATTERN = /iphone|ipad|ipod/i;

const STANDALONE_QUERY = "(display-mode: standalone)";

function deviceState(): Status {
  if (window.matchMedia(STANDALONE_QUERY).matches) {
    return "installed";
  }
  return IOS_PATTERN.test(navigator.userAgent) ? "ios" : "manual";
}

function subscribeDisplayMode(onChange: () => void): () => void {
  const query = window.matchMedia(STANDALONE_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

export function InstallButton() {
  const device = useSyncExternalStore(subscribeDisplayMode, deviceState, (): Status => "unknown");
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [result, setResult] = useState<Status | null>(null);
  const status: Status = result ?? (promptEvent ? "available" : device);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    };
    const onInstalled = () => setResult("installed");
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    if (!promptEvent) {
      return;
    }
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    setPromptEvent(null);
    setResult(outcome === "accepted" ? "installed" : "manual");
  };

  if (status === "unknown") {
    return null;
  }
  if (status === "installed") {
    return <p className="text-sm text-ink-soft">Cota ya está instalada en este dispositivo.</p>;
  }
  if (status === "available") {
    return (
      <button type="button" onClick={install} className="rounded-md border border-ink-soft px-4 py-2 text-sm text-ink hover:border-ink">
        Instalar Cota
      </button>
    );
  }
  if (status === "ios") {
    return <p className="text-sm leading-relaxed text-ink-soft">En iPhone: tocá Compartir en Safari y elegí «Agregar a inicio».</p>;
  }
  return <p className="text-sm leading-relaxed text-ink-soft">Desde el menú del navegador elegí «Instalar Cota» o «Agregar a la pantalla de inicio».</p>;
}
