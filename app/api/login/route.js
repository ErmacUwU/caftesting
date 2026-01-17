// app/api/login/route.js
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import Patient from "@/models/Patient";
import Therapist from "@/models/Therapist";

/**
 * ADMIN ROOT (hardcodeado)
 * - Tiene acceso TOTAL
 * - No depende de DB
 */
const ADMIN_CREDENTIALS = {
  email: "admin@caf.com",
  password: "Admin1234",
  name: "Administrador",
};

export async function POST(req) {
  const { email, password } = await req.json();
  await dbConnect();

  try {
    /* =====================================================
       1️⃣ ADMIN ROOT (bypass DB)
    ===================================================== */
    if (
      email === ADMIN_CREDENTIALS.email &&
      password === ADMIN_CREDENTIALS.password
    ) {
      return NextResponse.json({
        msg: "Inicio de sesión exitoso",
        success: true,
        userId: "admin-root",
        userName: ADMIN_CREDENTIALS.name,
        role: "admin", // 🔥 acceso total
      });
    }

    /* =====================================================
       2️⃣ BUSCAR USUARIO EN DB
    ===================================================== */
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { msg: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    const passwordOk = await bcrypt.compare(password, user.passwordHash);
    if (!passwordOk) {
      return NextResponse.json(
        { msg: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    /* =====================================================
       3️⃣ ADMIN / OPERADOR (UserSystem)
       - NO usan refType
    ===================================================== */
    if (user.role === "admin" || user.role === "operador") {
      return NextResponse.json({
        msg: "Inicio de sesión exitoso",
        success: true,
        userId: user._id.toString(),
        userName: user.email, // o user.name si lo agregas
        role: user.role,      // admin | operador
      });
    }

    /* =====================================================
       4️⃣ THERAPIST / PATIENT (usan refType + refId)
    ===================================================== */
    let userName = "";
    let displayId = user.refId?.toString();

    if (!displayId) {
      return NextResponse.json(
        { msg: "Usuario mal configurado (refId faltante)" },
        { status: 400 }
      );
    }

    if (user.refType === "Therapist") {
      const therapist = await Therapist.findById(user.refId);
      if (!therapist) {
        return NextResponse.json(
          { msg: "Perfil de terapeuta no encontrado" },
          { status: 404 }
        );
      }
      userName = `${therapist.firstName} ${therapist.lastName}`;
    }

    else if (user.refType === "Patient") {
      const patient = await Patient.findById(user.refId);
      if (!patient) {
        return NextResponse.json(
          { msg: "Perfil de paciente no encontrado" },
          { status: 404 }
        );
      }
      userName = `${patient.firstName} ${patient.lastName}`;
    }

    else {
      return NextResponse.json(
        { msg: "Tipo de usuario desconocido" },
        { status: 400 }
      );
    }

    /* =====================================================
       5️⃣ RESPUESTA FINAL
    ===================================================== */
    return NextResponse.json({
      msg: "Inicio de sesión exitoso",
      success: true,
      userId: displayId,
      userName,
      role: user.role, // therapist | patient
    });

  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return NextResponse.json(
      { msg: "Error en el servidor", success: false },
      { status: 500 }
    );
  }
}
