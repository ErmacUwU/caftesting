import mongoose from "mongoose";

const ContactSchema = new mongoose.Schema(
  {
    firstName: String,
    lastName: String,
    middleName: String,
    phone: String,
    email: String,
    additionalPhone: String,
    sendReminders: {
      type: Boolean,
      default: false,
    },
    street: String,
    number: String,
    postalCode: String,
    neighborhood: String,
    city: String,
    state: String,
    country: String,
  },
  { _id: false } // Para que no se cree un ID adicional para cada contacto
);

const PatientSchema = new mongoose.Schema(
  {
    idPatient: {
      type: String,
      required: true,
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
    contacts: [ContactSchema], // Aquí añades el array de contactos
  },
  { timestamps: true }
);

export default mongoose.models.Patient ||
  mongoose.model("Patient", PatientSchema);
