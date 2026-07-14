import dbConnect from "@/lib/dbConnect";
import Service from "@/models/Service";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await dbConnect();
    const services = await Service.find({})
      .collation({ locale: "en", strength: 1 })
      .sort({ name: 1 })
      .lean();
    return NextResponse.json({ services });
  } catch (error) {
    return NextResponse.json({ message: "Error al obtener servicios" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const { name, duration, cost, color } = await request.json();
    const service = await Service.create({
      name,
      duration: Number(duration),
      cost: Number(cost),
      color,
    });
    return NextResponse.json({ service }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Error al crear servicio" }, { status: 500 });
  }
}
