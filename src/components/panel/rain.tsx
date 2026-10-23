import { Motion } from "@/components/motion/Motion";
import type { RainHour, RainOutlookDay, MonthRain } from "@/lib/rain";
import { horaArgentina } from "@/lib/time";

const HOURS_SHOWN = 48;
const LABEL_EVERY_HOURS = 6;
const PERCENT = 100;
const MIN_SCALE_MM = 2;
const WEEKDAYS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

interface HourlyRainProps {
  horas: RainHour[];
  pico?: { milimetros: number; desde: string; hasta: string } | null;
}

export function HourlyRain({ horas, pico }: HourlyRainProps) {
  const visibles = horas.slice(0, HOURS_SHOWN);
  if (!visibles.length) {
    return <p className="text-xs text-ink-soft">El pronóstico horario no trae horas para mostrar.</p>;
  }
  const maximo = Math.max(MIN_SCALE_MM, ...visibles.map((hora) => hora.milimetros));
  const dentroDelPico = (iso: string) => (pico ? iso >= pico.desde && iso < pico.hasta : false);
  const total = visibles.reduce((suma, hora) => suma + hora.milimetros, 0);

  return (
    <Motion>
      <div className="flex items-baseline justify-between gap-3">
        <p className="readout text-sm text-ink">
          <span className="text-2xl font-medium">{total.toFixed(1)}</span> mm en {visibles.length} h
        </p>
        {pico ? (
          <p className="readout text-xs text-atencion">
            pico {pico.milimetros.toFixed(1)} mm / 2 h · {horaArgentina(pico.desde)}
          </p>
        ) : null}
      </div>
      <div className="mt-4 flex h-40 items-end gap-px">
        {visibles.map((hora) => {
          const probabilidad = hora.probabilidad ?? 0;
          return (
            <div key={hora.hora} className="relative flex h-full min-w-0 flex-1 flex-col justify-end" title={`${horaArgentina(hora.hora)} · ${hora.milimetros.toFixed(1)} mm · probabilidad ${hora.probabilidad ?? "sin dato"}${hora.probabilidad === null ? "" : " %"}`}>
              {dentroDelPico(hora.hora) ? <span className="absolute inset-x-0 bottom-0 top-0 bg-atencion/10" aria-hidden="true" /> : null}
              <span className="absolute inset-x-0 bottom-0 rounded-t-[1px] bg-water/15" style={{ height: `${probabilidad}%` }} aria-hidden="true" data-grow-y />
              <span className="relative rounded-t-[1px] bg-water" style={{ height: `${(hora.milimetros / maximo) * PERCENT}%`, minHeight: hora.milimetros > 0 ? 2 : 0 }} data-grow-y />
            </div>
          );
        })}
      </div>
      <div className="readout mt-1.5 flex text-[10px] text-ink-faint">
        {visibles.map((hora, i) => (
          <span key={hora.hora} className="min-w-0 flex-1 overflow-visible whitespace-nowrap">
            {i % LABEL_EVERY_HOURS === 0 ? horaArgentina(hora.hora) : ""}
          </span>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-[11px] text-ink-soft">
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-water" aria-hidden="true" />milímetros por hora</span>
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-water/15" aria-hidden="true" />probabilidad (alto = 100 %)</span>
        {pico ? <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-atencion/25" aria-hidden="true" />ventana del pico</span> : null}
      </div>
    </Motion>
  );
}

function diaDeSemana(fecha: string): string {
  return WEEKDAYS[new Date(`${fecha}T12:00:00Z`).getUTCDay()];
}

export function WeekRain({ dias }: { dias: RainOutlookDay[] }) {
  const maximo = Math.max(MIN_SCALE_MM, ...dias.map((dia) => dia.milimetros));
  return (
    <Motion>
      <ol className="grid grid-cols-7 gap-1.5 sm:gap-3">
        {dias.map((dia, i) => (
          <li key={dia.fecha} className={`flex flex-col items-center gap-2 rounded-lg border px-1 py-3 ${i === 0 ? "border-ink-faint bg-panel-soft" : "border-rule-soft"}`} data-reveal>
            <span className={`meta text-[10px] ${i === 0 ? "text-ink" : ""}`}>{i === 0 ? "hoy" : diaDeSemana(dia.fecha)}</span>
            <span className="relative flex h-20 w-3 items-end overflow-hidden rounded-full bg-rule-soft">
              <span className="w-full rounded-full bg-water" style={{ height: `${(dia.milimetros / maximo) * PERCENT}%` }} data-grow-y />
            </span>
            <span className="readout text-sm text-ink">{dia.milimetros.toFixed(dia.milimetros < 10 ? 1 : 0)}</span>
            <span className="readout text-[10px] text-ink-faint">{dia.probabilidad === null ? "—" : `${dia.probabilidad} %`}</span>
          </li>
        ))}
      </ol>
      <p className="meta mt-3">milímetros por día · probabilidad máxima del día</p>
    </Motion>
  );
}

export function MonthProgress({ mes, normalMm }: { mes: MonthRain; normalMm: number }) {
  const [anio, numeroMes] = mes.mes.split("-").map(Number);
  const diasDelMes = new Date(Date.UTC(anio, numeroMes, 0)).getUTCDate();
  const diaActual = mes.hasta ? Number(mes.hasta.slice(8, 10)) : mes.diasConDato;
  const proporcional = (normalMm * diaActual) / diasDelMes;
  const techo = Math.max(mes.acumuladoMm, normalMm) * 1.08;
  const pos = (mm: number) => `${Math.min(PERCENT, (mm / techo) * PERCENT)}%`;
  const relacion = Math.round((mes.acumuladoMm / normalMm) * PERCENT);

  return (
    <Motion>
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <p className="readout text-ink">
          <span className="text-3xl font-medium" data-count={mes.acumuladoMm} data-decimals={0}>
            {mes.acumuladoMm.toFixed(0)}
          </span>{" "}
          <span className="text-sm text-ink-soft">mm acumulados</span>
        </p>
        <p className="text-sm text-ink-soft">
          <span className="readout text-ink">{relacion} %</span> de la referencia del mes
        </p>
      </div>
      <div className="relative mt-5 h-4 rounded-full bg-rule-soft">
        <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-water-deep to-water" style={{ width: pos(mes.acumuladoMm) }} data-grow-x />
        <div className="absolute -inset-y-2 w-px bg-ink" style={{ left: pos(normalMm) }} aria-hidden="true" />
        <div className="absolute -inset-y-1 w-px border-l border-dashed border-ink-faint" style={{ left: pos(proporcional) }} aria-hidden="true" />
      </div>
      <div className="relative mt-2 h-10 text-[10px]">
        <span className="readout absolute -translate-x-full whitespace-nowrap pr-1 text-ink" style={{ left: pos(normalMm) }}>
          referencia del mes {normalMm.toFixed(0)} mm
        </span>
        <span className="readout absolute top-5 -translate-x-1/2 whitespace-nowrap text-ink-faint" style={{ left: pos(proporcional) }}>
          a esta altura · {proporcional.toFixed(0)} mm
        </span>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-ink-faint">
        Datos hasta {mes.hasta ?? "—"}{mes.completo ? "" : " · cobertura parcial"}. La marca punteada reparte la referencia en partes iguales por día: es una guía, no un valor histórico.
      </p>
    </Motion>
  );
}
