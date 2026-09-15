/* export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import dbConnect from "@/lib/dbConnect";
import DateModel from "@/models/Date";

import "@/models/Therapist";
import "@/models/Patient";
import "@/models/Service";

import mongoose from "mongoose";
import { NextResponse } from "next/server";

function errorResponse(error, status = 500) {

  console.error("[/api/date] error:", error);
  const message = error?.message || "Error interno del servidor";
  return NextResponse.json({ success: false, msg: message }, { status });
}

const noStore = {
  headers: { "Cache-Control": "no-store" },
};

export async function POST(req) {
  let payload;
  try {
    payload = await req.json();
  } catch (e) {
    return NextResponse.json(
      { success: false, msg: "JSON inválido" },
      { status: 400 }
    );
  }

  const {
    idDate,
    date,
    start,
    end,
    duration,
    therapist,
    patient,
    title,
    description,
    cost,
    serviceId,
  } = payload;

  if (!start || !end || !title) {
    return NextResponse.json(
      { success: false, msg: "Faltan campos obligatorios (start, end, title)" },
      { status: 400 }
    );
  }

  try {
    await dbConnect();

    await DateModel.create({
      idDate,
      date,
      start,
      end,
      duration,
      therapist: therapist?._id || therapist,
      patient: patient?._id || patient,
      title,
      description,
      cost,
      serviceId,
    });

    return NextResponse.json(
      { success: true, msg: "Cita creada con éxito" },
      { status: 201, ...noStore }
    );
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      const errorList = Object.values(error.errors).map((e) => e.message);
      return NextResponse.json(
        { success: false, msg: errorList },
        { status: 400 }
      );
    }
    return errorResponse(error, 500);
  }
}

export async function GET() {
  try {
    await dbConnect();
    // Asegúrate de que tu .populate se vea así:
const date = await DateModel.find()
  .populate({
    path: 'therapist',
    populate: { path: 'therapistProfile' } // Esto trae los datos del perfil
  })
  .populate({
    path: 'patient',
    populate: { path: 'patientProfile' } // Esto trae los datos del perfil
  });

    return NextResponse.json({ success: true, date }, { status: 200, ...noStore });
  } catch (error) {
    return errorResponse(error, 500);
  }
}

export async function DELETE(req) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { success: false, msg: "Falta el parámetro id" },
        { status: 400 }
      );
    }
    await dbConnect();
    const deleted = await DateModel.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, msg: "Cita no encontrada" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: true, msg: "Cita eliminada" },
      { status: 200, ...noStore }
    );
  } catch (error) {
    return errorResponse(error, 500);
  }
} */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import dbConnect from "@/lib/dbConnect";
import DateModel from "@/models/Date";

import "@/models/Therapist";
import "@/models/PatientU";
import "@/models/Service";
import "@/models/UserTrue";
import "@/models/TherapistU";

import mongoose from "mongoose";
import { NextResponse } from "next/server";

function errorResponse(error, status = 500) {
  console.error("[/api/date] error:", error);
  const message = error?.message || "Error interno del servidor";
  return NextResponse.json({ success: false, msg: message }, { status });
}

const noStore = {
  headers: { "Cache-Control": "no-store" },
};

function toDoc(fields) {
  const {
    idDate,
    date,
    start,
    end,
    duration,
    therapist,
    patient,
    title,
    description,
    cost,
    serviceId,
    recurrenceGroupId,
  } = fields;

  return {
    idDate,
    date,
    start,
    end,
    duration,
    therapist: therapist?._id || therapist,
    patient: patient?._id || patient,
    title,
    description,
    cost,
    serviceId,
    recurrenceGroupId: recurrenceGroupId || null,
  };
}

export async function POST(req) {
  let payload;
  try {
    payload = await req.json();
  } catch (e) {
    return NextResponse.json(
      { success: false, msg: "JSON inválido" },
      { status: 400 }
    );
  }

  // 🔁 Creación en lote: citas recurrentes que comparten recurrenceGroupId.
  // Si el cliente envía `occurrences`, cada elemento es una cita completa
  // (misma forma que el payload individual de siempre).
  if (Array.isArray(payload.occurrences)) {
    const { occurrences } = payload;

    if (occurrences.length === 0) {
      return NextResponse.json(
        { success: false, msg: "No hay ocurrencias para crear" },
        { status: 400 }
      );
    }

    const invalid = occurrences.find((o) => !o.start || !o.end || !o.title);
    if (invalid) {
      return NextResponse.json(
        {
          success: false,
          msg: "Faltan campos obligatorios (start, end, title) en alguna ocurrencia",
        },
        { status: 400 }
      );
    }

    try {
      await dbConnect();

      const docs = occurrences.map(toDoc);
      const created = await DateModel.insertMany(docs);

      return NextResponse.json(
        { success: true, msg: "Citas recurrentes creadas con éxito", count: created.length },
        { status: 201, ...noStore }
      );
    } catch (error) {
      if (error instanceof mongoose.Error.ValidationError) {
        const errorList = Object.values(error.errors).map((e) => e.message);
        return NextResponse.json(
          { success: false, msg: errorList },
          { status: 400 }
        );
      }
      return errorResponse(error, 500);
    }
  }

  const {
    idDate,
    date,
    start,
    end,
    duration,
    therapist,
    patient,
    title,
    description,
    cost,
    serviceId,
    recurrenceGroupId,
  } = payload;

  if (!start || !end || !title) {
    return NextResponse.json(
      { success: false, msg: "Faltan campos obligatorios (start, end, title)" },
      { status: 400 }
    );
  }

  try {
    await dbConnect();

    await DateModel.create(
      toDoc({
        idDate,
        date,
        start,
        end,
        duration,
        therapist,
        patient,
        title,
        description,
        cost,
        serviceId,
        recurrenceGroupId,
      })
    );

    return NextResponse.json(
      { success: true, msg: "Cita creada con éxito" },
      { status: 201, ...noStore }
    );
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      const errorList = Object.values(error.errors).map((e) => e.message);
      return NextResponse.json(
        { success: false, msg: errorList },
        { status: 400 }
      );
    }
    return errorResponse(error, 500);
  }
}

// 🚀 GET OPTIMIZADO Y COMPATIBLE
export async function GET(req) {
  try {
    await dbConnect();

    // 1. Lee rangos de fecha opcionales enviadas en la URL (p. ej. por FullCalendar)
    const { searchParams } = new URL(req.url);
    const startParam = searchParams.get("start");
    const endParam = searchParams.get("end");

    let query = {};
    if (startParam && endParam) {
      query = {
        start: { $gte: new Date(startParam), $lte: new Date(endParam) },
      };
    }

    // 2. Trae paciente y terapeuta, pero solo los campos que la UI
    // realmente usa (nombre). Antes se traía el perfil completo (incluye
    // arreglos de contactos, direcciones, etc. en el caso de pacientes) y
    // hasta el hash de contraseña del UserTrue para CADA cita. No cambia
    // qué citas se devuelven ni la forma en que la UI las consume (los
    // mismos firstName/lastName siguen ahí).
    //
    // batchSize(): el driver de Mongo, por defecto, trae los resultados en
    // lotes de ~100 documentos (una ida y vuelta al servidor por lote). Con
    // pocas citas no se notaba, pero con miles de registros esas decenas de
    // idas y vueltas (cada una pagando la latencia de red hacia el clúster)
    // eran el verdadero cuello de botella — no el tamaño de los datos ni el
    // populate. Pedir un lote grande trae todo en un solo viaje.
    const date = await DateModel.find(query)
      .populate({
        path: "therapist",
        select: "email role",
        populate: { path: "therapistProfile", select: "firstName lastName" },
      })
      .populate({
        path: "patient",
        select: "email role",
        populate: { path: "patientProfile", select: "firstName lastName" },
      })
      .batchSize(10000)
      .lean(); // ⚡ Mantiene la velocidad ultra rápida evitando la sobrecarga de Mongoose

    return NextResponse.json({ success: true, date }, { status: 200, ...noStore });
  } catch (error) {
    return errorResponse(error, 500);
  }
}

export async function DELETE(req) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    // "single" (por defecto, comportamiento previo) o "future_series"
    // para borrar la cita actual y todas las futuras del mismo grupo recurrente.
    const mode = req.nextUrl.searchParams.get("mode") || "single";

    if (!id) {
      return NextResponse.json(
        { success: false, msg: "Falta el parámetro id" },
        { status: 400 }
      );
    }
    await dbConnect();

    if (mode === "future_series") {
      const target = await DateModel.findById(id);
      if (!target) {
        return NextResponse.json(
          { success: false, msg: "Cita no encontrada" },
          { status: 404 }
        );
      }

      if (target.recurrenceGroupId) {
        const result = await DateModel.deleteMany({
          recurrenceGroupId: target.recurrenceGroupId,
          start: { $gte: target.start },
        });
        return NextResponse.json(
          { success: true, msg: "Citas eliminadas", count: result.deletedCount },
          { status: 200, ...noStore }
        );
      }

      // No pertenece a una serie: se comporta como borrado simple.
      await DateModel.findByIdAndDelete(id);
      return NextResponse.json(
        { success: true, msg: "Cita eliminada" },
        { status: 200, ...noStore }
      );
    }

    const deleted = await DateModel.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, msg: "Cita no encontrada" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: true, msg: "Cita eliminada" },
      { status: 200, ...noStore }
    );
  } catch (error) {
    return errorResponse(error, 500);
  }
}
