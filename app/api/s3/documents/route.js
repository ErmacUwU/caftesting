import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import File from "@/models/File";
import UserTrue from "@/models/UserTrue";
import PatientU from "@/models/PatientU";
import TherapistU from "@/models/TherapistU";
import mongoose from "mongoose";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

export const runtime = "nodejs";

// ====== UTILIDADES DE BÚSQUEDA ======
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

// ====== CONFIGURACIÓN CLIENTE S3 ======
function getS3Client() {
  const region = process.env.AWS_REGION || process.env.AWS_BUCKET_REGION || process.env.S3_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY || process.env.S3_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_KEY || process.env.S3_SECRET_ACCESS_KEY || process.env.S3_SECRET_KEY;

  if (!region || !accessKeyId || !secretAccessKey) {
    throw new Error("Faltan credenciales de AWS en las variables de entorno");
  }

  return new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });
}

function getBucketName() {
  const bucket = process.env.AWS_BUCKET_NAME || process.env.S3_BUCKET_NAME;
  if (!bucket) throw new Error("Falta la variable AWS_BUCKET_NAME");
  return bucket;
}

// ====== MÉTODO POST: LISTAR Y FILTRAR ======
// ====== MÉTODO POST: LISTAR Y FILTRAR ======
export async function POST(req) {
  try {
    await dbConnect();

    const body = await req.json();
    const { patients = [], therapists = [] } = body ?? {};

    // 1. OBTENER INFORMACIÓN DE PERFILES PARA BÚSQUEDA POR TEXTO (SOPORTE DATOS VIEJOS)
    // Buscamos los nombres reales de los IDs seleccionados para buscar también por strings
    const selectedPatientsDocs = await UserTrue.find({ 
      _id: { $in: patients.filter(isObjectId) } 
    }).populate("patientProfile").lean();
    
    const selectedTherapistsDocs = await UserTrue.find({ 
      _id: { $in: therapists.filter(isObjectId) } 
    }).populate("therapistProfile").lean();

    // Extraemos nombres para crear Regex (búsqueda flexible por texto)
    const pNames = selectedPatientsDocs.map(u => u.patientProfile?.firstName).filter(Boolean);
    const tNames = selectedTherapistsDocs.map(u => u.therapistProfile?.firstName).filter(Boolean);

    // 2. CONSTRUCCIÓN DE LA QUERY
    let query = {};
    let orConditions = [];

    // Filtro de Pacientes: Busca por ID OR por Nombre (en caso de que el ID no esté vinculado)
    if (patients.length > 0) {
      const pIds = patients.filter(isObjectId).map(id => new mongoose.Types.ObjectId(id));
      orConditions.push({
        $or: [
          { patientId: { $in: pIds } },
          { patientName: { $in: pNames.map(n => new RegExp(n, "i")) } },
          { patient: { $in: pNames.map(n => new RegExp(n, "i")) } }
        ]
      });
    }

    // Filtro de Terapeutas
    if (therapists.length > 0) {
      const tIds = therapists.filter(isObjectId).map(id => new mongoose.Types.ObjectId(id));
      orConditions.push({
        $or: [
          { therapistId: { $in: tIds } },
          { therapistName: { $in: tNames.map(n => new RegExp(n, "i")) } },
          { therapist: { $in: tNames.map(n => new RegExp(n, "i")) } }
        ]
      });
    }

    // LÓGICA DE BÚSQUEDA: 
    // Si no hay filtros seleccionados -> query vacía {} (Trae todo)
    // Si hay filtros -> usamos $or para que sea una suma de resultados
    if (orConditions.length > 0) {
      query = { $or: orConditions };
    }

    // 3. EJECUTAR CONSULTA CON POPULATE BLINDADO
    const docs = await File.find(query)
      .sort({ createdAt: -1 })
      .populate({
        path: "patientId",
        model: UserTrue,
        options: { strictPopulate: false },
        populate: { 
          path: "patientProfile", 
          model: PatientU, 
          options: { strictPopulate: false } 
        }
      })
      .populate({
        path: "therapistId",
        model: UserTrue,
        options: { strictPopulate: false },
        populate: { 
          path: "therapistProfile", 
          model: TherapistU, 
          options: { strictPopulate: false } 
        }
      })
      .lean();

    // 4. MAPEO Y FORMATEO DE RESPUESTA
    const out = docs.map((d) => {
      // Resolución de nombre de Paciente (Perfil > Campo Texto > "No asignado")
      let resolvedP = "No asignado";
      if (d.patientId?.patientProfile) {
        const prof = d.patientId.patientProfile;
        resolvedP = `${prof.firstName || ""} ${prof.lastName || ""}`;
      } else {
        resolvedP = d.patientName || d.patient || "No asignado";
      }

      // Resolución de nombre de Terapeuta
      let resolvedT = "No asignado";
      if (d.therapistId?.therapistProfile) {
        const prof = d.therapistId.therapistProfile;
        resolvedT = `${prof.firstName || ""} ${prof.lastName || ""}`;
      } else {
        resolvedT = d.therapistName || d.therapist || "No asignado";
      }

      return {
        _id: d._id,
        name: d.name || "Sin título",
        type: d.type || "Archivo",
        size: d.size || 0,
        url: d.url || "#",
        key: d.key || "",
        notes: d.notes || "",
        images: d.images || [],
        patientName: resolvedP.trim(),
        therapistName: resolvedT.trim(),
        createdAt: d.createdAt,
      };
    });

    return NextResponse.json({ documents: out }, { status: 200 });

  } catch (err) {
    console.error("[POST /api/s3/documents] Error crítico:", err);
    return NextResponse.json(
      { error: "Error interno al consultar documentos", details: err.message },
      { status: 500 }
    );
  }
}

// ====== MÉTODO DELETE: ELIMINAR S3 + MONGO ======
export async function DELETE(req) {
  try {
    await dbConnect();
    const { id, key } = await req.json();

    if (!id && !key) {
      return NextResponse.json({ error: "Faltan id o key" }, { status: 400 });
    }

    let fileDoc = null;
    if (!key && id) {
      fileDoc = await File.findById(id).lean();
      if (!fileDoc) {
        return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
      }
    }

    const s3Key = key || fileDoc?.key || fileDoc?.name || null;

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
        console.error("Error borrando en S3:", s3err);
      }
    }

    let mongoResult = null;
    if (id) {
      mongoResult = await File.deleteOne({ _id: id });
    } else if (s3Key) {
      mongoResult = await File.deleteOne({ key: s3Key });
    }

    return NextResponse.json({
      ok: true,
      deletedFromMongo: Boolean(mongoResult?.deletedCount),
      deletedKey: s3Key || null,
    });
  } catch (err) {
    console.error("[/api/s3/documents][DELETE] error:", err);
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}