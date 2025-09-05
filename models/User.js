import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["patient", "therapist"], required: true },
  refId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: "refType" },
  refType: { type: String, required: true, enum: ["Patient", "Therapist"] },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model("User", userSchema);
