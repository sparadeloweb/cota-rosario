export interface PoissonCandidate {
  variables: string[];
  maeValidacion: number;
  coeficientesNoNegativos: boolean;
}

export interface PoissonModel {
  formula: string;
  variablesUsadas: string[];
  candidatos: PoissonCandidate[];
  coeficientes: { intercepto: number; max2h: number; total: number };
  n: number;
  pseudoR2: number;
  validacionCruzada: { maeModelo: number; maeMedia: number };
  diasPorMes: number;
  participacionDistrito: Record<string, number>;
  entrenamiento: { mes: string; casos: number; max2h: number; total: number; predicho: number }[];
}

export interface RainFeatures {
  max2h: number;
  total: number;
}

export interface DistrictExpectation {
  distrito: string;
  esperados: number;
  probabilidadAlMenosUno: number;
}

const ROUNDING = 10;

export function expectedCases(model: PoissonModel, lluvia: RainFeatures, dias: number): number {
  const { intercepto, max2h, total } = model.coeficientes;
  const monthly = Math.exp(intercepto + max2h * lluvia.max2h + total * lluvia.total);
  return Math.round(monthly * (dias / model.diasPorMes) * ROUNDING) / ROUNDING;
}

export function districtExpectations(model: PoissonModel, ciudad: number): DistrictExpectation[] {
  return Object.entries(model.participacionDistrito)
    .map(([distrito, participacion]) => {
      const esperados = Math.round(ciudad * participacion * ROUNDING) / ROUNDING;
      return { distrito, esperados, probabilidadAlMenosUno: Math.round((1 - Math.exp(-esperados)) * 100) / 100 };
    })
    .sort((a, b) => b.esperados - a.esperados);
}
