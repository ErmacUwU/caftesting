const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Nombre del archivo
  type: { type: String, required: true }, // Tipo MIME
  size: { type: Number, required: true }, // Tamaño en bytes
  url: { type: String, required: true }, // Enlace en S3
  therapist: { type: String, required: true }, // Terapeuta
  patient: { type: String, required: true }, // Paciente
  notes: { type: String }, // Notas adicionales
  images: { type: [String] }, // Lista de URLs de imágenes subidas
  createdAt: { type: Date, default: Date.now }, // Fecha de creación
});

module.exports = mongoose.models.File || mongoose.model("File", fileSchema);