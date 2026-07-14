import mongoose from "mongoose";
import { fakerES_MX } from "@faker-js/faker";

import dbConnect from "../lib/dbConnect.js";

import UserTrue from "../models/UserTrue.js";
import PatientU from "../models/PatientU.js";

import {
    cities,
    state,
    country
} from "./utils/bajaCalifornia.js";

import {
    DEFAULT_PASSWORD_HASH,
    TOTAL_PATIENTS,
    MIN_AGE,
    MAX_AGE
} from "./utils/constants.js";

import generatePhone from "./utils/generatePhone.js";
import generateBirthdate from "./utils/generateBirthdate.js";

async function seedPatients() {

    try {

        console.log("🚀 Generando pacientes...");

        await dbConnect();

        await PatientU.deleteMany({});

        await UserTrue.deleteMany({
            role: "patient"
        });

        console.log("🗑 Pacientes anteriores eliminados");

        for (let i = 1; i <= TOTAL_PATIENTS; i++) {

            const gender =
                fakerES_MX.helpers.arrayElement(["M", "F"]);

            const firstName =
                gender === "M"
                    ? fakerES_MX.person.firstName("male")
                    : fakerES_MX.person.firstName("female");

            const lastName =
                fakerES_MX.person.lastName();

            const city =
                fakerES_MX.helpers.arrayElement(cities);

            const email =
                `${firstName}.${lastName}${i}@caf.com`
                    .toLowerCase()
                    .replace(/\s/g, "");

            const user =
                await UserTrue.create({

                    email,

                    passwordHash: DEFAULT_PASSWORD_HASH,

                    role: "patient",

                    isPatient: true,

                    isTherapist: false,

                    patientProfile: null,

                    therapistProfile: null,

                    isActive: true

                });

            const patient =
                await PatientU.create({

                    userId: user._id,

                    firstName,

                    lastName,

                    birthdate: generateBirthdate(
                        MIN_AGE,
                        MAX_AGE
                    ),

                    gender,

                    patientStatus: "activo",

                    birthCity: city,

                    nationality: "Mexicano",

                    birthState: state,

                    idType: "CURP",

                    contacts: [

                        {

                            firstName:
                                fakerES_MX.person.firstName(),

                            lastName:
                                fakerES_MX.person.lastName(),

                            middleName: "",

                            phone:
                                generatePhone(),

                            email:
                                fakerES_MX.internet.email(),

                            additionalPhone:
                                generatePhone(),

                            sendReminders: true,

                            street:
                                fakerES_MX.location.street(),

                            number:
                                fakerES_MX.location.buildingNumber(),

                            postalCode:
                                fakerES_MX.location.zipCode(),

                            neighborhood:
                                fakerES_MX.location.secondaryAddress(),

                            city,

                            state,

                            country

                        }

                    ],

                    estadoDeCuenta: {

                        total: 0,

                        citas: [],

                        pagos: []

                    }

                });

            user.patientProfile = patient._id;

            await user.save();

            console.log(
                `✔ ${i}/${TOTAL_PATIENTS} ${firstName} ${lastName}`
            );

        }

        console.log("");
        console.log("🎉 Pacientes creados correctamente.");

    }
    catch (err) {

        console.error(err);

    }
    finally {

        await mongoose.disconnect();

        console.log("🔌 Mongo desconectado.");

    }

}

seedPatients();