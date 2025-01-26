import dbConnect from "@/lib/dbConnect";
import Register from "@/models/Register";
import { NextResponse } from "next/server";

export async function POST(req) {
  const { userName, email, password } = await req.json();

  try {
    await dbConnect();

    // Verifica si el usuario ya existe
    const existingUser = await Register.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { msg: "El usuario ya está registrado", success: false },
        { status: 400 }
      );
    }

    await Register.create({
      userName,
      email,
      password,
    });

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
