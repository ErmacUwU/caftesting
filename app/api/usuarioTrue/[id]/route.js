import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import PatientU from "@/models/PatientU";
import TherapistU from "@/models/TherapistU";
import UserTrue from "@/models/UserTrue";

export async function PUT(req, { params }) {
  try {
    await dbConnect();
    const { id } = params;
    const body = await req.json();

    console.log("Solicitud PUT para ID:", id, "| ¿Es cuenta?:", !!body.isAccountUpdate);

    // ESCENARIO 1: Actualizar Cuenta (Email y Password en UserTrue)
    if (body.isAccountUpdate) {
      const updateFields = {};
      if (body.email) updateFields.email = body.email;

      if (body.role) updateFields.role = body.role;

      if (body.password && typeof body.password === 'string' && body.password.trim() !== "") {
        const salt = await bcrypt.genSalt(10);
        updateFields.passwordHash = await bcrypt.hash(body.password, salt);
      }

      const updatedUser = await UserTrue.findByIdAndUpdate(
        id, 
        { $set: updateFields }, 
        { new: true }
      );

      if (!updatedUser) {
        return NextResponse.json({ error: "Usuario base no encontrado" }, { status: 404 });
      }

      // IMPORTANTE: Return aquí para que no intente ejecutar el código de abajo
      return NextResponse.json({ message: "Cuenta actualizada correctamente" });
    }

    // ESCENARIO 2: Actualizar Perfil (PatientU o TherapistU)
    const { role, profileData } = body;
    
    if (!role || !profileData) {
        return NextResponse.json({ error: "Faltan datos de perfil o rol" }, { status: 400 });
    }

    const Modelo = role === "patient" ? PatientU : TherapistU;
    
    const updatedProfile = await Modelo.findByIdAndUpdate(
      id, 
      { $set: profileData }, 
      { new: true }
    );

    if (!updatedProfile) {
        return NextResponse.json({ error: "Perfil no encontrado en la colección correspondiente" }, { status: 404 });
    }

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


