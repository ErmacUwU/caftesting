import dbConnect from "@/lib/dbConnect";
import Date from "@/models/Date";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

export async function PUT(request, { params }) {
  const { id } = params;
  
  // 1. Obtenemos el cuerpo directamente. 
  // Ya no usamos nombres "newDate", "newStart" porque no los envías así.
  const data = await request.json();
  
  console.log("Datos recibidos en API:", data); 

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

  const updatedDate = await Date.findByIdAndUpdate(id, updatedData, { 
    new: true,
    runValidators: true 
  });

  if (!updatedDate) {
    return NextResponse.json({ message: "Cita no encontrada" }, { status: 404 });
  }

  return NextResponse.json({ message: "Fecha Actualizada", updatedDate });
}

export async function GET(request, { params }) {
  const { id } = params; // id es el parámetro de la ruta dinámica
  await dbConnect();
  const dateEntry = await Date.findOne({ _id: id }); // Busca por id en la base de datos
  if (!dateEntry) {
    return NextResponse.json({ message: "Cita no encontrada" }, { status: 404 });
  }
  return NextResponse.json({ date: dateEntry }, { status: 200 });
}
