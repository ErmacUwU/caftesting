import mongoose from 'mongoose';

const TherapistSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phone: {
    type: String,
    required: true,
  },
  specialization: String,
  address: String,
  city: String,
  country: String,
}, { timestamps: true });

export default mongoose.models.Therapist || mongoose.model('Therapist', TherapistSchema);
