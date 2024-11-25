import dbConnect from "@/lib/dbConnect";
import Date from "@/models/Date";
import { NextResponse } from "next/server";

export async function PUT(request, { params }) {
  const { id } = params; // Este es el id que se recibe de la URL
  const {
    newIdDate: idDate,
    newDate: date,
    newStart: start,
    newEnd: end,
    newTherapist: therapist,
    newPatient: patient,
    newTitle: title,
    newDescription: description,
    newCost: cost,
  } = await request.json();

  await dbConnect();

  const updatedDate = await Date.findByIdAndUpdate(id, {
    idDate,
    date,
    start,
    end,
    therapist,
    patient,
    title,
    description,
    cost,
  }, { new: true }); 

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
