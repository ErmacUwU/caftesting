// Siembra citas de PRUEBA en el rango [hoy - 14 días, hoy + 14 días],
// distribuidas en distintos días/horarios/terapeutas/pacientes, con
// estados variados y >=2 series recurrentes semanales.
//
// A diferencia de scripts/seedAppointments.js, este script NO borra nada:
// solo agrega documentos nuevos. Reutiliza los mismos modelos y utilidades
// (scripts/utils/appointmentUtils.js) que ya usa el proyecto para sembrar
// datos, así que respeta las mismas reglas (sin domingos, horario 8-18h,
// sin traslapes de horario entre las citas generadas ni con las ya
// existentes en ese rango).
//
// Uso:
//   node scripts/seedRecentAppointments.js

import { randomUUID } from "crypto";

import dbConnect from "../lib/dbConnect.js";
import PatientU from "../models/PatientU.js";
import TherapistU from "../models/TherapistU.js";
import Service from "../models/Service.js";
import DateModel from "../models/Date.js";

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
const STANDALONE_COUNT = 24;
const RECURRING_SERIES = 3; // se pidieron al menos 2
const STATUSES = ["confirmada", "pendiente", "completada"];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function randomWeekdayInRange(rangeStart, rangeEnd) {
  const spanMs = rangeEnd.getTime() - rangeStart.getTime();
  while (true) {
    const d = new Date(rangeStart.getTime() + Math.random() * spanMs);
    d.setHours(0, 0, 0, 0);
    if (d.getDay() !== 0) return d; // sin domingos, igual que la app real
  }
}

function assignHour(date) {
  const hour = pick(AVAILABLE_HOURS);
  const d = new Date(date);
  d.setHours(hour, 0, 0, 0);
  return d;
}

// Pasado -> mayormente "completada"; futuro -> "confirmada"/"pendiente".
function statusForDate(start, today) {
  if (start < today) {
    return Math.random() < 0.8 ? "completada" : pick(STATUSES);
  }
  return Math.random() < 0.7 ? "confirmada" : "pendiente";
}

await dbConnect();

console.log("=================================");
console.log(" Sembrando citas de prueba (-14 / +14 días)");
console.log(" No se borra ni modifica ningún registro existente.");
console.log("=================================");

const [patients, therapists, services] = await Promise.all([
  PatientU.find(),
  TherapistU.find(),
  Service.find(),
]);

if (!patients.length) {
  console.log("No existen pacientes. Corre primero scripts/seedPatients.js");
  process.exit(1);
}
if (!therapists.length) {
  console.log("No existen terapeutas. Corre primero scripts/seedTherapists.js");
  process.exit(1);
}
if (!services.length) {
  console.log("No existen servicios. Corre primero scripts/seedServices.js");
  process.exit(1);
}

const today = startOfToday();
const rangeStart = new Date(today);
rangeStart.setDate(rangeStart.getDate() - DAYS_BACK);
const rangeEnd = new Date(today);
rangeEnd.setDate(rangeEnd.getDate() + DAYS_FORWARD + 1); // exclusivo (fin de día +14)

clearOccupiedSlots();

// Precarga las citas YA existentes en el rango para no chocar horarios con
// datos reales (así los registros reales se conservan intactos y las
// nuevas citas de prueba no se les empalman visualmente).
const existing = await DateModel.find({
  start: { $gte: rangeStart, $lt: rangeEnd },
})
  .select("therapist patient start end")
  .lean();

for (const appt of existing) {
  reserveTherapistSlot(appt.therapist, appt.start, appt.end);
  reservePatientSlot(appt.patient, appt.start, appt.end);
}

const docsToInsert = [];

function tryBuildAppointment({ patient, therapist, service, start }) {
  const end = calculateEnd(start, service.duration);

  if (!isTherapistAvailable(therapist.userId, start, end)) return null;
  if (!isPatientAvailable(patient.userId, start, end)) return null;

  reserveTherapistSlot(therapist.userId, start, end);
  reservePatientSlot(patient.userId, start, end);

  return {
    idDate: randomUUID(),
    date: start,
    start,
    end,
    duration: service.duration,
    therapist: therapist.userId,
    patient: patient.userId,
    title: service.name,
    description: `${service.name} (Seed de prueba)`,
    cost: service.cost,
    serviceId: service._id,
    status: statusForDate(start, today),
    recurrenceGroupId: null,
  };
}

// ---------------------------------------------------------------------------
// 1) Citas sueltas: distintos días/horarios/terapeutas/pacientes.
// ---------------------------------------------------------------------------
let standaloneCreated = 0;
let attempts = 0;

while (standaloneCreated < STANDALONE_COUNT && attempts < STANDALONE_COUNT * 25) {
  attempts++;
  const patient = pick(patients);
  const therapist = pick(therapists);
  const service =
    standaloneCreated % 6 === 0
      ? findEvaluationService(services)
      : randomTherapyService(services);
  const day = randomWeekdayInRange(rangeStart, rangeEnd);
  const start = assignHour(day);

  const doc = tryBuildAppointment({ patient, therapist, service, start });
  if (doc) {
    docsToInsert.push(doc);
    standaloneCreated++;
  }
}

// ---------------------------------------------------------------------------
// 2) Series recurrentes semanales (mismo recurrenceGroupId por serie).
// ---------------------------------------------------------------------------
let recurringCreated = 0;

for (let s = 0; s < RECURRING_SERIES; s++) {
  const patient = pick(patients);
  const therapist = pick(therapists);
  const service = randomTherapyService(services);
  const hour = pick(AVAILABLE_HOURS);
  const groupId = randomUUID();

  // Ancla la serie en un día entre semana dentro del rango y retrocede a la
  // primera ocurrencia semanal (misma hora) que aún cae dentro del rango.
  let anchor = randomWeekdayInRange(rangeStart, rangeEnd);
  anchor.setHours(hour, 0, 0, 0);
  while (true) {
    const prev = new Date(anchor);
    prev.setDate(prev.getDate() - 7);
    if (prev < rangeStart) break;
    anchor = prev;
  }

  let occurrence = new Date(anchor);
  let seriesCount = 0;

  while (occurrence < rangeEnd) {
    if (occurrence.getDay() !== 0) {
      const doc = tryBuildAppointment({
        patient,
        therapist,
        service,
        start: new Date(occurrence),
      });
      if (doc) {
        doc.recurrenceGroupId = groupId;
        docsToInsert.push(doc);
        seriesCount++;
        recurringCreated++;
      }
    }
    const next = new Date(occurrence);
    next.setDate(next.getDate() + 7);
    occurrence = next;
  }

  console.log(
    `Serie recurrente #${s + 1} (grupo ${groupId}): ${patient.firstName} ${patient.lastName} + ${therapist.firstName} ${therapist.lastName} -> ${seriesCount} ocurrencias`
  );
}

if (docsToInsert.length === 0) {
  console.log("No se pudo generar ninguna cita (horarios muy ocupados). Intenta correr el script de nuevo.");
  process.exit(0);
}

const inserted = await DateModel.insertMany(docsToInsert);

console.log("");
console.log("=================================");
console.log(" Seed de citas de prueba finalizado");
console.log("=================================");
console.log(
  `Rango: ${rangeStart.toISOString().split("T")[0]} .. ${new Date(rangeEnd.getTime() - 1).toISOString().split("T")[0]}`
);
console.log(`Citas sueltas creadas: ${standaloneCreated}`);
console.log(`Citas recurrentes creadas: ${recurringCreated} (en ${RECURRING_SERIES} series)`);
console.log(`Total insertado: ${inserted.length}`);
console.log("=================================");

process.exit(0);
