import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/dbConnect";
import UserTrue from "@/models/UserTrue"; // <-- Usamos el nuevo modelo

const ADMIN_CREDENTIALS = {
  email: "admin@caf.com",
  password: "Admin1234",
  name: "Administrador",
};

export async function POST(req) {
  const { email, password } = await req.json();
  await dbConnect();

  try {
    /* 1️⃣ ADMIN ROOT (Bypass) */
    if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
      return NextResponse.json({
        msg: "Inicio de sesión exitoso",
        success: true,
        userId: "admin-root",
        userName: ADMIN_CREDENTIALS.name,
        role: "admin",
      });
    }

    /* 2️⃣ BUSCAR EN USERTRUE 
       Usamos .populate() para traer los datos del perfil de una vez */
    const user = await UserTrue.findOne({ email })
      .populate("patientProfile")
      .populate("therapistProfile");

    if (!user) {
      return NextResponse.json({ msg: "Credenciales inválidas" }, { status: 401 });
    }

    // Verificar password (asegúrate que el campo se llame passwordHash o password)
    const passwordOk = await bcrypt.compare(password, user.passwordHash || user.password);
    if (!passwordOk) {
      return NextResponse.json({ msg: "Credenciales inválidas" }, { status: 401 });
    }

    /* 3️⃣ DETERMINAR NOMBRE Y ID DE RETORNO */
    let userName = user.email; // Default
    let profileId = user._id.toString(); // Por defecto usamos el ID del sistema

    if (user.role === "admin" || user.role === "operador") {
      // Para sistema, el nombre suele ser el email o un campo 'name'
      userName = user.name || user.email;
    } 
    else if (user.role === "therapist" && user.therapistProfile) {
      userName = `${user.therapistProfile.firstName} ${user.therapistProfile.lastName}`;
      // Si en tu chat usas el ID del perfil para los mensajes, usa:
      // profileId = user.therapistProfile._id.toString();
    } 
    else if (user.role === "patient" && user.patientProfile) {
      userName = `${user.patientProfile.firstName} ${user.patientProfile.lastName}`;
      // profileId = user.patientProfile._id.toString();
    }

    /* 4️⃣ RESPUESTA FINAL */
    return NextResponse.json({
      msg: "Inicio de sesión exitoso",
      success: true,
      userId: profileId, // Este es el ID que usará el context y el Socket
      userName: userName,
      role: user.role,
    });

  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return NextResponse.json(
      { msg: "Error en el servidor", success: false },
      { status: 500 }
    );
  }
}