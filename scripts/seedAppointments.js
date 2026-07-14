import dbConnect from "../lib/dbConnect.js";

import PatientU from "../models/PatientU.js";
import TherapistU from "../models/TherapistU.js";
import Service from "../models/Service.js";
import DateModel from "../models/Date.js";

import generateAppointment from "./utils/generateAppointment.js";
import { clearOccupiedSlots } from "./utils/appointmentUtils.js";

await dbConnect();

console.log("=================================");
console.log(" Generando citas...");
console.log("=================================");

clearOccupiedSlots();

// Si vuelves a ejecutar el seeder, elimina las citas anteriores
await DateModel.deleteMany({});

// Reinicia el estado de cuenta
await PatientU.updateMany(
    {},
    {
        $set: {
            "estadoDeCuenta.total": 0,
            "estadoDeCuenta.citas": [],
            "estadoDeCuenta.pagos": [],
        },
    }
);

const patients = await PatientU.find();
const therapists = await TherapistU.find();
const services = await Service.find();

if (!patients.length) {

    console.log("No existen pacientes.");
    process.exit();

}

if (!therapists.length) {

    console.log("No existen terapeutas.");
    process.exit();

}

if (!services.length) {

    console.log("No existen servicios.");
    process.exit();

}

let totalAppointments = 0;

// Relación paciente -> terapeuta
const therapistMap = new Map();

for (const patient of patients) {

    const therapist =
        therapists[
            Math.floor(
                Math.random() * therapists.length
            )
        ];

    therapistMap.set(
        patient._id.toString(),
        therapist
    );

}

let currentPatient = 1;

for (const patient of patients) {

    const therapist =
        therapistMap.get(
            patient._id.toString()
        );

    // Entre 0 y 12 citas
    const appointmentCount =
        Math.floor(
            Math.random() * 13
        );

    console.log(
        `[${currentPatient}/${patients.length}] ${patient.firstName} ${patient.lastName} -> ${appointmentCount} citas`
    );

    for (
        let i = 0;
        i < appointmentCount;
        i++
    ) {

        const appointment =
            await generateAppointment({

                patient,

                therapist,

                services,

                appointmentIndex: i,

            });

        if (appointment) {

            totalAppointments++;

        }

    }

    currentPatient++;

}

console.log("");
console.log("=================================");
console.log(" Seeder finalizado");
console.log("=================================");
console.log(`Pacientes: ${patients.length}`);
console.log(`Terapeutas: ${therapists.length}`);
console.log(`Servicios: ${services.length}`);
console.log(`Citas creadas: ${totalAppointments}`);
console.log("=================================");