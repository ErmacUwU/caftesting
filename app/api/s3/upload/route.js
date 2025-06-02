// app/api/s3/upload/route.js
import {
    S3Client,
    PutObjectCommand,
    ListObjectsV2Command,
    DeleteObjectCommand,
  } from "@aws-sdk/client-s3";
  import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
  import { NextResponse } from "next/server";
  
  const s3Client = new S3Client({
    region: "process.env.AWS_BUCKET_REGION",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_SECRET_KEY,
    },
  });
  
  const bucketName = process.env.AWS_BUCKET_NAME;
  
  // ⬆️ POST → Generar URL firmada
  export async function POST(req) {
    try {
      const { name, type } = await req.json();
  
      const params = {
        Bucket: bucketName,
        Key: name,
        ContentType: type,
      };
  
      const command = new PutObjectCommand(params);
      const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  
      return NextResponse.json({ url });
    } catch (error) {
      console.error("Error al generar URL firmada:", error);
      return NextResponse.json({ error: "Error al generar URL firmada" }, { status: 500 });
    }
  }
  
  // 📥 GET → Listar archivos
  export async function GET() {
    try {
      const command = new ListObjectsV2Command({ Bucket: bucketName });
      const data = await s3Client.send(command);
  
      const files = data.Contents?.map((file) => ({
        name: file.Key,
        lastModified: file.LastModified,
      })) || [];
  
      return NextResponse.json({ files });
    } catch (error) {
      console.error("Error al listar archivos:", error);
      return NextResponse.json({ error: "Error al listar archivos" }, { status: 500 });
    }
  }
  
  // ❌ DELETE → Eliminar archivo
  export async function DELETE(req) {
    const { searchParams } = new URL(req.url);
    const fileName = searchParams.get("fileName");
  
    if (!fileName) {
      return NextResponse.json({ error: "No se proporcionó el nombre del archivo" }, { status: 400 });
    }
  
    try {
      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: fileName,
      });
  
      await s3Client.send(command);
  
      return NextResponse.json({ message: "Archivo eliminado con éxito" });
    } catch (error) {
      console.error("Error al eliminar archivo:", error);
      return NextResponse.json({ error: "Error al eliminar el archivo" }, { status: 500 });
    }
  }
  