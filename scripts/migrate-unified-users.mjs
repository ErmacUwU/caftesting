import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import UserSystem from "../models/UserSystem.js";
import UserTrue from "../models/UserTrue.js";
import Patient from "../models/Patient.js";
import Therapist from "../models/Therapist.js";
import PatientU from "../models/PatientU.js";
import TherapistU from "../models/TherapistU.js";
import Appointment from "../models/Date.js";

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

function mapRole(role) {
  if (role === "operador") return "admin";
  if (["patient", "therapist", "admin"].includes(role)) return role;
  return "admin";
}

async function upsertUnifiedUser({ email, passwordHash, role, profile }) {
  if (!email) return null;
  const normalizedEmail = String(email).trim().toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    existing.role = mapRole(role || existing.role);
    existing.profile = { ...(existing.profile || {}), ...(profile || {}) };
    if (passwordHash) existing.passwordHash = passwordHash;
    await existing.save();
    return existing;
  }

  const user = await User.create({
    email: normalizedEmail,
    passwordHash: passwordHash || (await bcrypt.hash("ChangeMe123!", 10)),
    role: mapRole(role),
    profile: profile || {},
    isActive: true,
  });
  return user;
}

async function run() {
  if (!MONGO_URI) throw new Error("Define MONGODB_URI o MONGO_URI para migrar");
  await mongoose.connect(MONGO_URI);

  const usersByLegacyId = new Map();

  const patients = await Patient.find().lean();
  for (const p of patients) {
    const user = await upsertUnifiedUser({
      email: p.email,
      role: "patient",
      profile: {
        firstName: p.firstName,
        lastName: p.lastName,
        birthdate: p.birthdate,
        gender: p.gender,
        patientStatus: p.patientStatus,
        contacts: p.contacts || [],
      },
    });
    usersByLegacyId.set(String(p._id), user._id);
  }

  const therapists = await Therapist.find().lean();
  for (const t of therapists) {
    const user = await upsertUnifiedUser({
      email: t.email,
      role: "therapist",
      profile: {
        firstName: t.firstName,
        lastName: t.lastName,
        phone: t.phone,
        specialization: t.specialization,
        address: t.address,
        city: t.city,
        country: t.country,
      },
    });
    usersByLegacyId.set(String(t._id), user._id);
  }

  const legacySystem = await UserSystem.find().lean();
  for (const u of legacySystem) {
    await upsertUnifiedUser({
      email: u.email,
      passwordHash: u.passwordHash,
      role: u.role,
      profile: { firstName: u.name || "Usuario", lastName: "" },
    });
  }

  const legacyTrue = await UserTrue.find()
    .populate("patientProfile")
    .populate("therapistProfile")
    .lean();
  for (const u of legacyTrue) {
    const patientProfile = u.patientProfile;
    const therapistProfile = u.therapistProfile;
    await upsertUnifiedUser({
      email: u.email,
      passwordHash: u.passwordHash,
      role: u.role,
      profile: {
        firstName: patientProfile?.firstName || therapistProfile?.firstName || "",
        lastName: patientProfile?.lastName || therapistProfile?.lastName || "",
        phone: therapistProfile?.phone || "",
        specialization: therapistProfile?.specialization || "",
      },
    });
  }

  const appointments = await Appointment.find();
  for (const appt of appointments) {
    const newPatient = usersByLegacyId.get(String(appt.patient || appt.patientId));
    const newTherapist = usersByLegacyId.get(String(appt.therapist || appt.therapistId));
    if (newPatient) appt.patientId = newPatient;
    if (newTherapist) appt.therapistId = newTherapist;
    if (appt.patient) appt.patient = undefined;
    if (appt.therapist) appt.therapist = undefined;
    await appt.save();
  }

  console.log("Migracion completada");
  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error("Error de migracion:", err);
  await mongoose.disconnect();
  process.exit(1);
});
