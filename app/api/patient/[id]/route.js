import dbConnect from "@/lib/dbConnect";
import Patient from "@/models/Patient";
import { NextResponse } from "next/server";

export async function PATCH(request, { params }) {
  const { id } = params; // ✅ Se obtiene el ID del paciente desde la URL
  const { nuevaCita } = await request.json();

  try {
    await dbConnect();

    // 📌 Verificar que el paciente existe
    const patient = await Patient.findById(id);
    if (!patient) {
      return NextResponse.json({ msg: "Paciente no encontrado" }, { status: 404 });
    }

    // 📌 Agregar la cita al historial y actualizar la deuda total
    if (nuevaCita) {
      patient.estadoDeCuenta.citas.push(nuevaCita);
      patient.estadoDeCuenta.total += nuevaCita.costo;
    }

    await patient.save();

    return NextResponse.json({
      msg: "Estado de cuenta actualizado",
      estadoDeCuenta: patient.estadoDeCuenta,
    }, { status: 200 });

  } catch (error) {
    console.error("Error al actualizar el estado de cuenta:", error);
    return NextResponse.json({ msg: "Error al actualizar el estado de cuenta" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const { id } = params;
  const {
    newFirstName: firstName,
    newLastName: lastName,
    newBirthdate: birthdate,
    newGender: gender,
    newPatientStatus: patientStatus,
    newBirthCity: birthCity,
    newNationality: nationality,
    newBirthState: birthState,
    newIdType: idType,
    newContacts: contacts
  } = await request.json();
  
  await dbConnect();
  
  await Patient.findByIdAndUpdate(id, {
    firstName,
    lastName,
    birthdate,
    gender,
    patientStatus,
    birthCity,
    nationality,
    birthState,
    idType,
    contacts
  });
  
  return NextResponse.json({ message: "Paciente Actualizado" }, { status: 200 });
}

export async function GET(request, { params }) {
  const { id } = params;
  
  await dbConnect();
  
  const patient = await Patient.findOne({ _id: id });
  
  if (!patient) {
    return NextResponse.json({ msg: "Paciente no encontrado" }, { status: 404 });
  }
  
  return NextResponse.json({ patient }, { status: 200 });
}
