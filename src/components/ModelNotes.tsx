import type { Predicciones } from "@/lib/predicciones";

const VARIABLE_LABEL: Record<string, string> = { total: "lluvia total del mes", max2h: "pico de 2 horas" };

interface ModelNotesProps {
  predicciones: Predicciones;
}

export function ModelNotes({ predicciones }: ModelNotesProps) {
  const { anegamientos, lluvia, rio } = predicciones;
  return (
    <dl className="flex flex-col gap-4 text-xs leading-relaxed text-ink-soft">
      {anegamientos ? (
        <div className="flex flex-col gap-1">
          <dt className="text-ink">Anegamientos esperados</dt>
          <dd>
            Se miró, mes por mes, cuántos anegamientos atendió Defensa Civil y cuánto llovió ese mes, y se ajustó una curva que relaciona las dos
            cosas: a más lluvia, más casos, y el aumento es más que proporcional. Con la lluvia del pronóstico esa curva devuelve los casos esperados
            para la semana; se reparten entre distritos según lo que cada uno pesa históricamente, y la probabilidad de que haya al menos uno sale
            del promedio esperado. Se probaron tres maneras de medir la lluvia ({anegamientos.modelo.candidatos.map((candidato) => candidato.variables.map((v) => VARIABLE_LABEL[v] ?? v).join(" + ")).join(", ")}) y
            se quedó la que mejor predice meses que no vio, {anegamientos.modelo.variablesUsadas.map((v) => VARIABLE_LABEL[v] ?? v).join(" + ")}, con un error
            típico de {Math.round(anegamientos.modelo.validacionCruzada.maeModelo)} casos por mes contra {Math.round(anegamientos.modelo.validacionCruzada.maeMedia)} si
            se usara el promedio.
            <span className="mt-2 block text-ink-faint">
              Para quien quiera la fórmula: regresión de Poisson,{" "}
              <span className="readout">{anegamientos.modelo.formula}</span>, β0 {anegamientos.modelo.coeficientes.intercepto.toFixed(3)}
              {anegamientos.modelo.variablesUsadas.map((variable, index) => (
                <span key={variable}>
                  , β{index + 1} {anegamientos.modelo.coeficientes[variable as "max2h" | "total"].toFixed(4)} por mm
                </span>
              ))}
              .
            </span>
          </dd>
        </div>
      ) : null}
      {lluvia ? (
        <div className="flex flex-col gap-1">
          <dt className="text-ink">Qué tan rara es la lluvia</dt>
          <dd>
            Se tomó el día más lluvioso de cada año desde {lluvia.periodo.desde} ({lluvia.gumbel.n} años) y se ajustó la distribución que se usa en
            hidrología para valores extremos. Con eso se responde cada cuántos años, en promedio, aparece un día tan lluvioso como el peor del pronóstico.
            El registro es un reanálisis (ERA5) y suaviza las tormentas cortas, así que los extremos reales de un pluviómetro son algo mayores.
            <span className="mt-2 block text-ink-faint">
              Para quien quiera la fórmula: Gumbel por momentos, μ {lluvia.gumbel.mu} mm y β {lluvia.gumbel.beta} mm; período de retorno T = 1 / (1 − F(x)).
            </span>
          </dd>
        </div>
      ) : null}
      {rio ? (
        <div className="flex flex-col gap-1">
          <dt className="text-ink">A dónde va el río</dt>
          <dd>
            Dos estimaciones distintas. La primera sigue el ritmo de los últimos {rio.tendencia?.ventanaDias ?? "—"} días de la regla del INA
            {rio.tendencia ? ` (${(rio.tendencia.metrosPorDia * 100).toFixed(1)} cm por día)` : ""} y calcula cuándo tocaría la alerta si nada cambiara. La
            segunda usa el caudal que GloFAS pronostica y la relación histórica entre ese caudal y la altura en Rosario, probando desfases de hasta diez
            días entre uno y otro
            {rio.curva ? ` (el mejor fue ${rio.curva.desfaseDias} días)` : ""}. GloFAS es un modelo global, no una medición: cuando la relación es floja el panel marca
            esa estimación como poco confiable y la tendencia pesa más.
            <span className="mt-2 block text-ink-faint">
              Para quien quiera la fórmula: tendencia por mínimos cuadrados{rio.tendencia ? `, σ ${rio.tendencia.sigmaMetros} m` : ""}; curva h = a + b·ln(Q)
              {rio.curva ? ` con a ${rio.curva.a}, b ${rio.curva.b}, R² ${rio.curva.r2}, σ ${rio.curva.sigmaMetros} m sobre ${rio.curva.n} días` : ""}; bandas de ±2σ.
            </span>
          </dd>
        </div>
      ) : null}
    </dl>
  );
}
