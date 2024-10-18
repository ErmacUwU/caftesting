import dbConnect from "@/lib/dbConnect";
import Date from "@/models/Date";
import { NextResponse } from "next/server";

export async function PATCH(req, { params }) {
  const { id } = params; // El id de la cita a actualizar
  const updatedData = await req.json();

  try {
    await dbConnect();

    // Encuentra la cita por su _id y actualiza los campos
    const updatedDate = await Date.findByIdAndUpdate(id, updatedData, {
      new: true,
      runValidators: true,
    });

    if (!updatedDate) {
      return NextResponse.json({ msg: "Cita no encontrada" }, { status: 404 });
    }

    return NextResponse.json(updatedDate);
  } catch (error) {
    console.error("Error actualizando la cita:", error);
    return NextResponse.json({ msg: "Error actualizando la cita" }, { status: 500 });
  }
}
