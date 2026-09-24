import type { RainBalance } from "@/lib/rain";

const PERCENT = 100;

interface RainBalanceBarsProps {
  balance: RainBalance;
}

function fmtDia(fecha: string): string {
  const [, mes, dia] = fecha.split("-");
  return `${dia}/${mes}`;
}

export function RainBalanceBars({ balance }: RainBalanceBarsProps) {
  const maximo = Math.max(...balance.porDia.map((dia) => Math.max(dia.caidoMm, dia.previstoMm)), 1);
  return (
    <ul className="flex items-end gap-1.5" aria-label="Lluvia caída y prevista por día">
      {balance.porDia.map((dia) => {
        const esHoy = dia.fecha === balance.ahoraLocal.slice(0, 10);
        const total = dia.caidoMm + dia.previstoMm;
        return (
          <li key={dia.fecha} className="flex flex-1 flex-col items-center gap-1">
            <span className="readout text-[10px] text-ink-soft">{total > 0 ? total.toFixed(0) : ""}</span>
            <span className="flex h-14 w-full flex-col-reverse overflow-hidden rounded-sm bg-rule-soft">
              <span className="block w-full bg-water/80" style={{ height: `${(dia.caidoMm / maximo) * PERCENT}%` }} />
              <span className="block w-full bg-water/30" style={{ height: `${(dia.previstoMm / maximo) * PERCENT}%` }} />
            </span>
            <span className={`readout text-[10px] ${esHoy ? "text-ink" : "text-ink-faint"}`}>{esHoy ? "hoy" : fmtDia(dia.fecha)}</span>
          </li>
        );
      })}
    </ul>
  );
}
