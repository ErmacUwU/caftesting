import mongoose from "mongoose";
import { fakerES_MX } from "@faker-js/faker";

import dbConnect from "../lib/dbConnect.js";

import UserTrue from "../models/UserTrue.js";
import TherapistU from "../models/TherapistU.js";

import therapistSpecialties from "./utils/therapistSpecialties.js";
import {
  cities,
  state,
  country,
} from "./utils/bajaCalifornia.js";

import {
  DEFAULT_PASSWORD_HASH,
  TOTAL_THERAPISTS,
} from "./utils/constants.js";

import generatePhone from "./utils/generatePhone.js";

async function seedTherapists() {
  try {

    console.log("🚀 Generando terapeutas...");

    await dbConnect();

    // Eliminamos terapeutas y usuarios terapeutas previos
    await TherapistU.deleteMany({});

    await UserTrue.deleteMany({
      role: "therapist",
    });

    console.log("🗑 Registros anteriores eliminados");

    for (let i = 1; i <= TOTAL_THERAPISTS; i++) {

      const firstName = fakerES_MX.person.firstName();

      const lastName = fakerES_MX.person.lastName();

      const email =
        `${firstName}.${lastName}${i}@caf.com`
          .toLowerCase()
          .replace(/\s+/g, "");

      const specialization =
        fakerES_MX.helpers.arrayElement(
          therapistSpecialties
        );

      const city =
        fakerES_MX.helpers.arrayElement(cities);

      const user = await UserTrue.create({

        email,

        passwordHash: DEFAULT_PASSWORD_HASH,

        role: "therapist",

        isPatient: false,

        isTherapist: true,

        therapistProfile: null,

        patientProfile: null,

        isActive: true,

      });

      const therapist = await TherapistU.create({

        userId: user._id,

        firstName,

        lastName,

        phone: generatePhone(),

        specialization,

        address: fakerES_MX.location.streetAddress(),

        city,

        country,

      });

      user.therapistProfile = therapist._id;

      await user.save();

      console.log(
        `✔ ${firstName} ${lastName}`
      );

    }

    console.log("");
    console.log("✅ Seeder terminado correctamente.");

  } catch (error) {

    console.error(error);

  } finally {

    await mongoose.disconnect();

    console.log("🔌 MongoDB desconectado.");

  }
}

seedTherapists();