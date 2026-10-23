"use client";

import { useEffect, useState } from "react";
import { avisoSinConexion } from "@/lib/offline";

interface OfflineBannerProps {
  actualizadoEn?: string;
}

export function OfflineBanner({ actualizadoEn }: OfflineBannerProps) {
  const [desconectadoDesde, setDesconectadoDesde] = useState<number | null>(null);

  useEffect(() => {
    const actualizar = () => setDesconectadoDesde(navigator.onLine ? null : Date.now());
    actualizar();
    window.addEventListener("online", actualizar);
    window.addEventListener("offline", actualizar);
    return () => {
      window.removeEventListener("online", actualizar);
      window.removeEventListener("offline", actualizar);
    };
  }, []);

  if (desconectadoDesde === null) {
    return null;
  }
  return (
    <p role="status" className="shrink-0 border-b border-rule bg-atencion/10 px-4 py-2 text-xs text-ink">
      <span className="mr-2 inline-block size-1.5 rounded-full bg-ink-faint align-middle" aria-hidden="true" />
      {avisoSinConexion(actualizadoEn, desconectadoDesde)}
    </p>
  );
}
