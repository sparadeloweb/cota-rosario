export const ARGENTINA_TIMEZONE = "America/Argentina/Buenos_Aires";

const horaFormatter = new Intl.DateTimeFormat("es-AR", { timeZone: ARGENTINA_TIMEZONE, hour: "2-digit", minute: "2-digit", hour12: false });
const fechaHoraFormatter = new Intl.DateTimeFormat("es-AR", {
  timeZone: ARGENTINA_TIMEZONE,
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function horaArgentina(iso: string): string {
  const fecha = new Date(iso);
  return Number.isNaN(fecha.getTime()) ? "—" : horaFormatter.format(fecha);
}

export function fechaHoraArgentina(iso: string): string {
  const fecha = new Date(iso);
  return Number.isNaN(fecha.getTime()) ? "—" : fechaHoraFormatter.format(fecha).replace(",", "");
}
