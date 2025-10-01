import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, required: true },
    size: { type: Number, required: true },
    key: { type: String, required: true },
    url: { type: String, required: true },
    therapist: { type: String, required: true },
    patient: { type: String, required: true },
    notes: { type: String },
    images: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.models.File || mongoose.model("File", fileSchema);