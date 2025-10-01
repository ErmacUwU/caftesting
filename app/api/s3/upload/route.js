import { NextResponse } from "next/server";
import { S3Client, ListObjectsV2Command, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const runtime = "nodejs";

const AWS_REGION = process.env.AWS_REGION || process.env.AWS_BUCKET_REGION;
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_KEY;
const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME;

function ensureEnv() {
  const missing = [];
  if (!AWS_REGION) missing.push("AWS_REGION/AWS_BUCKET_REGION");
  if (!AWS_ACCESS_KEY_ID) missing.push("AWS_ACCESS_KEY_ID/AWS_ACCESS_KEY");
  if (!AWS_SECRET_ACCESS_KEY) missing.push("AWS_SECRET_ACCESS_KEY/AWS_SECRET_KEY");
  if (!AWS_BUCKET_NAME) missing.push("AWS_BUCKET_NAME");
  if (missing.length) {
    throw new Error(`Faltan variables de entorno: ${missing.join(", ")}`);
  }
}
ensureEnv();

const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    if (!searchParams.get("list")) {
      return NextResponse.json({ error: "Use ?list=true" }, { status: 400 });
    }
    const data = await s3Client.send(new ListObjectsV2Command({ Bucket: AWS_BUCKET_NAME }));
    const files = (data.Contents || []).map(f => ({
      name: f.Key,
      lastModified: f.LastModified,
      size: f.Size,
    }));
    return NextResponse.json({ files }, { status: 200 });
  } catch (err) {
    console.error("[GET /api/s3/upload] error:", err);
    return NextResponse.json({ error: "Error al listar los archivos" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { name, type } = await req.json();
    if (!name || !type) {
      return NextResponse.json({ error: "name y type son requeridos" }, { status: 400 });
    }
    const command = new PutObjectCommand({ Bucket: AWS_BUCKET_NAME, Key: name, ContentType: type });
    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return NextResponse.json({ url }, { status: 200 });
  } catch (err) {
    console.error("[POST /api/s3/upload] error:", err);
    return NextResponse.json({ error: "Error al obtener la URL firmada" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const fileName = searchParams.get("fileName");
    if (!fileName) {
      return NextResponse.json({ error: "fileName es requerido" }, { status: 400 });
    }
    await s3Client.send(new DeleteObjectCommand({ Bucket: AWS_BUCKET_NAME, Key: fileName }));
    return NextResponse.json({ message: "Archivo eliminado con éxito" }, { status: 200 });
  } catch (err) {
    console.error("[DELETE /api/s3/upload] error:", err);
    return NextResponse.json({ error: "Error al eliminar el archivo" }, { status: 500 });
  }
}
