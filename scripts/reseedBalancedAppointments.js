// Limpia el sembrado de prueba anterior (el lote de ~37 citas de
// scripts/seedRecentAppointments.js y el lote masivo de ~2,020 citas de
// scripts/fillCalendarDensely.js) y genera un lote NUEVO, balanceado, en su
// lugar — corrigiendo el bug de zona horaria que tenían ambos scripts.
//
// BUG CORREGIDO: los scripts anteriores armaban la hora con
// `Date.prototype.setHours()`, que usa la zona horaria LOCAL del proceso
// que corre el script (en este entorno, UTC+8), no la zona horaria de la
// clínica (America/Tijuana, UTC-7/-8). Eso guardaba cada cita ~8 horas
// desplazada, así que una cita pensada para las 9:00 AM terminaba
// renderizándose cerca de las 5:00 PM en la app. Aquí se usa
// zonedTimeToUtc() de lib/clinicTime.js — la MISMA función que ya usa
// app/citas/page.jsx y app/components/ActualizarCitas.jsx al crear/editar
// citas desde la UI — para que el dato quede guardado exactamente igual
// que si un usuario lo hubiera creado a mano.
//
// No borra ni toca citas reales ni el lote histórico del seeder original
// (scripts/seedAppointments.js, que marca su description con
// "Seed automático"): solo elimina documentos cuya description contiene
// "(Seed de prueba" (la marca que usaban ambos scripts anteriores).
//
// Uso:
//   node scripts/reseedBalancedAppointments.js

import { randomUUID } from "crypto";

import dbConnect from "../lib/dbConnect.js";
import PatientU from "../models/PatientU.js";
import TherapistU from "../models/TherapistU.js";
import Service from "../models/Service.js";
import DateModel from "../models/Date.js";
import { CLINIC_TIMEZONE, zonedTimeToUtc, getZonedParts } from "../lib/clinicTime.js";

import {
  AVAILABLE_HOURS,
  calculateEnd,
  findEvaluationService,
  randomTherapyService,
  isTherapistAvailable,
  reserveTherapistSlot,
  isPatientAvailable,
  reservePatientSlot,
  clearOccupiedSlots,
} from "./utils/appointmentUtils.js";

const DAYS_BACK = 14;
const DAYS_FORWARD = 14;
const FILL_PROBABILITY = 0.4; // densidad moderada objetivo: 35%-45%
const MAX_PATIENT_ATTEMPTS = 15;
const RECURRING_SERIES = 3; // se pidieron al menos 2
const STATUSES = ["confirmada", "pendiente", "completada"];
const SEED_MARK = "(Seed de prueba - equilibrado)";

function pad2(n) {
  return String(n).padStart(2, "0");
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Todo el manejo de "qué día es hoy / sumar días" se hace sobre strings
// "YYYY-MM-DD" con aritmética anclada en UTC (Date.UTC), nunca con
// setHours/getHours locales — así el resultado no depende de en qué zona
// horaria esté la máquina que corre el script.
function todayDateStringInClinic() {
  const { year, month, day } = getZonedParts(new Date(), CLINIC_TIMEZONE);
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function addDaysToDateString(dateStr, days) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`;
}

function weekdayOf(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = domingo
}

function randomWeekdayInRange(minDateStr, maxDateStrExclusive) {
  const [y1, m1, d1] = minDateStr.split("-").map(Number);
  const [y2, m2, d2] = maxDateStrExclusive.split("-").map(Number);
  const startMs = Date.UTC(y1, m1 - 1, d1);
  const endMs = Date.UTC(y2, m2 - 1, d2);
  while (true) {
    const randomMs = startMs + Math.random() * (endMs - startMs);
    const d = new Date(randomMs);
    const dateStr = `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
    if (weekdayOf(dateStr) !== 0) return dateStr; // sin domingos, igual que la app real
  }
}

function statusForDate(start, todayInstant) {
  if (start < todayInstant) {
    return Math.random() < 0.8 ? "completada" : STATUSES[Math.floor(Math.random() * STATUSES.length)];
  }
  return Math.random() < 0.7 ? "confirmada" : "pendiente";
}

await dbConnect();

console.log("=================================");
console.log(" 1) Limpiando el sembrado de prueba anterior");
console.log("=================================");

const cleanup = await DateModel.deleteMany({ description: { $regex: /\(Seed de prueba/ } });
console.log(`Citas de prueba anteriores eliminadas: ${cleanup.deletedCount}`);

console.log("");
console.log("=================================");
console.log(" 2) Sembrando lote balanceado (-14 / +14 días, zona horaria corregida)");
console.log("=================================");

const [patients, therapists, services] = await Promise.all([
  PatientU.find(),
  TherapistU.find(),
  Service.find(),
]);

if (!patients.length || !therapists.length || !services.length) {
  console.log("Faltan pacientes, terapeutas o servicios en la base de datos.");
  process.exit(1);
}

const todayDateStr = todayDateStringInClinic();
const rangeStartDateStr = addDaysToDateString(todayDateStr, -DAYS_BACK);
const rangeEndDateStrExclusive = addDaysToDateString(todayDateStr, DAYS_FORWARD + 1);
const todayInstant = zonedTimeToUtc(todayDateStr, "00:00", CLINIC_TIMEZONE);
const rangeStartInstant = zonedTimeToUtc(rangeStartDateStr, "00:00", CLINIC_TIMEZONE);
const rangeEndInstant = zonedTimeToUtc(rangeEndDateStrExclusive, "00:00", CLINIC_TIMEZONE);

clearOccupiedSlots();

// Precarga lo que quede en el rango (reales + lo que no se haya limpiado)
// para no chocar horarios con ellas.
const existing = await DateModel.find({
  start: { $gte: rangeStartInstant, $lt: rangeEndInstant },
})
  .select("therapist patient start end")
  .lean();

for (const appt of existing) {
  reserveTherapistSlot(appt.therapist, appt.start, appt.end);
  reservePatientSlot(appt.patient, appt.start, appt.end);
}

console.log(`Citas ya existentes en el rango (reales u otras): ${existing.length}`);

// Días hábiles del rango (sin domingo).
const workingDays = [];
for (let d = rangeStartDateStr; d !== rangeEndDateStrExclusive; d = addDaysToDateString(d, 1)) {
  if (weekdayOf(d) !== 0) workingDays.push(d);
}

const docsToInsert = [];
let slotsConsidered = 0;
let slotsAlreadyBusy = 0;
let slotsSkippedByChance = 0;
let slotsNoPatientFound = 0;

// ---------------------------------------------------------------------------
// Relleno con densidad moderada: para cada día hábil x terapeuta x hora
// disponible, con FILL_PROBABILITY de probabilidad se agenda una cita
// (nunca dos veces el mismo terapeuta a la misma hora — se comprueba
// disponibilidad antes de reservar).
// ---------------------------------------------------------------------------
for (const dateStr of workingDays) {
  for (const therapist of therapists) {
    for (const hour of AVAILABLE_HOURS) {
      slotsConsidered++;

      if (Math.random() > FILL_PROBABILITY) {
        slotsSkippedByChance++;
        continue;
      }

      const service = randomTherapyService(services);
      // Instante real (hora de la clínica), vía zonedTimeToUtc — igual que
      // hace la propia app al crear una cita desde la UI.
      const start = zonedTimeToUtc(dateStr, `${pad2(hour)}:00`, CLINIC_TIMEZONE);
      const end = calculateEnd(start, service.duration);

      if (!isTherapistAvailable(therapist.userId, start, end)) {
        slotsAlreadyBusy++;
        continue;
      }

      const candidates = shuffle(patients).slice(0, MAX_PATIENT_ATTEMPTS);
      let chosenPatient = null;
      for (const candidate of candidates) {
        if (isPatientAvailable(candidate.userId, start, end)) {
          chosenPatient = candidate;
          break;
        }
      }

      if (!chosenPatient) {
        slotsNoPatientFound++;
        continue;
      }

      reserveTherapistSlot(therapist.userId, start, end);
      reservePatientSlot(chosenPatient.userId, start, end);

      docsToInsert.push({
        idDate: randomUUID(),
        date: start,
        start,
        end,
        duration: service.duration,
        therapist: therapist.userId,
        patient: chosenPatient.userId,
        title: service.name,
        description: `${service.name} ${SEED_MARK}`,
        cost: service.cost,
        serviceId: service._id,
        status: statusForDate(start, todayInstant),
        recurrenceGroupId: null,
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Series recurrentes semanales (mismo recurrenceGroupId por serie).
// ---------------------------------------------------------------------------
let recurringCreated = 0;

for (let s = 0; s < RECURRING_SERIES; s++) {
  const patient = pick(patients);
  const therapist = pick(therapists);
  const service = randomTherapyService(services);
  const hour = pick(AVAILABLE_HOURS);
  const groupId = randomUUID();

  let anchor = randomWeekdayInRange(rangeStartDateStr, rangeEndDateStrExclusive);
  while (true) {
    const prev = addDaysToDateString(anchor, -7);
    if (prev < rangeStartDateStr) break;
    anchor = prev;
  }

  let occurrenceDateStr = anchor;
  let seriesCount = 0;

  while (occurrenceDateStr < rangeEndDateStrExclusive) {
    if (weekdayOf(occurrenceDateStr) !== 0) {
      const start = zonedTimeToUtc(occurrenceDateStr, `${pad2(hour)}:00`, CLINIC_TIMEZONE);
      const end = calculateEnd(start, service.duration);

      if (
        isTherapistAvailable(therapist.userId, start, end) &&
        isPatientAvailable(patient.userId, start, end)
      ) {
        reserveTherapistSlot(therapist.userId, start, end);
        reservePatientSlot(patient.userId, start, end);

        docsToInsert.push({
          idDate: randomUUID(),
          date: start,
          start,
          end,
          duration: service.duration,
          therapist: therapist.userId,
          patient: patient.userId,
          title: service.name,
          description: `${service.name} ${SEED_MARK}`,
          cost: service.cost,
          serviceId: service._id,
          status: statusForDate(start, todayInstant),
          recurrenceGroupId: groupId,
        });
        seriesCount++;
        recurringCreated++;
      }
    }
    occurrenceDateStr = addDaysToDateString(occurrenceDateStr, 7);
  }

  console.log(
    `Serie recurrente #${s + 1} (grupo ${groupId}): ${patient.firstName} ${patient.lastName} + ${therapist.firstName} ${therapist.lastName} -> ${seriesCount} ocurrencias`
  );
}

if (docsToInsert.length > 0) {
  await DateModel.insertMany(docsToInsert);
}

const totalSlots = slotsConsidered;
const totalOccupiedAfter = existing.length + docsToInsert.length;

console.log("");
console.log("=================================");
console.log(" Resembrado balanceado finalizado");
console.log("=================================");
console.log(`Rango (hora de la clínica, ${CLINIC_TIMEZONE}): ${rangeStartDateStr} .. ${addDaysToDateString(rangeEndDateStrExclusive, -1)}`);
console.log(`Días hábiles: ${workingDays.length} | Terapeutas: ${therapists.length} | Horas/día: ${AVAILABLE_HOURS.length}`);
console.log(`Slots evaluados (día x terapeuta x hora): ${totalSlots}`);
console.log(`  - Ya ocupados al momento de sembrar: ${slotsAlreadyBusy}`);
console.log(`  - Omitidos al azar (para no saturar): ${slotsSkippedByChance}`);
console.log(`  - Sin paciente libre disponible: ${slotsNoPatientFound}`);
console.log(`Citas nuevas creadas: ${docsToInsert.length} (incluye ${recurringCreated} de las ${RECURRING_SERIES} series recurrentes)`);
console.log(`Ocupación resultante en el rango: ${((totalOccupiedAfter / totalSlots) * 100).toFixed(1)}%`);
console.log("=================================");

process.exit(0);
