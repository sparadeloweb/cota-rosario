import type { Predicciones } from "@/lib/predicciones";

const VARIABLE_LABEL: Record<string, string> = { total: "de lluvia total", max2h: "del pico de 2 h" };

interface ModelNotesProps {
  predicciones: Predicciones;
}

export function ModelNotes({ predicciones }: ModelNotesProps) {
  const { anegamientos, lluvia, rio } = predicciones;
  return (
    <dl className="flex flex-col gap-4 text-xs leading-relaxed text-ink-soft">
      {anegamientos ? (
        <div className="flex flex-col gap-1">
          <dt className="text-ink">Anegamientos · regresión de Poisson</dt>
          <dd>
            <span className="readout text-ink">{anegamientos.modelo.formula}</span>
            <br />
            β0 {anegamientos.modelo.coeficientes.intercepto.toFixed(3)}
            {anegamientos.modelo.variablesUsadas.map((variable, index) => (
              <span key={variable}>
                {" "}
                · β{index + 1} {anegamientos.modelo.coeficientes[variable as "max2h" | "total"].toFixed(4)} por mm {VARIABLE_LABEL[variable] ?? variable}
              </span>
            ))}
            . Ajustada por mínimos cuadrados reponderados sobre los meses de Defensa Civil y la lluvia horaria de ERA5. Se probaron{" "}
            {anegamientos.modelo.candidatos
              .map((candidato) => `${candidato.variables.map((v) => VARIABLE_LABEL[v] ?? v).join(" + ")} (error ${candidato.maeValidacion}${candidato.coeficientesNoNegativos ? "" : ", coeficiente negativo, descartado"})`)
              .join(", ")}
            ; gana el de menor error dejando un mes afuera. Se reparte entre distritos según su participación histórica; los casos esperados en la
            ventana se escalan por días/30,4 y la probabilidad de al menos uno es 1 − e<sup>−λ</sup>.
          </dd>
        </div>
      ) : null}
      {lluvia ? (
        <div className="flex flex-col gap-1">
          <dt className="text-ink">Lluvia extrema · Gumbel</dt>
          <dd>
            Máximo diario de cada año {lluvia.periodo.desde}–{lluvia.periodo.hasta} ({lluvia.gumbel.n} años) ajustado por momentos: μ {lluvia.gumbel.mu} mm, β{" "}
            {lluvia.gumbel.beta} mm. Período de retorno T = 1 / (1 − F(x)). ERA5 es un reanálisis de 0,25° y suaviza las tormentas convectivas: los
            extremos reales de una estación son algo mayores.
          </dd>
        </div>
      ) : null}
      {rio ? (
        <div className="flex flex-col gap-1">
          <dt className="text-ink">Río · tendencia y curva altura–caudal</dt>
          <dd>
            Tendencia: recta de mínimos cuadrados sobre los últimos {rio.tendencia?.ventanaDias ?? "—"} días de la serie del INA
            {rio.tendencia ? ` (${(rio.tendencia.metrosPorDia * 100).toFixed(1)} cm/día, σ ${rio.tendencia.sigmaMetros} m)` : ""}. Curva: h = a + b·ln(Q) con Q el caudal GloFAS del
            mismo día
            {rio.curva ? ` (a ${rio.curva.a}, b ${rio.curva.b}, R² ${rio.curva.r2}, σ ${rio.curva.sigmaMetros} m, ${rio.curva.n} días)` : ", sin ajuste disponible"}; se aplica al caudal
            pronosticado a 7 días. GloFAS es un modelo hidrológico global, no una medición: la curva hereda su sesgo.
          </dd>
        </div>
      ) : null}
    </dl>
  );
}
