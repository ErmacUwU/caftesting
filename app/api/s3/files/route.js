import { NextResponse } from "next/server";
import mongoose from "mongoose";
import File from "@/models/File.js";

async function connectToDatabase() {
  if (mongoose.connection.readyState !== 1) {
    const uri = process.env.MONGO_URI;
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

export async function POST(req) {
  try {
    await connectToDatabase();

    const body = await req.json();
    const { name, type, size, url, therapist, patient, notes = "", images = [] } = body;

    if (!name || !type || !size || !url || !therapist || !patient) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios: name, type, size, url, therapist, patient" },
        { status: 400 }
      );
    }

    const key = extractS3Key(url) || name;

    const file = await File.create({
      name,
      type,
      size,
      url,
      key,
      therapist,
      patient,
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
