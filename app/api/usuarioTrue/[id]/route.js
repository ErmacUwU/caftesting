import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import UserTrue from "@/models/UserTrue";
import PatientU from "@/models/PatientU";

export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    
    // params.id corresponde al nombre de la carpeta [id]
    const { id } = params; 

    const user = await UserTrue.findById(id);
    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Borrar perfil asociado
    if (user.patientProfile) {
      await PatientU.findByIdAndDelete(user.patientProfile);
    }

    // Borrar usuario base
    await UserTrue.findByIdAndDelete(id);

    return NextResponse.json({ message: "Borrado exitoso" }, { status: 200 });
  } catch (error) {
    console.error("Error en DELETE:", error);
    return NextResponse.json({ error: "Error de servidor" }, { status: 500 });
  }
}

// app/api/usuarioTrue/[id]/route.js

export async function PUT(req, { params }) {
  try {
    await dbConnect();
    const { id } = params; // ID del UserTrue
    const body = await req.json();

    // 1. Buscamos el usuario para obtener el ID de su perfil
    const user = await UserTrue.findById(id);
    if (!user || !user.patientProfile) {
      return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 });
    }

    // 2. Actualizamos el modelo PatientU con la nueva data
    // body.patientData debe contener firstName, lastName, phone, etc.
    const updatedProfile = await PatientU.findByIdAndUpdate(
      user.patientProfile,
      { ...body.patientData },
      { new: true } // Para que devuelva el documento actualizado
    );

    return NextResponse.json({ 
      message: "Paciente actualizado correctamente", 
      updatedProfile 
    }, { status: 200 });

  } catch (error) {
    console.error("Error al actualizar:", error);
    return NextResponse.json({ error: "Error de servidor" }, { status: 500 });
  }
}