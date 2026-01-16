// app/api/login/route.js
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import Patient from "@/models/Patient";
import Therapist from "@/models/Therapist";

const ADMIN_CREDENTIALS = {
  email: "admin@caf.com",
  password: "Admin1234",
  name: "Administrador",
};

export async function POST(req) {
  const { email, password } = await req.json();
  await dbConnect();

  try {
    // 1) Admin (bypass DB)
    if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
      return NextResponse.json({
        msg: "Inicio de sesión exitoso",
        success: true,
        userId: "admin",                 // <- para el admin usamos id simbólico
        userName: ADMIN_CREDENTIALS.name,
        role: "admin",
      });
    }


    // 2) Usuarios creados (Therapist/Patient) -> validar contra `User`
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ msg: "Credenciales inválidas (usuario no encontrado)" }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ msg: "Credenciales inválidas (password incorrecto)" }, { status: 401 });
    }

    // 🔹 ADMIN / OPERADOR (no usan refType)
    if (user.role === "admin" || user.role === "operador") {
      return NextResponse.json({
        msg: "Inicio de sesión exitoso",
        success: true,
        userId: user._id.toString(),
        userName: user.email, // o el nombre que quieras mostrar
        role: user.role,
      });
    }


    // 3) Obtener nombre visible según refType/refId
    let userName = "";
    let displayId = user.refId?.toString() || ""; // este será tu userId para el chat
    if (user.refType === "Therapist") {
      const t = await Therapist.findById(user.refId);
      if (!t) return NextResponse.json({ msg: "Perfil de terapeuta no encontrado" }, { status: 404 });
      userName = `${t.firstName} ${t.lastName}`;
    } else if (user.refType === "Patient") {
      const p = await Patient.findById(user.refId);
      if (!p) return NextResponse.json({ msg: "Perfil de paciente no encontrado" }, { status: 404 });
      userName = `${p.firstName} ${p.lastName}`;
    } else {
      return NextResponse.json({ msg: "Tipo de usuario desconocido" }, { status: 400 });
    }

    return NextResponse.json({
      msg: "Inicio de sesión exitoso",
      success: true,
      userId: displayId,   // <- importante: usamos refId como identificador lógico del chat
      userName,
      role: user.role,     // "therapist" | "patient"
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ msg: "Error en el servidor", success: false }, { status: 500 });
  }
}
