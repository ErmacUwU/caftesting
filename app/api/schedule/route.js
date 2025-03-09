import dbConnect from "@/lib/dbConnect";
import Schedule from "@/models/Shedule";
import { NextResponse } from "next/server";

// Obtener el horario de trabajo
export async function GET() {
  await dbConnect();
  let schedule = await Schedule.findOne();

  // Si no existe, creamos uno por defecto
  if (!schedule) {
    schedule = new Schedule({ startTime: "08:00:00", endTime: "18:00:00" });
    await schedule.save();
  }

  return NextResponse.json(schedule);
}

// Actualizar el horario de trabajo
export async function PUT(req) {
  const { startTime, endTime } = await req.json();
  await dbConnect();

  let schedule = await Schedule.findOne();
  if (!schedule) {
    schedule = new Schedule({ startTime, endTime });
  } else {
    schedule.startTime = startTime;
    schedule.endTime = endTime;
  }

  await schedule.save();
  return NextResponse.json(schedule);
}
