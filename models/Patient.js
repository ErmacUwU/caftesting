import mongoose from "mongoose";

const PatientSchema = new mongoose.Schema(
  {
    idPatient:{
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
  },
  { timestamps: true }
);

export default mongoose.models.Patient ||
  mongoose.model("Patient", PatientSchema);
