import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import File from "@/models/File";
import UserTrue from "@/models/UserTrue"; // Importamos el modelo unificado
import PatientU from "@/models/PatientU"; // Importante para que populate funcione
import TherapistU from "@/models/TherapistU"; // Importante para que populate funcione
import mongoose from "mongoose";

export const runtime = "nodejs";

function extractS3Key(url = "") {
  try {
    const u = new URL(url);
    return u.pathname.replace(/^\/+/, "");
  } catch {
    return "";
  }
}

const isObjectId = (v = "") => typeof v === "string" && /^[0-9a-fA-F]{24}$/.test(v);

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
      patient: patientUserId,   // Recibimos el ID del UserTrue
      therapist: therapistUserId, // Recibimos el ID del UserTrue
      key: keyFromBody,
    } = body || {};

    // 1. Validación estricta de campos
    if (!name || !type || !size || !url || !patientUserId || !therapistUserId) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: name, type, size, url, patient, therapist" },
        { status: 400 }
      );
    }

    const key = keyFromBody || extractS3Key(url) || name;

    let patientName = "";
    let therapistName = "";

    // 2. Buscamos nombres a través del modelo UserTrue + Populate
    const lookups = [];

    if (isObjectId(patientUserId)) {
      lookups.push(
        UserTrue.findById(patientUserId)
          .populate("patientProfile")
          .lean()
          .then((u) => {
            if (u?.patientProfile) {
              patientName = `${u.patientProfile.firstName || ""} ${u.patientProfile.lastName || ""}`.trim();
            }
          })
      );
    }

    if (isObjectId(therapistUserId)) {
      lookups.push(
        UserTrue.findById(therapistUserId)
          .populate("therapistProfile")
          .lean()
          .then((u) => {
            if (u?.therapistProfile) {
              therapistName = `${u.therapistProfile.firstName || ""} ${u.therapistProfile.lastName || ""}`.trim();
            }
          })
      );
    }

    await Promise.all(lookups);

    // 3. Crear el documento en la base de datos
    const doc = await File.create({
      name,
      type,
      size,
      url,
      key,
      notes,
      images: Array.isArray(images) ? images : [],
      // Guardamos los IDs originales del UserTrue para referencia futura
      patientId: isObjectId(patientUserId) ? new mongoose.Types.ObjectId(patientUserId) : undefined,
      therapistId: isObjectId(therapistUserId) ? new mongoose.Types.ObjectId(therapistUserId) : undefined,
      
      // Guardamos los nombres extraídos de los perfiles anidados
      patientName: patientName || "Paciente no identificado",
      therapistName: therapistName || "Terapeuta no identificado",

      // Campos de compatibilidad (por si tu frontend los espera así)
      patient: patientName || patientUserId, 
      therapist: therapistName || therapistUserId,
    });

    return NextResponse.json({ file: doc }, { status: 201 });

  } catch (err) {
    if (err?.name === "ValidationError") {
      console.error("[POST /api/reports] ValidationError:", err?.errors || err);
      return NextResponse.json({ error: "La validación del archivo falló", detail: err.message }, { status: 400 });
    }
    console.error("[POST /api/reports] error:", err);
    return NextResponse.json({ error: "Error interno al guardar el reporte" }, { status: 500 });
  }
}