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

const EstadoDeCuentaSchema = new mongoose.Schema(
  {
    total: { type: Number, default: 0 }, // 🔹 Deuda total
    citas: [
      {
        fecha: { type: Date, required: true },
        costo: { type: Number, required: true },
      },
    ],
    pagos: [
      {
        fecha: { type: Date, default: Date.now },
        cantidad: { type: Number, required: true },
        metodoPago: { type: String, enum: ["efectivo", "tarjeta", "transferencia"], required: true },
      },
    ],
  },
  { _id: false }
);

const PatientSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserTrue",
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
      type: String,
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
    contacts: [ContactSchema],
    estadoDeCuenta: {
      type: EstadoDeCuentaSchema,
      default: () => ({}),
    },
  },
  { timestamps: true }
);

export default mongoose.models.PatientU || mongoose.model("PatientU", PatientSchema);
