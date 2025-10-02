import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import File from "@/models/File";
import mongoose from "mongoose";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

export const runtime = "nodejs";

// ====== utilidades existentes ======
function escRe(s = "") {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
const isObjectId = (v = "") =>
  typeof v === "string" && /^[0-9a-fA-F]{24}$/.test(v);
function normName(s = "") {
  return String(s).replace(/\s+/g, " ").trim();
}
function nameToLooseRegex(name = "") {
  const n = normName(name);
  const pattern = `^\\s*${escRe(n).replace(/\s+/g, "\\s+")}\\s*$`;
  return new RegExp(pattern, "i");
}

// ====== cliente S3 ======
function getS3Client() {
  const region =
    process.env.AWS_REGION ||
    process.env.AWS_BUCKET_REGION ||
    process.env.S3_REGION;
  const accessKeyId =
    process.env.AWS_ACCESS_KEY_ID ||
    process.env.AWS_ACCESS_KEY ||
    process.env.S3_ACCESS_KEY_ID ||
    process.env.S3_ACCESS_KEY;
  const secretAccessKey =
    process.env.AWS_SECRET_ACCESS_KEY ||
    process.env.AWS_SECRET_KEY ||
    process.env.S3_SECRET_ACCESS_KEY ||
    process.env.S3_SECRET_KEY;

  if (!region || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "Faltan credenciales/region de AWS: configure AWS_REGION/AWS_BUCKET_REGION, AWS_ACCESS_KEY_ID/AWS_ACCESS_KEY y AWS_SECRET_ACCESS_KEY/AWS_SECRET_KEY"
    );
  }

  return new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });
}

function getBucketName() {
  const bucket =
    process.env.AWS_BUCKET_NAME || process.env.S3_BUCKET_NAME;
  if (!bucket) throw new Error("Falta AWS_BUCKET_NAME/S3_BUCKET_NAME");
  return bucket;
}

// ====== LISTAR (NO CAMBIADO) ======
export async function POST(req) {
  try {
    await dbConnect();

    const body = await req.json();
    const { patients = [], therapists = [] } = body ?? {};

    const patientIds = patients.filter(isObjectId).map((id) => new mongoose.Types.ObjectId(id));
    const therapistIds = therapists.filter(isObjectId).map((id) => new mongoose.Types.ObjectId(id));

    const patientNameRegexes = patients
      .filter((v) => !isObjectId(v))
      .map((n) => nameToLooseRegex(n));

    const therapistNameRegexes = therapists
      .filter((v) => !isObjectId(v))
      .map((n) => nameToLooseRegex(n));

    const and = [];

    if (patientIds.length || patientNameRegexes.length) {
      and.push({
        $or: [
          ...(patientIds.length ? [{ patientId: { $in: patientIds } }] : []),
          ...(patientNameRegexes.length
            ? [
                { patientName: { $in: patientNameRegexes } },
                { patient: { $in: patientNameRegexes } },
              ]
            : []),
        ],
      });
    }

    if (therapistIds.length || therapistNameRegexes.length) {
      and.push({
        $or: [
          ...(therapistIds.length ? [{ therapistId: { $in: therapistIds } }] : []),
          ...(therapistNameRegexes.length
            ? [
                { therapistName: { $in: therapistNameRegexes } },
                { therapist: { $in: therapistNameRegexes } },
              ]
            : []),
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

// ====== BORRAR (S3 + Mongo) ======
export async function DELETE(req) {
  try {
    await dbConnect();
    const { id, key } = await req.json();

    if (!id && !key) {
      return NextResponse.json(
        { error: "Debes enviar al menos id o key" },
        { status: 400 }
      );
    }

    let fileDoc = null;

    // Si no viene key, intento obtenerlo desde Mongo por id
    if (!key && id) {
      fileDoc = await File.findById(id).lean();
      if (!fileDoc) {
        // no existe en Mongo; no hay manera fiable de borrar en S3 sin key
        return NextResponse.json(
          { error: "No se encontró el registro en BD para ese id" },
          { status: 404 }
        );
      }
    }

    const s3Key = key || fileDoc?.key || fileDoc?.name || null;

    // Intento borrar en S3 si tengo key
    if (s3Key) {
      try {
        const s3 = getS3Client();
        const bucket = getBucketName();
        await s3.send(
          new DeleteObjectCommand({
            Bucket: bucket,
            Key: s3Key,
          })
        );
      } catch (s3err) {
        // registro y sigo; si falla S3 pero se puede borrar la BD, devuelvo 207 Multi-Status
        console.error("[DELETE /api/s3/documents] S3 delete error:", s3err);
      }
    }

    // Borro en Mongo si hay id
    let mongoResult = null;
    if (id) {
      mongoResult = await File.deleteOne({ _id: id });
    } else if (s3Key) {
      // fallback: si no hay id, intento por key
      mongoResult = await File.deleteOne({ key: s3Key });
    }

    return NextResponse.json(
      {
        ok: true,
        deletedFromMongo: Boolean(mongoResult?.deletedCount),
        deletedKey: s3Key || null,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[/api/s3/documents][DELETE] error:", err);
    return NextResponse.json(
      { error: "Error al eliminar el documento" },
      { status: 500 }
    );
  }
}
