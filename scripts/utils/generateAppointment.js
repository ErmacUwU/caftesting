import { randomUUID } from "crypto";

import DateModel from "../../models/Date.js";
import PatientU from "../../models/PatientU.js";

import {
    randomClinicDateTime,
    calculateEnd,
    findEvaluationService,
    randomTherapyService,
    isTherapistAvailable,
    reserveTherapistSlot,
    isPatientAvailable,
    reservePatientSlot,
} from "./appointmentUtils.js";

export default async function generateAppointment({

    patient,
    therapist,
    services,
    appointmentIndex,

}) {

    let service;

    if (appointmentIndex === 0) {

        service = findEvaluationService(services);

    } else {

        service = randomTherapyService(services);

    }

    let attempts = 0;

    while (attempts < 50) {

        attempts++;

        const start = randomClinicDateTime();

        const end = calculateEnd(
            start,
            service.duration
        );

        if (
            !isTherapistAvailable(
                therapist.userId,
                start,
                end
            )
        ) {
            continue;
        }

        if (
            !isPatientAvailable(
                patient.userId,
                start,
                end
            )
        ) {
            continue;
        }

        const appointment =
            await DateModel.create({

                idDate: randomUUID(),

                date: start,

                start,

                end,

                duration: service.duration,

                therapist: therapist.userId,

                patient: patient.userId,

                title: service.name,

                description: `${service.name} (Seed automático)`,

                cost: service.cost,

                serviceId: service._id,

            });

        await PatientU.findByIdAndUpdate(
            patient._id,
            {

                $inc: {
                    "estadoDeCuenta.total":
                        service.cost,
                },

                $push: {

                    "estadoDeCuenta.citas": {

                        fecha: start,

                        costo: service.cost,

                    },

                },

            }
        );

        reserveTherapistSlot(
            therapist.userId,
            start,
            end
        );

        reservePatientSlot(
            patient.userId,
            start,
            end
        );

        return appointment;

    }

    return null;

}