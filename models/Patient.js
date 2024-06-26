import mongoose from 'mongoose';

const PatientSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  birthdate: {
    type: String, // Puede ser String si vas a usar el formato DD/MM/AAAA
    required: true,
  },
  gender: {
    type: String,
    enum: ['M', 'F'],
    required: true,
  },
  id: {
    type: String,
    unique: true,
  },
  patientStatus: {
    type: String,
    enum: ['activo', 'inactivo'],
    default: 'activo',
    required: true,
  },
  birthCity: String,
  nationality: String,
  birthState: String,
  idType: String,
  consent: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

export default mongoose.models.Patient || mongoose.model('Patient', PatientSchema);
