import mongoose from "mongoose";

const FileSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, required: true },
    size: { type: Number, required: true },
    key: { type: String },     
    url: { type: String },
    notes: { type: String },
    images: { type: [String], default: [] },

    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient" },
    therapistId: { type: mongoose.Schema.Types.ObjectId, ref: "Therapist" },
    patientName: { type: String },
    therapistName: { type: String },

    patient: { type: String },
    therapist: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.File || mongoose.model("File", FileSchema);
