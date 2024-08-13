import mongoose from "mongoose";

const DateSchema = new mongoose.Schema(
  {
    idDate: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    start: {
      type: Date,
      required: true,
    },
    end: {
      type: Date, // Asegúrate de manejar el formato de fecha adecuadamente
      required: true,
    },
    therapist: {
      type: String,
      required: true,
    },
    patient: {
      type: String,
      required: true,
    },
    title: String,
    description: String,
    cost:Number
  },
  { timestamps: true }
);

export default mongoose.models.Date ||
  mongoose.model("Date", DateSchema);
