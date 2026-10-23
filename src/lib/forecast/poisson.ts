export interface PoissonCandidate {
  variables: string[];
  maeValidation: number;
  nonNegativeCoefficients: boolean;
}

export interface PoissonModel {
  formula: string;
  usedVariables: string[];
  candidates: PoissonCandidate[];
  coefficients: { intercept: number; max2h: number; total: number };
  n: number;
  pseudoR2: number;
  crossValidation: { maeModel: number; maeMean: number };
  daysPerMonth: number;
  districtShare: Record<string, number>;
  training: { month: string; cases: number; max2h: number; total: number; predicted: number }[];
}

export interface RainFeatures {
  max2h: number;
  total: number;
}

export interface DistrictExpectation {
  district: string;
  expected: number;
  probabilityAtLeastOne: number | null;
}

const ROUNDING = 10;

export function expectedCases(model: PoissonModel, rain: RainFeatures, days: number): number {
  if (![rain.max2h, rain.total, days].every((value) => Number.isFinite(value) && value >= 0) || !(model.daysPerMonth > 0)) throw new Error("Entradas inválidas para el escenario.");
  const { intercept, max2h, total } = model.coefficients;
  const monthly = Math.exp(intercept + max2h * rain.max2h + total * rain.total);
  const units = Math.round(monthly * (days / model.daysPerMonth) * ROUNDING);
  if (!Number.isSafeInteger(units)) throw new Error("El escenario está fuera del rango numérico del modelo.");
  return units / ROUNDING;
}

export function splitByDay(model: PoissonModel, total: number, days: RainFeatures[]): number[] {
  const { max2h, total: totalCoef } = model.coefficients;
  const scores = days.map((day) => max2h * day.max2h + totalCoef * day.total);
  const max = Math.max(...scores);
  return allocate(total, scores.map((score) => Math.exp(score - max)));
}

export function districtExpectations(model: PoissonModel, city: number): DistrictExpectation[] {
  const entries = Object.entries(model.districtShare);
  const amounts = allocate(city, entries.map(([, weight]) => weight));
  return entries
    .map(([district], i) => {
      const expected = amounts[i];
      return { district, expected, probabilityAtLeastOne: null };
    })
    .sort((a, b) => b.expected - a.expected);
}

function allocate(total: number, weights: number[]): number[] {
  if (weights.length === 0) return [];
  const sum = weights.reduce((a, b) => a + b, 0);
  if (!Number.isFinite(total) || total < 0 || weights.some((weight) => !Number.isFinite(weight) || weight < 0) || !Number.isFinite(sum) || sum <= 0) throw new Error("El escenario está fuera del rango numérico del modelo.");
  const units = Math.round(total * ROUNDING);
  if (!Number.isSafeInteger(units)) throw new Error("El escenario excede el rango de cálculo.");
  const exact = weights.map((weight) => units * weight / sum);
  const rounded = exact.map(Math.floor);
  const order = exact.map((value, i) => ({ i, remainder: value - rounded[i] })).sort((a, b) => b.remainder - a.remainder);
  const missing = units - rounded.reduce((a, b) => a + b, 0);
  for (let i = 0; i < missing; i++) rounded[order[i % order.length].i]++;
  return rounded.map((value) => value / ROUNDING);
}
