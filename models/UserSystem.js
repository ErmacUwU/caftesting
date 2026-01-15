import mongoose from "mongoose";

const userSystemSchema = new mongoose.Schema({
  idUserSystem:{type: String,required: true,},
  name: {type: String,required: true},
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["admin", "operador"], required: true },
}, { timestamps: true });

export default mongoose.models.UserSystem || mongoose.model("UserSystem", userSystemSchema);
