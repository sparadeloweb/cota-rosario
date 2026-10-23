import { readFile, writeFile } from "node:fs/promises";

const ARCHIVE_API = "https://archive-api.open-meteo.com/v1/archive";
const ROSARIO = { lat: -32.9468, lon: -60.6393 };
const TIMEZONE = "America/Argentina/Cordoba";
const OUT_DIR = "public/data";
const CIVIL_DEFENSE_FILE = `${OUT_DIR}/civil-defense.json`;
const CLIMATOLOGY_FROM = 1940;
const DAYS_PER_MONTH = 30.4;
const IRLS_ITERATIONS = 50;
const IRLS_TOLERANCE = 1e-8;
const EULER_MASCHERONI = 0.5772156649;
const RETURN_PERIODS_YEARS = [2, 5, 10, 25, 50, 100];
const DAILY_THRESHOLDS_MM = [20, 30, 50];
const CANDIDATE_FEATURE_SETS = [["total"], ["max2h"], ["max2h", "total"]];
const ALL_FEATURES = ["max2h", "total"];

async function fetchArchive(params) {
  const query = new URLSearchParams({ latitude: String(ROSARIO.lat), longitude: String(ROSARIO.lon), timezone: TIMEZONE, ...params, models: "era5" });
  const response = await fetch(`${ARCHIVE_API}?${query}`);
  if (!response.ok) {
    throw new Error(`Open-Meteo archive returned ${response.status}`);
  }
  return response.json();
}

function lastDayOfMonth(month) {
  const [year, monthNumber] = month.split("-").map(Number);
  return `${month}-${String(new Date(Date.UTC(year, monthNumber, 0)).getUTCDate()).padStart(2, "0")}`;
}

function monthlyFeatures(hourly) {
  if (!Array.isArray(hourly?.time) || hourly.time.length === 0 || hourly.time.length !== hourly.precipitation?.length || hourly.precipitation.some((mm) => typeof mm !== "number" || !Number.isFinite(mm) || mm < 0)) throw new Error("The hourly archive has missing or invalid values; the model is not fitted on zeros.");
  const byMonth = new Map();
  hourly.time.forEach((hour, index) => {
    const month = hour.slice(0, 7);
    const mm = hourly.precipitation[index] ?? 0;
    const entry = byMonth.get(month) ?? { total: 0, max2h: 0, previous: 0 };
    const window = entry.previous + mm;
    byMonth.set(month, { total: entry.total + mm, max2h: Math.max(entry.max2h, window), previous: mm });
  });
  return Object.fromEntries([...byMonth].map(([month, { total, max2h }]) => [month, { total: Number(total.toFixed(1)), max2h: Number(max2h.toFixed(1)) }]));
}

function solve(matrix, vector) {
  const n = vector.length;
  const a = matrix.map((row, i) => [...row, vector[i]]);
  for (let col = 0; col < n; col += 1) {
    const pivot = a.slice(col).reduce((best, row, index) => (Math.abs(row[col]) > Math.abs(a[best][col]) ? index + col : best), col);
    [a[col], a[pivot]] = [a[pivot], a[col]];
    for (let row = 0; row < n; row += 1) {
      if (row !== col) {
        const factor = a[row][col] / a[col][col];
        a[row] = a[row].map((value, k) => value - factor * a[col][k]);
      }
    }
  }
  return a.map((row, i) => row[n] / row[i]);
}

function fitPoisson(rows, features) {
  const design = rows.map((row) => [1, ...features.map((feature) => row[feature])]);
  const y = rows.map((row) => row.cases);
  const k = design[0].length;
  let beta = new Array(k).fill(0);
  beta[0] = Math.log(Math.max(1e-3, y.reduce((sum, value) => sum + value, 0) / y.length));
  for (let iteration = 0; iteration < IRLS_ITERATIONS; iteration += 1) {
    const mu = design.map((x) => Math.exp(x.reduce((sum, value, j) => sum + value * beta[j], 0)));
    const gradient = new Array(k).fill(0);
    const hessian = Array.from({ length: k }, () => new Array(k).fill(0));
    design.forEach((x, i) => {
      for (let a = 0; a < k; a += 1) {
        gradient[a] += x[a] * (y[i] - mu[i]);
        for (let b = 0; b < k; b += 1) {
          hessian[a][b] += x[a] * x[b] * mu[i];
        }
      }
    });
    const step = solve(hessian, gradient);
    beta = beta.map((value, j) => value + step[j]);
    if (Math.max(...step.map(Math.abs)) < IRLS_TOLERANCE) {
      break;
    }
  }
  return beta;
}

function predictPoisson(beta, features, row) {
  return Math.exp(beta[0] + features.reduce((sum, feature, j) => sum + beta[j + 1] * row[feature], 0));
}

function evaluateCandidate(rows, features) {
  const beta = fitPoisson(rows, features);
  const looErrors = rows.map((held, index) => {
    const others = rows.filter((_, j) => j !== index);
    return Math.abs(held.cases - predictPoisson(fitPoisson(others, features), features, held));
  });
  return { features, beta, looMae: looErrors.reduce((sum, value) => sum + value, 0) / looErrors.length, plausible: beta.slice(1).every((value) => value >= 0) };
}

function deviance(rows, predict) {
  return 2 * rows.reduce((sum, row) => {
    const mu = predict(row);
    return sum + (row.cases > 0 ? row.cases * Math.log(row.cases / mu) : 0) - (row.cases - mu);
  }, 0);
}

function fitGumbel(maxima) {
  const n = maxima.length;
  const mean = maxima.reduce((sum, value) => sum + value, 0) / n;
  const variance = maxima.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (n - 1);
  const beta = (Math.sqrt(variance) * Math.sqrt(6)) / Math.PI;
  return { mu: mean - EULER_MASCHERONI * beta, beta, n };
}

function gumbelQuantile({ mu, beta }, returnPeriod) {
  return mu - beta * Math.log(-Math.log(1 - 1 / returnPeriod));
}

const civilDefense = JSON.parse(await readFile(CIVIL_DEFENSE_FILE, "utf8"));
const months = civilDefense.series.map((entry) => entry.month);
const [hourlyArchive, dailyArchive] = await Promise.all([
  fetchArchive({ start_date: `${months[0]}-01`, end_date: lastDayOfMonth(months[months.length - 1]), hourly: "precipitation" }),
  fetchArchive({ start_date: `${CLIMATOLOGY_FROM}-01-01`, end_date: `${new Date().getUTCFullYear() - 1}-12-31`, daily: "precipitation_sum" }),
]);

const features = monthlyFeatures(hourlyArchive.hourly);
const rows = civilDefense.series.map((entry) => ({ month: entry.month, cases: entry.cases, ...features[entry.month] })).filter((row) => Number.isFinite(row.max2h));
const candidates = CANDIDATE_FEATURE_SETS.map((features) => evaluateCandidate(rows, features));
const chosen = candidates.filter((candidate) => candidate.plausible).sort((a, b) => a.looMae - b.looMae)[0];
if (!chosen) {
  throw new Error("No candidate model has non-negative coefficients");
}
const { features: FEATURES, beta, looMae } = chosen;
const coefficients = Object.fromEntries(ALL_FEATURES.map((feature) => [feature, FEATURES.includes(feature) ? beta[FEATURES.indexOf(feature) + 1] : 0]));
const predict = (row) => predictPoisson(beta, FEATURES, row);
const nullMean = rows.reduce((sum, row) => sum + row.cases, 0) / rows.length;
const devianceModel = deviance(rows, predict);
const devianceNull = deviance(rows, () => nullMean);
const naiveMae = rows.reduce((sum, row) => sum + Math.abs(row.cases - nullMean), 0) / rows.length;

const cityTotal = Object.values(civilDefense.districts).reduce((sum, district) => sum + district.total, 0);
const districtShare = Object.fromEntries(
  Object.entries(civilDefense.districts).map(([district, { total }]) => [district, Number((total / cityTotal).toFixed(4))]),
);

const annualMaximaByYear = new Map();
const dailyByMonth = new Map();
dailyArchive.daily.time.forEach((date, index) => {
  const mm = dailyArchive.daily.precipitation_sum[index];
  if (mm === null || mm === undefined) {
    return;
  }
  const year = date.slice(0, 4);
  annualMaximaByYear.set(year, Math.max(annualMaximaByYear.get(year) ?? 0, mm));
  const month = Number(date.slice(5, 7));
  const bucket = dailyByMonth.get(month) ?? { days: 0, total: 0, over: DAILY_THRESHOLDS_MM.map(() => 0) };
  dailyByMonth.set(month, {
    days: bucket.days + 1,
    total: bucket.total + mm,
    over: bucket.over.map((count, t) => count + (mm >= DAILY_THRESHOLDS_MM[t] ? 1 : 0)),
  });
});
const annualMaxima = [...annualMaximaByYear].map(([year, mm]) => ({ year: Number(year), mm: Number(mm.toFixed(1)) }));
const gumbel = fitGumbel(annualMaxima.map((entry) => entry.mm));
const monthlyClimatology = [...dailyByMonth]
  .sort((a, b) => a[0] - b[0])
  .map(([month, bucket]) => ({
    month,
    meanMm: Number(((bucket.total / bucket.days) * DAYS_PER_MONTH).toFixed(1)),
    dayProbability: Object.fromEntries(DAILY_THRESHOLDS_MM.map((threshold, t) => [threshold, Number((bucket.over[t] / bucket.days).toFixed(4))])),
  }));

const output = {
  flooding: {
    name: "Anegamientos mensuales atendidos por Defensa Civil en función de la lluvia",
    formula: `λ = exp(β0${FEATURES.map((feature, j) => ` + β${j + 1}·${feature}`).join("")}) · días/30,4`,
    variables: { max2h: "mayor acumulado en 2 horas del período, mm", total: "lluvia total del período, mm" },
    usedVariables: FEATURES,
    candidates: candidates.map(({ features, looMae: mae, plausible }) => ({ variables: features, maeValidation: Number(mae.toFixed(1)), nonNegativeCoefficients: plausible })),
    coefficients: { intercept: beta[0], ...coefficients },
    n: rows.length,
    nullDeviance: Number(devianceNull.toFixed(1)),
    deviance: Number(devianceModel.toFixed(1)),
    pseudoR2: Number((1 - devianceModel / devianceNull).toFixed(3)),
    crossValidation: { maeModel: Number(looMae.toFixed(1)), maeMean: Number(naiveMae.toFixed(1)) },
    daysPerMonth: DAYS_PER_MONTH,
    districtShare,
    training: rows.map((row) => ({ ...row, predicted: Number(predict(row).toFixed(1)) })),
    rain: { source: "Open-Meteo archivo histórico (ERA5), horario", endpoint: ARCHIVE_API },
  },
  extremeRain: {
    name: "Máximo diario anual de lluvia, distribución de Gumbel",
    formula: "F(x) = exp(−exp(−(x − μ)/β)) · μ y β por momentos",
    gumbel: { mu: Number(gumbel.mu.toFixed(2)), beta: Number(gumbel.beta.toFixed(2)), n: gumbel.n },
    period: { from: annualMaxima[0].year, until: annualMaxima[annualMaxima.length - 1].year },
    quantiles: RETURN_PERIODS_YEARS.map((periodYears) => ({ periodYears, mm: Number(gumbelQuantile(gumbel, periodYears).toFixed(1)) })),
    annualMaxima,
    dailyThresholds: DAILY_THRESHOLDS_MM,
    monthlyClimatology,
    source: "Open-Meteo archivo histórico (ERA5), diario",
  },
  computedAt: new Date().toISOString(),
};
await writeFile(`${OUT_DIR}/models.json`, JSON.stringify(output, null, 2));

console.log(`candidates: ${candidates.map((c) => `[${c.features.join("+")}] LOO ${c.looMae.toFixed(1)}${c.plausible ? "" : " (negative coefficient)"}`).join(" · ")}`);
console.log(`chosen [${FEATURES.join("+")}] n=${rows.length} · β0 ${beta[0].toFixed(3)} · ${FEATURES.map((f, j) => `β_${f} ${beta[j + 1].toFixed(4)}`).join(" · ")} · pseudo-R² ${output.flooding.pseudoR2} · LOO MAE ${looMae.toFixed(1)} vs media ${naiveMae.toFixed(1)}`);
for (const row of rows.slice().sort((a, b) => b.cases - a.cases).slice(0, 6)) {
  console.log(`  ${row.month}: ${row.cases} cases · max2h ${row.max2h} mm · total ${row.total} mm · predicted ${predict(row).toFixed(0)}`);
}
console.log(`Gumbel μ ${gumbel.mu.toFixed(1)} β ${gumbel.beta.toFixed(1)} n=${gumbel.n} · quantiles ${output.extremeRain.quantiles.map((q) => `T${q.periodYears}=${q.mm}`).join(" ")}`);
console.log("climatology:", monthlyClimatology.map((m) => `${m.month}:${m.meanMm}mm/${(m.dayProbability[30] * 100).toFixed(1)}%`).join(" "));
