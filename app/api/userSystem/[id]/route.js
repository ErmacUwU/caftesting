import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import UserSystem from "@/models/UserSystem";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function PUT(req, { params }) {
  try {
    await dbConnect();

    const { id } = params;
    const data = await req.json();

    const { name, email, role, password } = data;

    if (!name || !email || !role) {
      return NextResponse.json(
        { msg: ["Nombre, email y rol son obligatorios"], success: false },
        { status: 400 }
      );
    }

    if (!["admin", "operador"].includes(role)) {
      return NextResponse.json(
        { msg: ["Rol inválido"], success: false },
        { status: 400 }
      );
    }

    // 1️⃣ Buscar UserSystem actual
    const userSystem = await UserSystem.findById(id);
    if (!userSystem) {
      return NextResponse.json(
        { msg: ["Usuario no encontrado"], success: false },
        { status: 404 }
      );
    }

    const oldEmail = userSystem.email;

    // 2️⃣ Actualizar UserSystem
    userSystem.name = name;
    userSystem.email = email;
    userSystem.role = role;

    if (password) {
      userSystem.passwordHash = await bcrypt.hash(password, 10);
    }

    await userSystem.save();

    // 3️⃣ Actualizar User (login)
    const userUpdate = {
      email,
      role,
    };

    if (password) {
      userUpdate.passwordHash = userSystem.passwordHash;
    }

    await User.findOneAndUpdate(
      { email: oldEmail, role: { $in: ["admin", "operador"] } },
      userUpdate
    );

    return NextResponse.json({
      msg: ["Usuario actualizado correctamente"],
      success: true,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { msg: ["Error al actualizar usuario"], success: false },
      { status: 500 }
    );
  }
}
