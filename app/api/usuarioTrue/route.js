import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/dbConnect";

import UserTrue from "@/models/UserTrue";
import PatientU from "@/models/PatientU";
import TherapistU from "@/models/TherapistU";

export async function POST(req) {
  try {
    await dbConnect();

    const body = await req.json();
    const { email, password, role, patientData, therapistData } = body;

    // 🔴 Validación base
    if (!email || !password || !role) {
      return NextResponse.json(
        { error: "Datos incompletos" },
        { status: 400 }
      );
    }

    // 🔴 Evitar emails duplicados
    const exists = await UserTrue.findOne({ email });
    if (exists) {
      return NextResponse.json(
        { error: "El email ya está registrado" },
        { status: 409 }
      );
    }

    // 🔴 Validaciones por rol (ANTES de crear)
    if (role === "patient") {
      if (!patientData) {
        return NextResponse.json(
          { error: "patientData es requerido" },
          { status: 400 }
        );
      }

      const { firstName, lastName, birthdate, gender } = patientData;
      if (!firstName || !lastName || !birthdate || !gender) {
        return NextResponse.json(
          { error: "Datos obligatorios de paciente faltantes" },
          { status: 400 }
        );
      }
    }

    if (role === "therapist") {
      if (!therapistData) {
        return NextResponse.json(
          { error: "therapistData es requerido" },
          { status: 400 }
        );
      }

      const { firstName, lastName, phone } = therapistData;
      if (!firstName || !lastName || !phone) {
        return NextResponse.json(
          { error: "Datos obligatorios de terapeuta faltantes" },
          { status: 400 }
        );
      }
    }

    // 🔐 Hash de contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // 1️⃣ Crear usuario base
    const user = await UserTrue.create({
      email,
      passwordHash,
      role,
      isPatient: false,
      isTherapist: false,
    });

    // 2️⃣ Crear perfil según rol
    if (role === "patient") {
      const patient = await PatientU.create({
        ...patientData,
        userId: user._id,
      });

      user.isPatient = true;
      user.patientProfile = patient._id;
    }

    if (role === "therapist") {
      const therapist = await TherapistU.create({
        ...therapistData,
        userId: user._id,
      });

      user.isTherapist = true;
      user.therapistProfile = therapist._id;
    }

    // admin / operador → no perfil
    await user.save();

    return NextResponse.json(
      {
        message: "Usuario creado correctamente",
        user,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error al crear usuario" },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");

    // Si el filtro es "all" o no existe, traemos todos. 
    // Si no, filtramos por el rol específico.
    const query = (role && role !== "all") ? { role } : {};

    const usuarios = await UserTrue.find(query)
      .populate("patientProfile") 
      .populate("therapistProfile")
      .lean();

    return NextResponse.json(usuarios, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Error de servidor" }, { status: 500 });
  }
}


export async function PATCH(req, { params }) {
  await dbConnect();
  
  try {
    // 1. Obtener el ID de la URL
    // Nota: Dependiendo de tu estructura de carpetas, si el ID viene en la URL 
    // y el archivo se llama [...id]/route.js, lo obtienes así:
    const { id } = params; 
    const body = await req.json();
    const { cantidad, isAccountUpdate, nuevaCita } = body;

    // 2. Buscar al usuario y su perfil de paciente
    const user = await UserTrue.findById(id).populate("patientProfile");
    
    if (!user || !user.patientProfile) {
      return NextResponse.json({ msg: "Paciente no encontrado", success: false }, { status: 404 });
    }

    const paciente = user.patientProfile;

    // 3. Lógica para Registrar Pago
    if (cantidad) {
      const nuevoPago = {
        fecha: new Date(),
        cantidad: Number(cantidad),
        metodoPago: body.metodoPago || "efectivo"
      };

      paciente.estadoDeCuenta.total -= Number(cantidad);
      paciente.estadoDeCuenta.pagos.push(nuevoPago);
    }

    // 4. Lógica para Nueva Cita (la que usabas en tu handleSubmit)
    if (nuevaCita) {
      paciente.estadoDeCuenta.citas.push({
        fecha: nuevaCita.fecha,
        costo: Number(nuevaCita.costo)
      });
      // Opcional: Sumar al total si la cita genera deuda
      paciente.estadoDeCuenta.total += Number(nuevaCita.costo);
    }

    await paciente.save();

    return NextResponse.json({
      msg: "Actualización realizada con éxito",
      success: true,
      estadoDeCuenta: paciente.estadoDeCuenta,
    });

  } catch (error) {
    console.error("Error en PATCH:", error);
    return NextResponse.json({ msg: "Error al actualizar", success: false }, { status: 500 });
  }
}

