import type { WeatherIcon, WeatherNow } from "@/lib/weather";

interface WeatherBadgeProps {
  clima: WeatherNow | null;
}

const ICON_PATHS: Record<WeatherIcon, string> = {
  sol: "M12 4V2m0 20v-2m8-8h2M2 12h2m13.66-5.66 1.41-1.41M4.93 19.07l1.41-1.41m0-11.32L4.93 4.93m14.14 14.14-1.41-1.41M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z",
  nubes: "M7 18h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6.2 9.2 4.5 4.5 0 0 0 7 18Zm9-12.5a3 3 0 0 1 3 3",
  nublado: "M6 18h11a4 4 0 0 0 .3-7.99A6 6 0 0 0 5.6 9.3 4.4 4.4 0 0 0 6 18Z",
  niebla: "M4 10h16M4 14h16M6 18h12M8 6h8",
  llovizna: "M7 15h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6.2 6.2 4.5 4.5 0 0 0 7 15Zm1 4 .01 0M12 19l.01 0M16 19l.01 0",
  lluvia: "M7 14h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6.2 5.2 4.5 4.5 0 0 0 7 14Zm1 3-1 3m5-3-1 3m5-3-1 3",
  tormenta: "M7 13h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6.2 4.2 4.5 4.5 0 0 0 7 13Zm6 0-2 4h3l-2 5",
  granizo: "M7 14h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6.2 5.2 4.5 4.5 0 0 0 7 14Zm1 4h.01M12 20h.01M16 18h.01",
};

function WeatherIconSvg({ icono, className }: { icono: WeatherIcon; className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICON_PATHS[icono]} />
    </svg>
  );
}

function rainChance(clima: WeatherNow): string {
  return clima.probabilidadLluvia === null ? "sin dato" : `${clima.probabilidadLluvia} %`;
}

// Compact single row for the mobile sheet, where the map keeps only the search box.
export function WeatherLine({ clima }: WeatherBadgeProps) {
  if (!clima) {
    return null;
  }
  return (
    <div className="flex items-center gap-3 border-b border-rule px-5 pb-3 pt-1 sm:px-6 lg:hidden" title={`${clima.descripcion} · dato modelado`}>
      <WeatherIconSvg icono={clima.icono} className="size-6 shrink-0 text-ink-soft" />
      <span className="readout text-lg leading-none text-ink">{clima.temperatura}°</span>
      <span className="min-w-0 flex-1 truncate text-xs text-ink-soft">{clima.descripcion}</span>
      <dl className="readout flex shrink-0 gap-3 text-[11px] text-ink-soft">
        <div className="flex flex-col items-end leading-tight">
          <dt className="text-ink-faint">humedad</dt>
          <dd className="text-ink">{clima.humedad} %</dd>
        </div>
        <div className="flex flex-col items-end leading-tight">
          <dt className="text-ink-faint">lluvia {clima.ventanaHoras} h</dt>
          <dd className="text-ink">{rainChance(clima)}</dd>
        </div>
      </dl>
    </div>
  );
}

export function WeatherBadge({ clima }: WeatherBadgeProps) {
  if (!clima) {
    return null;
  }
  return (
    <div
      className="pointer-events-auto flex items-center gap-3 rounded-md border border-rule bg-panel/95 px-3 py-2 shadow-xl backdrop-blur"
      title={`${clima.descripcion} · dato modelado · sensación ${clima.sensacion}° · viento ${clima.viento} km/h · fecha ${clima.medidoEn.slice(11, 16)}`}
    >
      <WeatherIconSvg icono={clima.icono} className="size-7 shrink-0 text-ink-soft" />
      <div className="flex flex-col leading-tight">
        <span className="flex items-baseline gap-2">
          <span className="readout text-lg text-ink">{clima.temperatura}°</span>
          <span className="text-xs text-ink-soft">{clima.descripcion}</span>
        </span>
        <span className="readout text-[11px] text-ink-faint">
          <span className="hidden sm:inline">
            humedad {clima.humedad} % · {clima.presion} hPa ·{" "}
          </span>
          lluvia próx. {clima.ventanaHoras} h {rainChance(clima)}
        </span>
      </div>
    </div>
  );
}
