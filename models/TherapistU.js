import mongoose from "mongoose";

const TherapistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserTrue",
      required: true,
      unique: true,
    },

    firstName: {
    type: String,
    required: true,
},
  lastName: {
    type: String,
    required: true,
  },
    phone: {
    type: String,
    required: true,
  },
    specialization: String,
    address: String,
    city: String,
    country: String,
  },
  { timestamps: true }
);

export default mongoose.models.TherapistU || mongoose.model("TherapistU", TherapistSchema);
