export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import dbConnect from "@/lib/dbConnect";
import DateModel from "@/models/Date";

import "@/models/Therapist";
import "@/models/Patient";
import "@/models/Service";

import mongoose from "mongoose";
import { NextResponse } from "next/server";

function errorResponse(error, status = 500) {

  console.error("[/api/date] error:", error);
  const message = error?.message || "Error interno del servidor";
  return NextResponse.json({ success: false, msg: message }, { status });
}

const noStore = {
  headers: { "Cache-Control": "no-store" },
};

export async function POST(req) {
  let payload;
  try {
    payload = await req.json();
  } catch (e) {
    return NextResponse.json(
      { success: false, msg: "JSON inválido" },
      { status: 400 }
    );
  }

  const {
    idDate,
    date,
    start,
    end,
    duration,
    therapist,
    patient,
    title,
    description,
    cost,
    serviceId,
  } = payload;

  if (!start || !end || !title) {
    return NextResponse.json(
      { success: false, msg: "Faltan campos obligatorios (start, end, title)" },
      { status: 400 }
    );
  }

  try {
    await dbConnect();

    await DateModel.create({
      idDate,
      date,
      start,
      end,
      duration,
      therapist: therapist?._id || therapist,
      patient: patient?._id || patient,
      title,
      description,
      cost,
      serviceId,
    });

    return NextResponse.json(
      { success: true, msg: "Cita creada con éxito" },
      { status: 201, ...noStore }
    );
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      const errorList = Object.values(error.errors).map((e) => e.message);
      return NextResponse.json(
        { success: false, msg: errorList },
        { status: 400 }
      );
    }
    return errorResponse(error, 500);
  }
}

export async function GET() {
  try {
    await dbConnect();
    // Asegúrate de que tu .populate se vea así:
const date = await DateModel.find()
  .populate({
    path: 'therapist',
    populate: { path: 'therapistProfile' } // Esto trae los datos del perfil
  })
  .populate({
    path: 'patient',
    populate: { path: 'patientProfile' } // Esto trae los datos del perfil
  });

    return NextResponse.json({ success: true, date }, { status: 200, ...noStore });
  } catch (error) {
    return errorResponse(error, 500);
  }
}

export async function DELETE(req) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { success: false, msg: "Falta el parámetro id" },
        { status: 400 }
      );
    }
    await dbConnect();
    const deleted = await DateModel.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, msg: "Cita no encontrada" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: true, msg: "Cita eliminada" },
      { status: 200, ...noStore }
    );
  } catch (error) {
    return errorResponse(error, 500);
  }
}
