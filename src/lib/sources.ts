export interface SourceRef {
  id: string;
  organismo: string;
  descripcion: string;
  endpoint: string;
  portal: string;
  licencia: string;
}

export const ROSARIO = { lat: -32.9468, lon: -60.6393 } as const;

export const PARANA_GLOFAS_CELL = { lat: -32.975, lon: -60.675 } as const;

export const INA_STATION = "Rosario";

export const SOURCES: Record<string, SourceRef> = {
  ina: {
    id: "ina",
    organismo: "Instituto Nacional del Agua · Sistema de Información y Alerta Hidrológico",
    descripcion: "Altura del río, tendencia y niveles oficiales de alerta y evacuación",
    endpoint: "https://alerta.ina.gob.ar/geoserver/ows?service=WFS&typeName=public2:ultimas_alturas_con_timeseries",
    portal: "https://alerta.ina.gob.ar/pub/mapa",
    licencia: "Datos públicos del INA",
  },
  openMeteo: {
    id: "openMeteo",
    organismo: "Open-Meteo",
    descripcion: "Precipitación horaria pronosticada sobre Rosario",
    endpoint: "https://api.open-meteo.com/v1/forecast",
    portal: "https://open-meteo.com",
    licencia: "CC BY 4.0 · gratuito para uso no comercial",
  },
  glofas: {
    id: "glofas",
    organismo: "GloFAS · Copernicus, vía Open-Meteo",
    descripcion: "Caudal diario modelado del Paraná frente a Rosario",
    endpoint: "https://flood-api.open-meteo.com/v1/flood",
    portal: "https://global-flood.emergency.copernicus.eu",
    licencia: "CC BY 4.0 · gratuito para uso no comercial",
  },
  areas: {
    id: "areas",
    organismo: "Municipalidad de Rosario · Secretaría de Planeamiento",
    descripcion: "Polígonos oficiales de áreas inundables de las cuencas del Ludueña y del Saladillo",
    endpoint: "https://datosabiertos.rosario.gob.ar/sites/default/files/uploaded_resources/zonas_inundables_saladillo_json.csv",
    portal: "https://datosabiertos.rosario.gob.ar",
    licencia: "Datos abiertos municipales",
  },
};
