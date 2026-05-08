import mongoose from "mongoose";
import UserTrue from "./UserTrue";

const fileSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, required: true },
    size: { type: Number, required: true },
    key: { type: String, required: true },
    url: { type: String, required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserTrue' },
    therapistId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserTrue' },
    notes: { type: String },
    images: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.models.File || mongoose.model("File", fileSchema);