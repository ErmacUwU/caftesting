import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";

const REGION = process.env.S3_BUCKET_REGION;
const ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY;
const BUCKET = process.env.S3_BUCKET_NAME;

if (!REGION || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY || !BUCKET) {
  throw new Error("Faltan variables de entorno S3_...");
}

const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
});

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  if (!searchParams.get("list")) {
    return NextResponse.json({ error: "Use ?list=true" }, { status: 400 });
  }
  const data = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET }));
  return NextResponse.json({ files: data.Contents || [] });
}

export async function POST(req) {
  const { name, type } = await req.json();
  const cmd = new PutObjectCommand({ Bucket: BUCKET, Key: name, ContentType: type });
  const url = await getSignedUrl(s3, cmd, { expiresIn: 3600 });
  return NextResponse.json({ url });
}

export async function DELETE(req) {
  const { searchParams } = new URL(req.url);
  const fileName = searchParams.get("fileName");
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: fileName }));
  return NextResponse.json({ message: "Archivo eliminado" });
}
