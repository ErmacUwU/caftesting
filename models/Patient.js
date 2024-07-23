import mongoose from "mongoose";

const ContactSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastNameP: {
      type: String,
      required: true,
    },
    lastNameM: String,
    phone: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    additionalPhone: String,
    sendReminders: {
      type: Boolean,
      default: false,
    },
    address: {
      street: String,
      number: String,
      postalCode: String,
      neighborhood: String,
      city: String,
      state: String,
      country: String,
    },
  },
  { _id: false } // No queremos un ID separado para cada contacto en este esquema
);

const PatientSchema = new mongoose.Schema(
  {
    idPatient: {
      type: String,
      required: true,
      unique: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    birthdate: {
      type: String, // Asegúrate de manejar el formato de fecha adecuadamente
      required: true,
    },
    gender: {
      type: String,
      enum: ["M", "F"],
      required: true,
    },
    patientStatus: {
      type: String,
      enum: ["activo", "inactivo"],
      required: true,
    },
    birthCity: String,
    nationality: String,
    birthState: String,
    idType: String,
    consent: {
      type: Boolean,
      required: true,
    },
    contacts: [ContactSchema], // Campo de contactos
  },
  { timestamps: true }
);

export default mongoose.models.Patient ||
  mongoose.model("Patient", PatientSchema);
