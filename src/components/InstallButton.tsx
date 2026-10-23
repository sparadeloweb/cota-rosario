"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Estado = "desconocido" | "instalada" | "disponible" | "ios" | "manual";

const IOS_PATTERN = /iphone|ipad|ipod/i;

const STANDALONE_QUERY = "(display-mode: standalone)";

function estadoDelDispositivo(): Estado {
  if (window.matchMedia(STANDALONE_QUERY).matches) {
    return "instalada";
  }
  return IOS_PATTERN.test(navigator.userAgent) ? "ios" : "manual";
}

function suscribirModo(onChange: () => void): () => void {
  const query = window.matchMedia(STANDALONE_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

export function InstallButton() {
  const dispositivo = useSyncExternalStore(suscribirModo, estadoDelDispositivo, (): Estado => "desconocido");
  const [evento, setEvento] = useState<InstallPromptEvent | null>(null);
  const [resultado, setResultado] = useState<Estado | null>(null);
  const estado: Estado = resultado ?? (evento ? "disponible" : dispositivo);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setEvento(event as InstallPromptEvent);
    };
    const onInstalled = () => setResultado("instalada");
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const instalar = async () => {
    if (!evento) {
      return;
    }
    await evento.prompt();
    const { outcome } = await evento.userChoice;
    setEvento(null);
    setResultado(outcome === "accepted" ? "instalada" : "manual");
  };

  if (estado === "desconocido") {
    return null;
  }
  if (estado === "instalada") {
    return <p className="text-sm text-ink-soft">Cota ya está instalada en este dispositivo.</p>;
  }
  if (estado === "disponible") {
    return (
      <button type="button" onClick={instalar} className="rounded-md border border-ink-soft px-4 py-2 text-sm text-ink hover:border-ink">
        Instalar Cota
      </button>
    );
  }
  if (estado === "ios") {
    return <p className="text-sm leading-relaxed text-ink-soft">En iPhone: tocá Compartir en Safari y elegí «Agregar a inicio».</p>;
  }
  return <p className="text-sm leading-relaxed text-ink-soft">Desde el menú del navegador elegí «Instalar Cota» o «Agregar a la pantalla de inicio».</p>;
}
