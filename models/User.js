import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["patient", "therapist","operador","admin"], required: true },
  refId: { type: mongoose.Schema.Types.ObjectId, refPath: "refType" },
  refType: { type: String, enum: ["Patient", "Therapist"] },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model("User", userSchema);
