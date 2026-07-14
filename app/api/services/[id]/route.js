import dbConnect from "@/lib/dbConnect";
import Service from "@/models/Service";
import { NextResponse } from "next/server";

export async function PATCH(request, { params }) {
  await dbConnect();
  const { name, duration, cost, color } = await request.json();
  const service = await Service.findByIdAndUpdate(
    params.id,
    { name, duration: Number(duration), cost: Number(cost), color },
    { new: true }
  );
  if (!service) return NextResponse.json({ message: "Servicio no encontrado" }, { status: 404 });
  return NextResponse.json({ service });
}

export async function DELETE(_request, { params }) {
  await dbConnect();
  const deleted = await Service.findByIdAndDelete(params.id);
  if (!deleted) return NextResponse.json({ message: "Servicio no encontrado" }, { status: 404 });
  return NextResponse.json({ message: "Servicio eliminado correctamente" });
}
