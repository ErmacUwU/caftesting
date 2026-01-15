import dbConnect from "@/lib/dbConnect";
import UserSystem from "@/models/UserSystem";
import User from "@/models/User";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";


export async function POST(req) {
  try {
    await dbConnect();

    const data = await req.json();
    console.log("Datos recibidos en backend:", data);

    const { idUserSystem, name, email, password, role } = data;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { msg: ["Todos los campos son obligatorios"], success: false },
        { status: 400 }
      );
    }

    // Normalizar role
    const roleNormalized = role.toString().trim().toLowerCase();

    const allowedRoles = ["admin", "operador"];
    if (!allowedRoles.includes(roleNormalized)) {
      return NextResponse.json(
        { msg: [`Rol inválido. Debe ser uno de: ${allowedRoles.join(", ")}`], success: false },
        { status: 400 }
      );
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return NextResponse.json(
        { msg: ["Este correo ya está registrado"], success: false },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUserSystem = await UserSystem.create({
      idUserSystem,
      name,
      email,
      passwordHash,
      role: roleNormalized,
    });



    return NextResponse.json({
      msg: ["Usuario del sistema creado con éxito"],
      success: true,
    });
  } catch (error) {
    console.error(error);
    if (error instanceof mongoose.Error.ValidationError) {
      let errorList = [];
      for (let e in error.errors) {
        errorList.push(error.errors[e].message);
      }
      return NextResponse.json(
        { msg: errorList, success: false },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { msg: [error.message || "Error desconocido"], success: false },
      { status: 500 }
    );
  }
}



export async function GET() {
  try {
    await dbConnect();

    const users = await UserSystem.find().lean();

    return NextResponse.json({
      users,
      success: true,
    });
  } catch (error) {
    return NextResponse.json(
      { msg: ["Error al obtener usuarios"], success: false },
      { status: 500 }
    );
  }
}

/* =========================
   DELETE - Eliminar usuario sistema
========================= */
export async function DELETE(req) {
  try {
    await dbConnect();

    const id = req.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { msg: ["ID requerido"], success: false },
        { status: 400 }
      );
    }

    // Eliminar usuario sistema
    const userSystem = await UserSystem.findByIdAndDelete(id);

    if (!userSystem) {
      return NextResponse.json(
        { msg: ["Usuario no encontrado"], success: false },
        { status: 404 }
      );
    }

    // Eliminar usuario de autenticación relacionado
    await User.findOneAndDelete({
      refId: id,
      refType: "UserSystem",
    });

    return NextResponse.json({
      msg: ["Usuario eliminado correctamente"],
      success: true,
    });
  } catch (error) {
    return NextResponse.json(
      { msg: ["Error al eliminar usuario"], success: false },
      { status: 500 }
    );
  }
}
