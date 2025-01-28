import dbConnect from "@/lib/dbConnect";
import Register from "@/models/Register";
import { NextResponse } from "next/server";

// Maneja la solicitud HTTP POST para el inicio de sesión.
export async function POST(req) {
  // Extrae los datos enviados en la solicitud (email y password).
  const { email, password } = await req.json();

  try {
    // Conecta a la base de datos
    await dbConnect();

    // Busca al usuario por email
    const user = await Register.findOne({ email });

    // Verifica si el usuario no existe.
    if (!user) {
      return NextResponse.json(
        { msg: "Usuario no encontrado", success: false },
        { status: 404 }
      );
    }

    // Verifica si la contraseña ingresada no coincide con la registrada.
    if (user.password !== password) {
      return NextResponse.json(
        { msg: "Contraseña incorrecta", success: false },
        { status: 401 }
      );
    }
    // Si el inicio de sesión es exitoso, devuelve un mensaje de éxito y el ID del usuario.
    return NextResponse.json({
      msg: "Inicio de sesión exitoso",
      success: true,
      userId: user._id,
    });
  } catch (error) {
    console.error(error);
    // Devuelve un mensaje genérico de error del servidor.
    return NextResponse.json(
      { msg: "Error en el servidor", success: false },
      { status: 500 }
    );
  }
}
