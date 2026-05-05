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
      type: Date, 
      required: true,
    },
    duration: {
      type: Number,
      required: true,
      min: 0,
      max: 120,
    },
    therapist: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "UserTrue", // Cambiado de "Therapist" a "UserTrue"
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "UserTrue", // Cambiado de "Patient" a "UserTrue"
    },
    title: String,
    description: String,
    cost:Number,
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service"
    },
  },
  { timestamps: true }
);

export default mongoose.models.Date ||
  mongoose.model("Date", DateSchema);
