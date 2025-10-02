import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import File from "@/models/File";
import Patient from "@/models/Patient";
import Therapist from "@/models/Therapist";
import mongoose from "mongoose";

export const runtime = "nodejs";

function extractS3Key(url = "") {
  try {
    const u = new URL(url);
    // quita el / inicial
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
      patient: patientId,
      therapist: therapistId,
      key: keyFromBody,
    } = body || {};

    if (!name || !type || !size || !url || !patientId || !therapistId) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: name, type, size, url, patient, therapist" },
        { status: 400 }
      );
    }

    const key = keyFromBody || extractS3Key(url) || name;

    let patientName = "";
    let therapistName = "";

    const lookups = [];
    if (isObjectId(patientId)) {
      lookups.push(Patient.findById(patientId).lean().then((p) => {
        if (p) patientName = `${p.firstName || ""} ${p.lastName || ""}`.trim();
      }));
    }
    if (isObjectId(therapistId)) {
      lookups.push(Therapist.findById(therapistId).lean().then((t) => {
        if (t) therapistName = `${t.firstName || ""} ${t.lastName || ""}`.trim();
      }));
    }
    await Promise.all(lookups);

    const doc = await File.create({
      name,
      type,
      size,
      url,
      key,
      notes,
      images: Array.isArray(images) ? images : [],
      patientId: isObjectId(patientId) ? new mongoose.Types.ObjectId(patientId) : undefined,
      therapistId: isObjectId(therapistId) ? new mongoose.Types.ObjectId(therapistId) : undefined,
      patientName,
      therapistName,

      patient: patientName || patientId, 
      therapist: therapistName || therapistId,
    });

    return NextResponse.json({ file: doc }, { status: 201 });
  } catch (err) {

    if (err?.name === "ValidationError") {
      console.error("[POST /api/reports] ValidationError:", err?.errors || err);
      return NextResponse.json({ error: "Validación falló en File", detail: err.message }, { status: 400 });
    }
    console.error("[POST /api/reports] error:", err);
    return NextResponse.json({ error: "Error al guardar el reporte" }, { status: 500 });
  }
}
