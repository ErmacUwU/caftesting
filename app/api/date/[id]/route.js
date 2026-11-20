import dbConnect from "@/lib/dbConnect";
import DateModel from "@/models/Date";
import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { actualizarCargo } from "@/lib/estadoDeCuenta";

export async function PUT(request, { params }) {
  const { id } = params;

  // 1. Obtenemos el cuerpo directamente.
  // Ya no usamos nombres "newDate", "newStart" porque no los envías así.
  const data = await request.json();

  await dbConnect();

  // 2. Usamos directamente el objeto 'data' o desestructuramos los nombres exactos
  // Asegúrate de que las propiedades coincidan con el objeto que construyes en ActualizarCita.jsx
  const updatedData = {
    date: data.date,
    start: data.start,
    end: data.end,
    duration: data.duration,
    therapist: data.therapist,
    patient: data.patient,
    title: data.title,
    description: data.description,
    cost: data.cost,
    serviceId: data.serviceId ? new mongoose.Types.ObjectId(data.serviceId) : undefined,
  };

  const previousDate = await DateModel.findById(id).lean();
  if (!previousDate) {
    return NextResponse.json({ message: "Cita no encontrada" }, { status: 404 });
  }

  const updatedDate = await DateModel.findByIdAndUpdate(id, updatedData, {
    new: true,
    runValidators: true 
  });

  if (!updatedDate) {
    return NextResponse.json({ message: "Cita no encontrada" }, { status: 404 });
  }

  // Refleja el nuevo costo/fecha (o el cambio de paciente) en el estado de cuenta.
  try {
    await actualizarCargo(previousDate, updatedDate);
  } catch (error) {
    console.error("[/api/date/:id] no se pudo actualizar el estado de cuenta:", error);
  }

  return NextResponse.json({ message: "Fecha Actualizada", updatedDate });
}

export async function GET(request, { params }) {
  const { id } = params; // id es el parámetro de la ruta dinámica
  await dbConnect();
  const dateEntry = await DateModel.findOne({ _id: id }); // Busca por id en la base de datos
  if (!dateEntry) {
    return NextResponse.json({ message: "Cita no encontrada" }, { status: 404 });
  }
  return NextResponse.json({ date: dateEntry }, { status: 200 });
}
