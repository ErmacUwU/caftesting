import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import UserTrue from "@/models/UserTrue";
import PatientU from "@/models/PatientU"; // <--- Nombre correcto
import TherapistU from "@/models/TherapistU"; // <--- Nombre correcto
import bcrypt from "bcryptjs"; // Recomendado para la contraseña

export async function PUT(req, { params }) {
  try {
    await dbConnect();
    const { id } = params;
    const body = await req.json();
    
    // NOTA: Aceptamos profileData O patientData para evitar errores de nombre
    const { email, password, role } = body;
    const profileData = body.profileData || body.patientData || body.therapistData;

    const user = await UserTrue.findById(id);
    if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    // Actualizar cuenta
    if (email) user.email = email;
    if (password && password.trim() !== "") user.password = password; // Middleware se encarga del hash
    await user.save();

    // Actualizar Perfil
    if (role === 'patient' && user.patientProfile) {
      await PatientU.findByIdAndUpdate(user.patientProfile, profileData);
    } else if (role === 'therapist' && user.therapistProfile) {
      await TherapistU.findByIdAndUpdate(user.therapistProfile, profileData);
    }

    return NextResponse.json({ message: "Actualizado con éxito" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
// El DELETE se ve bien, solo asegúrate de añadir TherapistU también:
export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    const { id } = params; 

    const user = await UserTrue.findById(id);
    if (!user) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    if (user.patientProfile) await PatientU.findByIdAndDelete(user.patientProfile);
    if (user.therapistProfile) await TherapistU.findByIdAndDelete(user.therapistProfile);

    await UserTrue.findByIdAndDelete(id);
    return NextResponse.json({ message: "Borrado exitoso" });
  } catch (error) {
    return NextResponse.json({ error: "Error de servidor" }, { status: 500 });
  }
}



