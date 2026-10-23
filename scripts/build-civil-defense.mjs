import { mkdir, writeFile } from "node:fs/promises";

const PORTAL = "https://datosabiertos.rosario.gob.ar/sites/default/files";
const ARCHIVE_API = "https://archive-api.open-meteo.com/v1/archive";
const ROSARIO = { lat: -32.9468, lon: -60.6393 };
const TIMEZONE = "America/Argentina/Cordoba";
const OUT_DIR = "public/data";
const FLOODING_PATTERN = /anegamiento/i;

const YEARLY_FILES = [
  { year: 2021, url: `${PORTAL}/uploaded_resources/intervenciones_acumuladas_defensa_civil._ano_2021.csv`, separator: ";", encoding: "latin1" },
  { year: 2022, url: `${PORTAL}/uploaded_resources/intervenciones_defensa_civil_ano_2022.csv`, separator: ",", encoding: "utf8" },
  { year: 2023, url: `${PORTAL}/uploaded_resources/Intervenciones%20Defensa%20Civil%20-%20A%C3%B1o%202023.csv`, separator: ",", encoding: "utf8" },
  { year: 2024, url: `${PORTAL}/uploaded_resources/Intervenciones%20Defensa%20Civil%20-%20A%C3%B1o%202024.csv`, separator: ",", encoding: "utf8" },
];

const POLYGON_FILES = [
  { output: "districts.json", url: `${PORTAL}/uploaded_resources/distritos_descentralizados_json.csv`, name: "DISTRITO", property: "district" },
  { output: "neighbourhoods.json", url: `${PORTAL}/resources/barrios_json.csv`, name: "BARRIO", property: "neighbourhood" },
];

const MONTH_NUMBER = {
  "enero": 1, "febrero": 2, "marzo": 3, "abril": 4, "mayo": 5, "junio": 6, "julio": 7, "agosto": 8, "septiembre": 9, "setiembre": 9, "octubre": 10, "noviembre": 11, "diciembre": 12,
};

function splitCsvLine(line, separator) {
  const cells = [];
  let current = "";
  let quote = null;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (quote) {
      if (char === quote && line[index + 1] === quote) {
        current += char;
        index += 1;
      } else if (char === quote) {
        quote = null;
      } else {
        current += char;
      }
    } else if (char === '"' || char === "'") {
      quote = char;
    } else if (char === separator) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
}

async function fetchText(url, encoding) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}`);
  }
  return new TextDecoder(encoding).decode(await response.arrayBuffer());
}

function monthOf(cell) {
  const numeric = Number(cell);
  if (Number.isInteger(numeric) && numeric >= 1 && numeric <= 12) {
    return numeric;
  }
  return MONTH_NUMBER[cell.toLowerCase()] ?? null;
}

function parseYear(text, { year, separator }) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const header = splitCsvLine(lines[0], separator).map((cell) => cell.toLowerCase());
  const typeIndex = header.findIndex((cell) => cell.includes("tipo"));
  const districtIndex = header.findIndex((cell) => cell.includes("distrito"));
  const countIndex = header.findIndex((cell) => cell.startsWith("cant"));
  const monthIndex = header.findIndex((cell) => cell === "mes");
  if (typeIndex < 0 || districtIndex < 0 || countIndex < 0 || monthIndex < 0) {
    throw new Error(`Unexpected columns in ${year}: ${header.join(" | ")}`);
  }
  return lines.slice(1).flatMap((line) => {
    const cells = splitCsvLine(line, separator);
    if (!FLOODING_PATTERN.test(cells[typeIndex] ?? "")) {
      return [];
    }
    const month = monthOf(cells[monthIndex]);
    if (month === null) {
      throw new Error(`Unreadable month in ${year}: ${line}`);
    }
    return [{ month: `${year}-${String(month).padStart(2, "0")}`, district: cells[districtIndex].toUpperCase(), cases: Number(cells[countIndex]) || 0 }];
  });
}

async function fetchMonthlyRain(from, until) {
  const params = new URLSearchParams({
    latitude: String(ROSARIO.lat),
    longitude: String(ROSARIO.lon),
    start_date: `${from}-01`,
    end_date: until,
    daily: "precipitation_sum",
    models: "era5",
    timezone: TIMEZONE,
  });
  const response = await fetch(`${ARCHIVE_API}?${params}`);
  if (!response.ok) {
    throw new Error(`Open-Meteo archive returned ${response.status}`);
  }
  const { daily } = await response.json();
  if (!Array.isArray(daily?.time) || daily.time.length === 0 || daily.time.length !== daily.precipitation_sum?.length || daily.precipitation_sum.some((mm) => typeof mm !== "number" || !Number.isFinite(mm) || mm < 0)) throw new Error("The rain archive has missing or invalid values; it is not rebuilt with zeros.");
  return daily.time.reduce((acc, day, index) => {
    const month = day.slice(0, 7);
    return { ...acc, [month]: (acc[month] ?? 0) + (daily.precipitation_sum[index] ?? 0) };
  }, {});
}

function lastDayOfMonth(month) {
  const [year, monthNumber] = month.split("-").map(Number);
  return `${month}-${String(new Date(Date.UTC(year, monthNumber, 0)).getUTCDate()).padStart(2, "0")}`;
}

function sumBy(rows, key) {
  return rows.reduce((acc, row) => ({ ...acc, [row[key]]: (acc[row[key]] ?? 0) + row.cases }), {});
}

function peakOf(months) {
  return months.reduce((best, month) => (best === null || month.cases > best.cases ? month : best), null);
}

async function buildPolygons({ output, url, name, property }) {
  const text = await fetchText(url, "utf8");
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const header = splitCsvLine(lines[0], ",");
  const nameIndex = header.indexOf(name);
  const geoIndex = header.indexOf("GEOJSON");
  const features = lines.slice(1).map((line) => {
    const cells = splitCsvLine(line, ",");
    const feature = JSON.parse(cells[geoIndex]);
    return { type: "Feature", properties: { [property]: cells[nameIndex].trim() }, geometry: feature.geometry };
  });
  await writeFile(`${OUT_DIR}/${output}`, JSON.stringify({ type: "FeatureCollection", features }));
  return features.length;
}

await mkdir(OUT_DIR, { recursive: true });

const rows = (
  await Promise.all(YEARLY_FILES.map(async (file) => parseYear(await fetchText(file.url, file.encoding), file)))
).flat();
const months = [...new Set(rows.map((row) => row.month))].sort();
const districts = [...new Set(rows.map((row) => row.district))].sort();
const rainByMonth = await fetchMonthlyRain(months[0], lastDayOfMonth(months[months.length - 1]));

const series = months.map((month) => {
  const monthRows = rows.filter((row) => row.month === month);
  return { month, rainMm: Number((rainByMonth[month] ?? 0).toFixed(1)), cases: monthRows.reduce((sum, row) => sum + row.cases, 0), byDistrict: sumBy(monthRows, "distrito") };
});

const monthsPerYear = months.reduce((acc, month) => {
  const year = month.slice(0, 4);
  return { ...acc, [year]: (acc[year] ?? 0) + 1 };
}, {});

const districtSummary = Object.fromEntries(
  districts.map((district) => {
    const districtSeries = series.map((month) => ({ month: month.month, cases: month.byDistrict[district] ?? 0, rainMm: month.rainMm }));
    const total = districtSeries.reduce((sum, month) => sum + month.cases, 0);
    const byYear = districtSeries.reduce((acc, month) => ({ ...acc, [month.month.slice(0, 4)]: (acc[month.month.slice(0, 4)] ?? 0) + month.cases }), {});
    return [district, { total, byYear, peakMonth: peakOf(districtSeries) }];
  }),
);

const cityTotal = series.reduce((sum, month) => sum + month.cases, 0);
const city = {
  total: cityTotal,
  byYear: series.reduce((acc, month) => ({ ...acc, [month.month.slice(0, 4)]: (acc[month.month.slice(0, 4)] ?? 0) + month.cases }), {}),
  peakMonth: peakOf(series.map(({ month, cases, rainMm }) => ({ month, cases, rainMm }))),
};

const output = {
  name: "Anegamientos transitorios atendidos por Defensa Civil, por distrito y mes",
  source: "Municipalidad de Rosario · Intervenciones Defensa Civil",
  endpoints: YEARLY_FILES.map((file) => file.url),
  rain: { source: "Open-Meteo archivo histórico (ERA5)", endpoint: ARCHIVE_API, point: ROSARIO },
  period: { from: months[0], until: months[months.length - 1] },
  monthsPerYear,
  districts: districtSummary,
  city,
  series,
  computedAt: new Date().toISOString(),
};
await writeFile(`${OUT_DIR}/civil-defense.json`, JSON.stringify(output, null, 2));

const polygonCounts = await Promise.all(POLYGON_FILES.map(buildPolygons));

console.log(`flooding ${months[0]} → ${months[months.length - 1]} · ${cityTotal} cases · months per year ${JSON.stringify(monthsPerYear)}`);
for (const district of districts) {
  const { total, byYear, peakMonth } = districtSummary[district];
  console.log(`${district.padEnd(9)} ${String(total).padStart(5)} · ${JSON.stringify(byYear)} · peak ${peakMonth.month} ${peakMonth.cases} cases / ${peakMonth.rainMm} mm`);
}
console.log(`city peak ${city.peakMonth.month}: ${city.peakMonth.cases} cases with ${city.peakMonth.rainMm} mm`);
console.log(`polygons: ${POLYGON_FILES.map((file, index) => `${file.output} ${polygonCounts[index]}`).join(" · ")}`);
