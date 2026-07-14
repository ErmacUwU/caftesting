/*
|--------------------------------------------------------------------------
| Agenda en memoria
|--------------------------------------------------------------------------
*/

const therapistOccupiedSlots = new Map();
const patientOccupiedSlots = new Map();

/*
|--------------------------------------------------------------------------
| Horarios de atención
|--------------------------------------------------------------------------
*/

export const AVAILABLE_HOURS = [
    8,
    9,
    10,
    11,
    12,
    13,
    14,
    15,
    16,
    17,
];

/*
|--------------------------------------------------------------------------
| Fecha aleatoria
|--------------------------------------------------------------------------
*/

export function randomClinicDate() {

    const start = new Date();
    start.setMonth(start.getMonth() - 6);

    const end = new Date();
    end.setDate(end.getDate() + 14);

    while (true) {

        const random = new Date(
            start.getTime() +
            Math.random() * (end.getTime() - start.getTime())
        );

        // Domingo = 0
        if (random.getDay() !== 0) {
            return random;
        }

    }

}

/*
|--------------------------------------------------------------------------
| Asignar una hora válida
|--------------------------------------------------------------------------
*/

export function assignHour(date) {

    const hour =
        AVAILABLE_HOURS[
            Math.floor(
                Math.random() * AVAILABLE_HOURS.length
            )
        ];

    date.setHours(hour);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);

    return date;

}

export function randomClinicDateTime() {

    return assignHour(
        randomClinicDate()
    );

}

/*
|--------------------------------------------------------------------------
| Calcular hora final
|--------------------------------------------------------------------------
*/

export function calculateEnd(start, duration) {

    const end = new Date(start);

    end.setMinutes(
        end.getMinutes() + duration
    );

    return end;

}

/*
|--------------------------------------------------------------------------
| Buscar servicio de evaluación
|--------------------------------------------------------------------------
*/

export function findEvaluationService(services) {

    const service = services.find(service => {

        const name = service.name.toLowerCase();

        return (

            name.includes("evalu") ||

            name.includes("valor") ||

            name.includes("inicial")

        );

    });

    return service ?? services[0];

}

/*
|--------------------------------------------------------------------------
| Servicio aleatorio
|--------------------------------------------------------------------------
*/

export function randomTherapyService(services) {

    return services[
        Math.floor(
            Math.random() * services.length
        )
    ];

}

/*
|--------------------------------------------------------------------------
| Verificar traslape
|--------------------------------------------------------------------------
*/

function hasOverlap(schedule, newStart, newEnd) {

    return schedule.some(appointment =>

        newStart < appointment.end &&

        newEnd > appointment.start

    );

}

/*
|--------------------------------------------------------------------------
| Terapeutas
|--------------------------------------------------------------------------
*/

export function isTherapistAvailable(
    therapistId,
    newStart,
    newEnd
) {

    const schedule =
        therapistOccupiedSlots.get(
            therapistId.toString()
        ) || [];

    return !hasOverlap(
        schedule,
        newStart,
        newEnd
    );

}

export function reserveTherapistSlot(
    therapistId,
    start,
    end
) {

    const key = therapistId.toString();

    const schedule =
        therapistOccupiedSlots.get(key) || [];

    schedule.push({
        start,
        end,
    });

    therapistOccupiedSlots.set(
        key,
        schedule
    );

}

/*
|--------------------------------------------------------------------------
| Pacientes
|--------------------------------------------------------------------------
*/

export function isPatientAvailable(
    patientId,
    newStart,
    newEnd
) {

    const schedule =
        patientOccupiedSlots.get(
            patientId.toString()
        ) || [];

    return !hasOverlap(
        schedule,
        newStart,
        newEnd
    );

}

export function reservePatientSlot(
    patientId,
    start,
    end
) {

    const key = patientId.toString();

    const schedule =
        patientOccupiedSlots.get(key) || [];

    schedule.push({
        start,
        end,
    });

    patientOccupiedSlots.set(
        key,
        schedule
    );

}

/*
|--------------------------------------------------------------------------
| Limpiar memoria
|--------------------------------------------------------------------------
*/

export function clearOccupiedSlots() {

    therapistOccupiedSlots.clear();

    patientOccupiedSlots.clear();

}