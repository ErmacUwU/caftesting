// Utilidades de zona horaria para que TODOS los usuarios (sin importar en qué
// país/zona horaria esté su navegador) vean y creen las citas en la misma
// hora de pared de la clínica. Se apoya únicamente en Intl.DateTimeFormat
// (ya disponible en Node/navegadores modernos), sin dependencias nuevas.

export const CLINIC_TIMEZONE = "America/Tijuana";

const pad2 = (n) => String(n).padStart(2, "0");

// Offset (en ms) de `timeZone` respecto a UTC en el instante `date`.
// Positivo si la zona va "adelante" de UTC, negativo si va "atrás".
function getTimeZoneOffsetMs(date, timeZone) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const parts = dtf.formatToParts(date).reduce((acc, { type, value }) => {
    if (type !== "literal") acc[type] = value;
    return acc;
  }, {});

  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );

  return asUtc - date.getTime();
}

// Convierte una fecha/hora "de pared" ("YYYY-MM-DD", "HH:mm") tal como se
// vive en `timeZone`, al instante UTC real que representa. Es la función
// que se debe usar al GUARDAR lo que el usuario escribió/seleccionó.
export function zonedTimeToUtc(dateStr, timeStr, timeZone = CLINIC_TIMEZONE) {
  if (!dateStr || !timeStr) return null;
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hour, minute] = timeStr.split(":").map(Number);
  if (!year || !month || !day || Number.isNaN(hour) || Number.isNaN(minute)) {
    return null;
  }

  const naiveUtcMs = Date.UTC(year, month - 1, day, hour, minute, 0);
  const offset = getTimeZoneOffsetMs(new Date(naiveUtcMs), timeZone);
  return new Date(naiveUtcMs - offset);
}

// Dado un instante real (Date), devuelve sus componentes de fecha/hora
// "de pared" tal como se ven en `timeZone`.
export function getZonedParts(date, timeZone = CLINIC_TIMEZONE) {
  const offset = getTimeZoneOffsetMs(date, timeZone);
  const shifted = new Date(date.getTime() + offset);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
    weekday: shifted.getUTCDay(),
  };
}

export function formatZonedDate(date, timeZone = CLINIC_TIMEZONE) {
  const { year, month, day } = getZonedParts(date, timeZone);
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

export function formatZonedTime(date, timeZone = CLINIC_TIMEZONE) {
  const { hour, minute } = getZonedParts(date, timeZone);
  return `${pad2(hour)}:${pad2(minute)}`;
}

// FullCalendar, sin el plugin de moment-timezone, solo entiende 'local' o
// 'UTC'. Este helper "disfraza" un instante real como si su hora de pared
// en `timeZone` FUERA la hora UTC, para que al renderizar el calendario con
// timeZone="UTC" TODOS los visitantes vean la misma hora, sin importar su
// propia zona horaria de navegador.
export function toFullCalendarDate(date, timeZone = CLINIC_TIMEZONE) {
  const offset = getTimeZoneOffsetMs(date, timeZone);
  return new Date(date.getTime() + offset);
}

// Inverso de toFullCalendarDate: reconstruye el instante UTC real a partir
// de una fecha que FullCalendar entregó (dateClick/eventDrop) mientras
// corre en timeZone="UTC" con eventos "disfrazados" por toFullCalendarDate.
export function fromFullCalendarDate(fcDate, timeZone = CLINIC_TIMEZONE) {
  const dateStr = `${fcDate.getUTCFullYear()}-${pad2(fcDate.getUTCMonth() + 1)}-${pad2(fcDate.getUTCDate())}`;
  const timeStr = `${pad2(fcDate.getUTCHours())}:${pad2(fcDate.getUTCMinutes())}`;
  return zonedTimeToUtc(dateStr, timeStr, timeZone);
}
