import mongoose from "mongoose";

const UserTrueSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },

  role: {
    type: String,
    enum: ["patient", "therapist", "admin", "operador"],
    required: true,
  },

  isPatient: { type: Boolean, default: false },
  isTherapist: { type: Boolean, default: false },

  patientProfile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PatientU",
    default: null,
  },

  therapistProfile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TherapistU",
    default: null,
  },

  isActive: { type: Boolean, default: true },
}, { timestamps: true });


export default mongoose.models.UserTrue || mongoose.model("UserTrue", UserTrueSchema);
