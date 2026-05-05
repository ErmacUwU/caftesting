import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import PatientU from "@/models/PatientU";
import TherapistU from "@/models/TherapistU";
import UserTrue from "@/models/UserTrue";
import mongoose from "mongoose"; // <--- Verifica esta importación

export async function PUT(req, { params }) {
  try {
    await dbConnect();
    const { id } = params;

    // VALIDACIÓN ANTI-ERROR 500:
    // Comprobamos si el ID existe, no es la palabra "undefined" y es un formato válido de MongoDB
    if (!id || id === "undefined" || !mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { error: "ID inválido o no proporcionado" }, 
        { status: 400 }
      );
    }

    const body = await req.json();

    // ESCENARIO 1: Actualizar Cuenta (UserTrue)
    if (body.isAccountUpdate) {
      const updateFields = {};
      if (body.email) updateFields.email = body.email;
      if (body.role) updateFields.role = body.role; // Permite mover de pestaña

      if (body.password && body.password.trim() !== "") {
        const salt = await bcrypt.genSalt(10);
        updateFields.passwordHash = await bcrypt.hash(body.password, salt);
      }

      const updatedUser = await UserTrue.findByIdAndUpdate(
        id,
        { $set: updateFields },
        { new: true }
      );

      if (!updatedUser) {
        return NextResponse.json({ error: "Usuario no encontrado en la DB" }, { status: 404 });
      }
      return NextResponse.json({ message: "Cuenta/Rol actualizado" });
    }

    // ESCENARIO 2: Actualizar Perfil (Patient/Therapist)
    const { role, profileData } = body;
    const Modelo = role === "patient" ? PatientU : role === "therapist" ? TherapistU : null;

    if (!Modelo) {
      return NextResponse.json({ error: "Este rol no posee perfil físico" }, { status: 400 });
    }

    const updatedProfile = await Modelo.findByIdAndUpdate(
      id,
      { $set: profileData },
      { new: true }
    );

    return NextResponse.json({ message: "Perfil actualizado", updatedProfile });

  } catch (error) {
    console.error("Error en PUT:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
// El DELETE se ve bien, solo asegúrate de añadir TherapistU también:
export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    const { id } = params; // ID de UserTrue
    const { role, profileId } = await req.json();

    // 1. Si tiene un perfil (Paciente o Terapeuta), lo borramos primero
    if (role === 'patient' && profileId) {
      await PatientU.findByIdAndDelete(profileId);
    } else if (role === 'therapist' && profileId) {
      await TherapistU.findByIdAndDelete(profileId);
    }

    // 2. Borramos la cuenta principal (UserTrue)
    const deletedUser = await UserTrue.findByIdAndDelete(id);

    if (!deletedUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ message: "Usuario y perfil eliminados con éxito" });
  } catch (error) {
    console.error("Error en DELETE:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}      


export async function PATCH(req, { params }) {
  try {
    await dbConnect();
    const { id } = params; // Este es el ID de UserTrue
    const body = await req.json();
    const { nuevaCita, cantidad } = body;

    // 1. Buscamos al usuario y poblamos su perfil de paciente
    const user = await UserTrue.findById(id).populate("patientProfile");

    if (!user || !user.patientProfile) {
      return NextResponse.json(
        { error: "Usuario o perfil de paciente no encontrado" },
        { status: 404 }
      );
    }

    const paciente = user.patientProfile;

    // 2. ESCENARIO: Agregar nueva cita
    if (nuevaCita) {
      paciente.estadoDeCuenta.citas.push({
        fecha: nuevaCita.fecha,
        costo: Number(nuevaCita.costo),
      });
      paciente.estadoDeCuenta.total += Number(nuevaCita.costo);
    }

    // 3. ESCENARIO: Registrar un pago
    if (cantidad) {
      const nuevoPago = {
        fecha: new Date(),
        cantidad: Number(cantidad),
        metodoPago: body.metodoPago || "efectivo",
      };
      paciente.estadoDeCuenta.total -= Number(cantidad);
      paciente.estadoDeCuenta.pagos.push(nuevoPago);
    }

    // 4. Guardar cambios en el perfil (PatientU)
    await paciente.save();

    return NextResponse.json({
      message: "Estado de cuenta actualizado correctamente",
      estadoDeCuenta: paciente.estadoDeCuenta,
    });

  } catch (error) {
    console.error("Error en PATCH:", error);
    return NextResponse.json(
      { error: "Error al actualizar el estado de cuenta" },
      { status: 500 }
    );
  }
}

