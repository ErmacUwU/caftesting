const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  size: { type: Number, required: true },
  key: { type: String, required: true },
  therapist: { type: String, required: true },
  patient: { type: String, required: true },
  notes: { type: String },
  images: { type: [String] },
  url: { type: String }, // Agregado
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.models.File || mongoose.model("File", fileSchema);

