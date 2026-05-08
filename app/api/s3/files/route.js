import { NextResponse } from "next/server";
import mongoose from "mongoose";
import File from "@/models/File";

export const runtime = "nodejs";

async function connectToDatabase() {
  if (mongoose.connection.readyState !== 1) {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!uri) throw new Error("Falta MONGO_URI en variables de entorno");
    await mongoose.connect(uri);
  }
}

function extractS3Key(url = "") {
  try {
    const u = new URL(url);
    return u.pathname.replace(/^\/+/, "");
  } catch {
    return "";
  }
}

function toStr(v) {
  return typeof v === "string" ? v.trim() : "";
}

export async function POST(req) {
  try {
    await connectToDatabase();

    const body = await req.json();
    
    // Extraemos datos
    const name = toStr(body.name);
    const type = toStr(body.type);
    const url  = toStr(body.url);
    const size = Number(body.size || 0);
    const notes = toStr(body.notes);
    const images = Array.isArray(body.images) ? body.images.filter(s => typeof s === "string") : [];

    // --- IMPORTANTE: Capturamos IDs y Nombres ---
    const patientId = body.patientId || null;
    const therapistId = body.therapistId || null;
    const patientName = toStr(body.patientName || body.patient);
    const therapistName = toStr(body.therapistName || body.therapist);

    if (!name || !url || !patientName || !therapistName) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios: name, url, patientName, therapistName" },
        { status: 400 }
      );
    }

    const key = extractS3Key(url) || name;

    // Creamos el registro incluyendo los IDs para que el populate funcione después
    const file = await File.create({
      name,
      type,
      size,
      url,
      key,
      patientId,    // ID de UserTrue
      therapistId,  // ID de UserTrue
      patientName,  // Texto de respaldo
      therapistName, // Texto de respaldo
      notes,
      images,
    });

    return NextResponse.json(
      { message: "Archivo registrado con éxito", file },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/s3/files] error:", err);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}