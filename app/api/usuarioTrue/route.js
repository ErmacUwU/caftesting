import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/dbConnect";

import UserTrue from "@/models/UserTrue";
import PatientU from "@/models/PatientU";
import TherapistU from "@/models/TherapistU";

export async function POST(req) {
  try {
    await dbConnect();

    const body = await req.json();
    const { email, password, role, patientData, therapistData } = body;

    // 🔴 Validación base
    if (!email || !password || !role) {
      return NextResponse.json(
        { error: "Datos incompletos" },
        { status: 400 }
      );
    }

    // 🔴 Evitar emails duplicados
    const exists = await UserTrue.findOne({ email });
    if (exists) {
      return NextResponse.json(
        { error: "El email ya está registrado" },
        { status: 409 }
      );
    }

    // 🔴 Validaciones por rol (ANTES de crear)
    if (role === "patient") {
      if (!patientData) {
        return NextResponse.json(
          { error: "patientData es requerido" },
          { status: 400 }
        );
      }

      const { firstName, lastName, birthdate, gender } = patientData;
      if (!firstName || !lastName || !birthdate || !gender) {
        return NextResponse.json(
          { error: "Datos obligatorios de paciente faltantes" },
          { status: 400 }
        );
      }
    }

    if (role === "therapist") {
      if (!therapistData) {
        return NextResponse.json(
          { error: "therapistData es requerido" },
          { status: 400 }
        );
      }

      const { firstName, lastName, phone } = therapistData;
      if (!firstName || !lastName || !phone) {
        return NextResponse.json(
          { error: "Datos obligatorios de terapeuta faltantes" },
          { status: 400 }
        );
      }
    }

    // 🔐 Hash de contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // 1️⃣ Crear usuario base
    const user = await UserTrue.create({
      email,
      passwordHash,
      role,
      isPatient: false,
      isTherapist: false,
    });

    // 2️⃣ Crear perfil según rol
    if (role === "patient") {
      const patient = await PatientU.create({
        ...patientData,
        userId: user._id,
      });

      user.isPatient = true;
      user.patientProfile = patient._id;
    }

    if (role === "therapist") {
      const therapist = await TherapistU.create({
        ...therapistData,
        userId: user._id,
      });

      user.isTherapist = true;
      user.therapistProfile = therapist._id;
    }

    // admin / operador → no perfil
    await user.save();

    return NextResponse.json(
      {
        message: "Usuario creado correctamente",
        user,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error al crear usuario" },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    await dbConnect();

    // 1. Buscamos solo usuarios cuyo rol sea 'patient'
    // 2. Usamos .populate('patientProfile') para traer los datos de la otra tabla
    const pacientes = await UserTrue.find({ role: "patient" })
      .populate("patientProfile") 
      .lean();

    return NextResponse.json(pacientes, { status: 200 });
  } catch (error) {
    console.error("Error al obtener pacientes:", error);
    return NextResponse.json({ error: "Error de servidor" }, { status: 500 });
  }
}


