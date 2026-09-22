"use client";

import { useState } from "react";
import { RISK_FILL } from "@/components/status";
import { RAIN_THRESHOLDS, RISK_LABEL, simulate, type RiskLevel } from "@/lib/risk";

const MAX_METERS = 7;
const MAX_RAIN_MM = 60;
const STEP_METERS = 0.05;
const STEP_MM = 1;

interface SimulatorProps {
  metrosActuales: number;
  alerta: number;
  evacuacion: number;
  picoActualMm: number;
}

function Estado({ nivel, grande = false }: { nivel: RiskLevel; grande?: boolean }) {
  return (
    <span className={`flex items-center gap-2 ${grande ? "text-base" : "text-sm"}`}>
      <span className={`${grande ? "size-2.5" : "size-1.5"} rounded-full`} style={{ background: RISK_FILL[nivel] }} aria-hidden="true" />
      <span className="text-ink">{RISK_LABEL[nivel]}</span>
    </span>
  );
}

export function Simulator({ metrosActuales, alerta, evacuacion, picoActualMm }: SimulatorProps) {
  const [metros, setMetros] = useState(metrosActuales);
  const [lluvia, setLluvia] = useState(picoActualMm);
  const resultado = simulate({ metros, alerta, evacuacion, picoLluviaMm: lluvia });
  const modificado = metros !== metrosActuales || lluvia !== picoActualMm;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Estado nivel={resultado.nivel} grande />
        {modificado ? <span className="text-xs text-atencion">escenario simulado</span> : <span className="meta">valores reales de ahora</span>}
        {modificado ? (
          <button
            type="button"
            onClick={() => {
              setMetros(metrosActuales);
              setLluvia(picoActualMm);
            }}
            className="ml-auto text-xs text-ink-soft underline decoration-rule underline-offset-4 hover:text-ink"
          >
            Volver a los valores reales
          </button>
        ) : null}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label htmlFor="sim-rio" className="flex flex-col gap-2">
          <span className="flex items-baseline justify-between">
            <span className="text-sm text-ink">Altura del río</span>
            <span className="readout text-sm text-ink">{metros.toFixed(2)} m</span>
          </span>
          <input
            id="sim-rio"
            type="range"
            min={0}
            max={MAX_METERS}
            step={STEP_METERS}
            value={metros}
            onChange={(event) => setMetros(Number(event.target.value))}
            className="accent-ink-soft"
          />
          <span className="meta">
            alerta {alerta.toFixed(2)} · evacuación {evacuacion.toFixed(2)}
          </span>
        </label>

        <label htmlFor="sim-lluvia" className="flex flex-col gap-2">
          <span className="flex items-baseline justify-between">
            <span className="text-sm text-ink">Lluvia en 2 h</span>
            <span className="readout text-sm text-ink">{lluvia.toFixed(0)} mm</span>
          </span>
          <input
            id="sim-lluvia"
            type="range"
            min={0}
            max={MAX_RAIN_MM}
            step={STEP_MM}
            value={lluvia}
            onChange={(event) => setLluvia(Number(event.target.value))}
            className="accent-ink-soft"
          />
          <span className="meta">
            atención {RAIN_THRESHOLDS.atencion} · alerta {RAIN_THRESHOLDS.alerta} · crítico {RAIN_THRESHOLDS.critico} mm
          </span>
        </label>
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="flex items-baseline justify-between gap-3 text-sm">
          <span className="text-ink-soft">Por altura del río</span>
          <Estado nivel={resultado.rio} />
        </div>
        <div className="flex items-baseline justify-between gap-3 text-sm">
          <span className="text-ink-soft">Por lluvia concentrada</span>
          <Estado nivel={resultado.lluvia} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="meta">Zonas oficiales bajo este escenario</span>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {resultado.zonas.map((zona) => (
            <span key={zona.zona} className="flex items-center gap-1.5 text-xs">
              <span className="size-1.5 rounded-full" style={{ background: RISK_FILL[zona.nivel] }} aria-hidden="true" />
              <span className="readout text-ink-soft">Zona {zona.zona}</span>
            </span>
          ))}
        </div>
      </div>

      <p className="text-xs leading-relaxed text-ink-faint">
        La simulación usa exactamente el mismo modelo que la vista pública: mover los controles no altera ningún dato real ni queda guardado.
        Sirve para ensayar el umbral con el que se quiere disparar un aviso antes de que la situación ocurra.
      </p>
    </div>
  );
}
