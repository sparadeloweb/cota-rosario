"use client";

import { useEffect, useState } from "react";
import { avisoDesdeCache, avisoSinConexion } from "@/lib/offline";

interface OfflineBannerProps {
  actualizadoEn?: string;
}

interface Situacion {
  desdeCache: boolean;
  conectado: boolean;
  ahora: number;
}

declare global {
  interface Window {
    __cotaDesdeCache?: string;
  }
}

export function OfflineBanner({ actualizadoEn }: OfflineBannerProps) {
  const [situacion, setSituacion] = useState<Situacion | null>(null);

  useEffect(() => {
    const actualizar = () => setSituacion({ desdeCache: window.__cotaDesdeCache === window.location.href, conectado: navigator.onLine, ahora: Date.now() });
    actualizar();
    window.addEventListener("online", actualizar);
    window.addEventListener("offline", actualizar);
    return () => {
      window.removeEventListener("online", actualizar);
      window.removeEventListener("offline", actualizar);
    };
  }, []);

  if (!situacion || (situacion.conectado && !situacion.desdeCache)) {
    return null;
  }
  const texto = situacion.desdeCache ? avisoDesdeCache(actualizadoEn, situacion.ahora, situacion.conectado) : avisoSinConexion(actualizadoEn, situacion.ahora);
  return (
    <p role="status" className="shrink-0 border-b border-rule bg-atencion/10 px-4 py-2 text-xs text-ink">
      <span className="mr-2 inline-block size-1.5 rounded-full bg-ink-faint align-middle" aria-hidden="true" />
      {texto}{" "}
      {situacion.desdeCache && situacion.conectado ? (
        <button type="button" onClick={() => window.location.reload()} className="underline decoration-rule underline-offset-4 hover:text-ink">
          Reintentar
        </button>
      ) : null}
    </p>
  );
}
