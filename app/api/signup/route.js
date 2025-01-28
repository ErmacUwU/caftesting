import dbConnect from "@/lib/dbConnect";
import Register from "@/models/Register";
import { NextResponse } from "next/server";

// Maneja la solicitud HTTP POST para registrar un nuevo usuario.
export async function POST(req) {
  // Extrae los datos enviados en la solicitud (userName, email y password).
  const { userName, email, password } = await req.json();

  try {
    // Establece la conexión con la base de datos.
    await dbConnect();

    // Verifica si el usuario ya existe
    const existingUser = await Register.findOne({ email });
    // Si el usuario ya existe, devuelve una respuesta con un mensaje de error.
    if (existingUser) {
      return NextResponse.json(
        { msg: "El usuario ya está registrado", success: false },
        { status: 400 }
      );
    }
    // Crea un nuevo registro en la base de datos con los datos proporcionados.
    await Register.create({
      userName,
      email,
      password,
    });

    // Si la creación es exitosa, devuelve una respuesta con un mensaje de éxito.
    return NextResponse.json(
      { msg: "Usuario registrado con éxito", success: true },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { msg: "Error al registrar el usuario", success: false },
      { status: 500 }
    );
  }
}
