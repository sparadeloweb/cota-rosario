export interface GumbelParams {
  mu: number;
  beta: number;
  n: number;
}

export interface ExtremeRainModel {
  formula: string;
  gumbel: GumbelParams;
  period: { from: number; until: number };
  quantiles: { periodYears: number; mm: number }[];
  annualMaxima: { year: number; mm: number }[];
  dailyThresholds: number[];
  monthlyClimatology: { month: number; meanMm: number; dayProbability: Record<string, number> }[];
}

const MAX_RETURN_PERIOD_YEARS = 10_000;

export function exceedanceProbability({ mu, beta }: GumbelParams, mm: number): number {
  return 1 - Math.exp(-Math.exp(-(mm - mu) / beta));
}

export function returnPeriodYears(params: GumbelParams, mm: number): number {
  const probability = exceedanceProbability(params, mm);
  return probability <= 0 ? MAX_RETURN_PERIOD_YEARS : Math.min(MAX_RETURN_PERIOD_YEARS, 1 / probability);
}

export function empiricalRank(model: ExtremeRainModel, mm: number): { larger: number; total: number } {
  return { larger: model.annualMaxima.filter((entry) => entry.mm >= mm).length, total: model.annualMaxima.length };
}
