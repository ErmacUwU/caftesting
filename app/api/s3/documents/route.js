import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import File from "@/models/File";
import mongoose from "mongoose";

export const runtime = "nodejs";

function escRe(s = "") {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
const isObjectId = (v = "") =>
  typeof v === "string" && /^[0-9a-fA-F]{24}$/.test(v);

export async function POST(req) {
  try {
    await dbConnect();
    const { patients = [], therapists = [] } = await req.json();

    const patientIds = patients.filter(isObjectId).map((id) => new mongoose.Types.ObjectId(id));
    const therapistIds = therapists.filter(isObjectId).map((id) => new mongoose.Types.ObjectId(id));

    const patientNames = patients
      .filter((v) => !isObjectId(v))
      .map((n) => new RegExp(`^${escRe(String(n).trim())}$`, "i"));

    const therapistNames = therapists
      .filter((v) => !isObjectId(v))
      .map((n) => new RegExp(`^${escRe(String(n).trim())}$`, "i"));

    const and = [];

    if (patientIds.length || patientNames.length) {
      and.push({
        $or: [
          ...(patientIds.length ? [{ patientId: { $in: patientIds } }] : []),
          ...(patientNames.length ? [{ patientName: { $in: patientNames } }, { patient: { $in: patientNames } }] : []),
        ],
      });
    }

    if (therapistIds.length || therapistNames.length) {
      and.push({
        $or: [
          ...(therapistIds.length ? [{ therapistId: { $in: therapistIds } }] : []),
          ...(therapistNames.length ? [{ therapistName: { $in: therapistNames } }, { therapist: { $in: therapistNames } }] : []), 
        ],
      });
    }

    const query = and.length ? { $and: and } : {};
    const docs = await File.find(query).sort({ createdAt: -1 }).lean();

    const out = docs.map((d) => ({
      _id: d._id,
      name: d.name,
      type: d.type,
      size: d.size,
      url: d.url,
      key: d.key,
      notes: d.notes ?? "",
      images: d.images ?? [],
      patient: d.patientName || d.patient || "",
      therapist: d.therapistName || d.therapist || "",
      patientId: d.patientId || null,
      therapistId: d.therapistId || null,
      createdAt: d.createdAt,
    }));

    return NextResponse.json({ documents: out }, { status: 200 });
  } catch (err) {
    console.error("[/api/s3/documents][POST] error:", err);
    return NextResponse.json(
      { error: "Error interno al consultar documentos" },
      { status: 500 }
    );
  }
}
