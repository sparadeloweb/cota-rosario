export interface GumbelParams {
  mu: number;
  beta: number;
  n: number;
}

export interface ExtremeRainModel {
  formula: string;
  gumbel: GumbelParams;
  periodo: { desde: number; hasta: number };
  cuantiles: { periodoAnios: number; mm: number }[];
  maximosAnuales: { anio: number; mm: number }[];
  umbralesDiarios: number[];
  climatologiaMensual: { mes: number; mediaMm: number; probabilidadDia: Record<string, number> }[];
}

const MAX_RETURN_PERIOD_YEARS = 10_000;

export function exceedanceProbability({ mu, beta }: GumbelParams, mm: number): number {
  return 1 - Math.exp(-Math.exp(-(mm - mu) / beta));
}

export function returnPeriodYears(params: GumbelParams, mm: number): number {
  const probability = exceedanceProbability(params, mm);
  return probability <= 0 ? MAX_RETURN_PERIOD_YEARS : Math.min(MAX_RETURN_PERIOD_YEARS, 1 / probability);
}

export function empiricalRank(model: ExtremeRainModel, mm: number): { mayores: number; total: number } {
  return { mayores: model.maximosAnuales.filter((entry) => entry.mm >= mm).length, total: model.maximosAnuales.length };
}
