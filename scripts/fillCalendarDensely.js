// Rellena DENSAMENTE la agenda en el rango [hoy - 14 días, hoy + 14 días]:
// para (casi) cada combinación día hábil x terapeuta x hora disponible se
// crea una cita, de modo que al navegar el calendario en ese rango se vea
// casi completamente lleno.
//
// No borra nada: primero carga las citas YA existentes en ese rango
// (reales + las sembradas por scripts/seedRecentAppointments.js) y respeta
// esos horarios ocupados; solo llena los huecos que quedan libres.
//
// Uso:
//   node scripts/fillCalendarDensely.js

import { randomUUID } from "crypto";

import dbConnect from "../lib/dbConnect.js";
import PatientU from "../models/PatientU.js";
import TherapistU from "../models/TherapistU.js";
import Service from "../models/Service.js";
import DateModel from "../models/Date.js";

import {
  AVAILABLE_HOURS,
  calculateEnd,
  randomTherapyService,
  isTherapistAvailable,
  reserveTherapistSlot,
  isPatientAvailable,
  reservePatientSlot,
  clearOccupiedSlots,
} from "./utils/appointmentUtils.js";

const DAYS_BACK = 14;
const DAYS_FORWARD = 14;
const FILL_PROBABILITY = 0.9; // "casi todos los espacios" llenos, no el 100%
const MAX_PATIENT_ATTEMPTS = 15; // reintentos para hallar un paciente libre en ese horario
const STATUSES = ["confirmada", "pendiente", "completada"];

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function statusForDate(start, today) {
  if (start < today) {
    return Math.random() < 0.8 ? "completada" : STATUSES[Math.floor(Math.random() * STATUSES.length)];
  }
  return Math.random() < 0.7 ? "confirmada" : "pendiente";
}

await dbConnect();

console.log("=================================");
console.log(" Rellenando la agenda densamente (-14 / +14 días)");
console.log(" No se borra ni modifica ningún registro existente.");
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

const today = startOfToday();
const rangeStart = new Date(today);
rangeStart.setDate(rangeStart.getDate() - DAYS_BACK);
const rangeEnd = new Date(today);
rangeEnd.setDate(rangeEnd.getDate() + DAYS_FORWARD + 1); // exclusivo

clearOccupiedSlots();

// Carga TODAS las citas ya existentes en el rango (reales + sembradas
// antes) para no chocar horarios con ellas.
const existing = await DateModel.find({
  start: { $gte: rangeStart, $lt: rangeEnd },
})
  .select("therapist patient start end")
  .lean();

for (const appt of existing) {
  reserveTherapistSlot(appt.therapist, appt.start, appt.end);
  reservePatientSlot(appt.patient, appt.start, appt.end);
}

console.log(`Citas ya existentes en el rango: ${existing.length}`);

// Días hábiles del rango (sin domingo, igual que el resto de la app).
const workingDays = [];
for (let d = new Date(rangeStart); d < rangeEnd; d.setDate(d.getDate() + 1)) {
  if (d.getDay() !== 0) workingDays.push(new Date(d));
}

const docsToInsert = [];
let slotsConsidered = 0;
let slotsSkippedByChance = 0;
let slotsAlreadyBusy = 0;
let slotsNoPatientFound = 0;

for (const day of workingDays) {
  for (const therapist of therapists) {
    for (const hour of AVAILABLE_HOURS) {
      slotsConsidered++;

      const start = new Date(day);
      start.setHours(hour, 0, 0, 0);

      // Duración provisional (la de un servicio típico) solo para
      // comprobar disponibilidad del terapeuta a esta hora.
      if (!isTherapistAvailable(therapist.userId, start, new Date(start.getTime() + 30 * 60000))) {
        slotsAlreadyBusy++;
        continue;
      }

      if (Math.random() > FILL_PROBABILITY) {
        slotsSkippedByChance++;
        continue;
      }

      const service = randomTherapyService(services);
      const end = calculateEnd(start, service.duration);

      // Vuelve a comprobar con la duración real del servicio elegido.
      if (!isTherapistAvailable(therapist.userId, start, end)) {
        slotsAlreadyBusy++;
        continue;
      }

      // Busca un paciente libre a esa hora (varios intentos al azar).
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
        description: `${service.name} (Seed de prueba - relleno denso)`,
        cost: service.cost,
        serviceId: service._id,
        status: statusForDate(start, today),
        recurrenceGroupId: null,
      });
    }
  }
}

if (docsToInsert.length > 0) {
  await DateModel.insertMany(docsToInsert);
}

console.log("");
console.log("=================================");
console.log(" Relleno denso finalizado");
console.log("=================================");
console.log(
  `Rango: ${rangeStart.toISOString().split("T")[0]} .. ${new Date(rangeEnd.getTime() - 1).toISOString().split("T")[0]}`
);
console.log(`Días hábiles: ${workingDays.length}`);
console.log(`Terapeutas: ${therapists.length} | Horas/día: ${AVAILABLE_HOURS.length}`);
console.log(`Slots evaluados (día x terapeuta x hora): ${slotsConsidered}`);
console.log(`  - Ya ocupados (reales o sembrados antes): ${slotsAlreadyBusy}`);
console.log(`  - Omitidos al azar (para no llegar al 100%): ${slotsSkippedByChance}`);
console.log(`  - Sin paciente libre disponible: ${slotsNoPatientFound}`);
console.log(`Citas nuevas creadas: ${docsToInsert.length}`);
console.log(`Ocupación resultante en el rango: ${(((existing.length + docsToInsert.length) / slotsConsidered) * 100).toFixed(1)}%`);
console.log("=================================");

process.exit(0);
