import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Schedule from "@/models/Schedule";

export const runtime = "nodejs";

export async function GET() {
  try {
    await dbConnect();
    let schedule = await Schedule.findOne();
    if (!schedule) {
      schedule = await Schedule.create({ startTime: "08:00:00", endTime: "18:00:00" });
    }
    return NextResponse.json(schedule, { status: 200 });
  } catch (err) {
    console.error("GET /api/schedule error:", err);
    return NextResponse.json({ error: "Error leyendo horario" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { startTime, endTime } = await request.json();
    await dbConnect();

    let schedule = await Schedule.findOne();
    if (!schedule) {
      schedule = await Schedule.create({ startTime, endTime });
    } else {
      schedule.startTime = startTime;
      schedule.endTime = endTime;
      await schedule.save();
    }

    return NextResponse.json(schedule, { status: 200 });
  } catch (err) {
    console.error("PUT /api/schedule error:", err);
    return NextResponse.json({ error: "Error actualizando horario" }, { status: 500 });
  }
}
