// Endpoint de SOLO LECTURA para sistemas externos (p. ej. otra aplicación
// que necesita los nombres de los pacientes sin duplicar la base de datos).
//
// - Requiere la clave secreta EXTERNAL_API_KEY (variable de entorno) en el
//   encabezado `x-api-key` o como `Authorization: Bearer <clave>`.
// - Devuelve solo id, nombre, apellido y estado; nunca CURP, contactos,
//   direcciones ni estado de cuenta.
//
// Parámetros opcionales:
//   ?estado=activo (por defecto) | inactivo | todos
//   ?buscar=texto  (sin importar mayúsculas ni acentos)
//   ?id=<id del paciente>  (un solo paciente)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import crypto from "crypto";
import mongoose from "mongoose";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import PatientU from "@/models/PatientU";
import { normalizeSearchText } from "@/lib/searchText";

const noStore = { "Cache-Control": "no-store" };

function json(body, status = 200) {
  return NextResponse.json(body, { status, headers: noStore });
}

function sha256(text) {
  return crypto.createHash("sha256").update(String(text)).digest();
}

// Comparación en tiempo constante para no filtrar la clave por tiempos de respuesta.
function claveValida(req) {
  const esperada = process.env.EXTERNAL_API_KEY;
  if (!esperada) return null; // No configurada en el servidor.

  const auth = req.headers.get("authorization") || "";
  const recibida =
    req.headers.get("x-api-key") ||
    (auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "");
  if (!recibida) return false;

  return crypto.timingSafeEqual(sha256(recibida), sha256(esperada));
}

function formato(p) {
  return {
    id: p.userId?.toString(), // Mismo id que usan las citas (dates.patient)
    nombre: p.firstName || "",
    apellido: p.lastName || "",
    estado: p.patientStatus || "",
  };
}

export async function GET(req) {
  const valida = claveValida(req);
  if (valida === null) {
    console.error("[/api/externo/pacientes] Falta EXTERNAL_API_KEY en el servidor");
    return json({ error: "Servicio no configurado" }, 503);
  }
  if (!valida) {
    return json({ error: "Clave de acceso inválida o ausente" }, 401);
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const estado = (searchParams.get("estado") || "activo").toLowerCase();
  const buscar = normalizeSearchText(searchParams.get("buscar"));

  if (!["activo", "inactivo", "todos"].includes(estado)) {
    return json({ error: "estado debe ser activo, inactivo o todos" }, 400);
  }
  if (id && !mongoose.isValidObjectId(id)) {
    return json({ error: "id inválido" }, 400);
  }

  try {
    await dbConnect();

    const filtro = {};
    if (id) filtro.userId = id;
    else if (estado !== "todos") filtro.patientStatus = estado;

    const docs = await PatientU.find(filtro)
      .select("userId firstName lastName patientStatus")
      .lean();

    if (id) {
      if (!docs.length) return json({ error: "Paciente no encontrado" }, 404);
      return json({ paciente: formato(docs[0]) });
    }

    const pacientes = docs
      .map(formato)
      .filter(
        (p) => !buscar || normalizeSearchText(`${p.nombre} ${p.apellido}`).includes(buscar)
      )
      .sort((a, b) =>
        `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`, "es", {
          sensitivity: "base",
        })
      );

    return json({ total: pacientes.length, pacientes });
  } catch (error) {
    console.error("[/api/externo/pacientes] error:", error);
    return json({ error: "Error interno del servidor" }, 500);
  }
}
