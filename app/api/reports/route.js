import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import File from "@/models/File";
import Patient from "@/models/Patient";
import Therapist from "@/models/Therapist";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();

    const {
      name,
      type,
      size,
      url,
      notes = "",
      images = [],
      patient: patientId,
      therapist: therapistId,
      key,
    } = body;

    if (!name || !type || !size || !url || !patientId || !therapistId) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    const [p, t] = await Promise.all([
      Patient.findById(patientId).lean(),
      Therapist.findById(therapistId).lean(),
    ]);

    const patientName = p ? `${p.firstName} ${p.lastName || ""}`.trim() : "";
    const therapistName = t ? `${t.firstName} ${t.lastName || ""}`.trim() : "";

    const saved = await File.create({
      name,
      type,
      size,
      url,
      key,
      notes,
      images,
      patientId,
      therapistId,
      patientName,
      therapistName,

      patient: patientName,
      therapist: therapistName,
    });

    return NextResponse.json({ file: saved }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/reports] error:", err);
    return NextResponse.json(
      { error: "Error al guardar el reporte" },
      { status: 500 }
    );
  }
}
