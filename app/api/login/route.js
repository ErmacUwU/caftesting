import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/dbConnect";
import UserTrue from "@/models/UserTrue"; 

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
      // Creamos la respuesta base
      const response = NextResponse.json({
        msg: "Inicio de sesión exitoso",
        success: true,
        userId: "admin-root",
        userName: ADMIN_CREDENTIALS.name,
        role: "admin",
      });

      // 🔐 Inyectamos las cookies para el Middleware
      response.cookies.set("userRole", "admin", { path: "/", maxAge: 86400 });
      // Mandamos un token simulado para el admin raíz para que pase el filtro !token
      response.cookies.set("token", "root-bypass-token-caf", { path: "/", maxAge: 86400, httpOnly: true });

      return response;
    }

    /* 2️⃣ BUSCAR EN USERTRUE */
    const user = await UserTrue.findOne({ email })
      .populate("patientProfile")
      .populate("therapistProfile");

    if (!user) {
      return NextResponse.json({ msg: "Credenciales inválidas" }, { status: 401 });
    }

    // Verificar password
    const passwordOk = await bcrypt.compare(password, user.passwordHash || user.password);
    if (!passwordOk) {
      return NextResponse.json({ msg: "Credenciales inválidas" }, { status: 401 });
    }

    /* 3️⃣ DETERMINAR NOMBRE Y ID DE RETORNO */
    let userName = user.email; 
    let profileId = user._id.toString(); 

    if (user.role === "admin" || user.role === "operador") {
      userName = user.name || user.email;
    } 
    else if (user.role === "therapist" && user.therapistProfile) {
      userName = `${user.therapistProfile.firstName} ${user.therapistProfile.lastName}`;
    } 
    else if (user.role === "patient" && user.patientProfile) {
      userName = `${user.patientProfile.firstName} ${user.patientProfile.lastName}`;
    }

    /* 4️⃣ RESPUESTA FINAL CON COOKIES PARA USUARIOS DE LA DB */
    const response = NextResponse.json({
      msg: "Inicio de sesión exitoso",
      success: true,
      userId: profileId, 
      userName: userName,
      role: user.role,
    });

    // 🔐 Guardamos las cookies correspondientes al usuario real
    response.cookies.set("userRole", user.role, { path: "/", maxAge: 86400 });
    // Aquí usamos su ID o el token JWT real que generes como 'token'
    response.cookies.set("token", profileId, { path: "/", maxAge: 86400, httpOnly: true });

    return response;

  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return NextResponse.json(
      { msg: "Error en el servidor", success: false },
      { status: 500 }
    );
  }
}