import dbConnect from "@/lib/dbConnect";
import Register from "@/models/Register";
import { NextResponse } from "next/server";

export async function POST(req) {
  const { email, password } = await req.json();

  try {
    // Conecta a la base de datos
    await dbConnect();

    // Busca al usuario por email
    const user = await Register.findOne({ email });

    if (!user) {
      return NextResponse.json(
        { msg: "Usuario no encontrado", success: false },
        { status: 404 }
      );
    }

    if (user.password !== password) {
      return NextResponse.json(
        { msg: "Contraseña incorrecta", success: false },
        { status: 401 }
      );
    }

    return NextResponse.json({
      msg: "Inicio de sesión exitoso",
      success: true,
      userId: user._id,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { msg: "Error en el servidor", success: false },
      { status: 500 }
    );
  }
}
